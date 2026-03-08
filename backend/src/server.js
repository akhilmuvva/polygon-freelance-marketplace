import express from 'express';
import cors from 'cors';
import { verifyMessage, formatEther, createPublicClient, http, parseAbi } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { publicClient, testBlockchainConnection } from './config/blockchain.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import crypto from 'crypto';
import paymentRoutes from './routes/paymentRoutes.js';
import { SiweMessage } from 'siwe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { uploadJSONToIPFS, uploadFileToIPFS } from './services/ipfs.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import { body, validationResult } from 'express-validator';
import { GDPRService } from './services/gdpr.js';
import selfsigned from 'selfsigned';
import { logger } from './utils/logger.js';

// Helper for Regex escaping
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function validateEnv() {
    logger.info('--- Sovereign Environment Diagnostic ---', 'CONFIG');
    const gateway = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'GEMINI_API_KEY'];
    logger.info(`RAZORPAY: ${process.env.RAZORPAY_KEY_ID ? 'CONFIGURED' : 'NOT CONFIGURED'}`, 'CONFIG');
    logger.info(`RPC_URL: ${process.env.RPC_URL ? 'LOADED' : 'FALLBACK-READY'}`, 'CONFIG');
}

validateEnv();

testBlockchainConnection(logger).catch(() => {
    logger.warn('Continuing without verified blockchain connection.', 'BC');
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
});

export const app = express();
const PORT = process.env.PORT || 3001;

const REPUTATION_ADDRESS = process.env.REPUTATION_ADDRESS || '0x89791A9A3210667c828492DB98DCa3e2076cc373';
const REPUTATION_ABI = [{
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "portfolioCID",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
}];

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
            frameSrc: ["'self'", "https://api.razorpay.com"],
            connectSrc: ["'self'", "https://api.razorpay.com", "https://*.render.com", "wss://*.render.com", "https://polylance.codes", "https://api.polylance.codes", process.env.BACKEND_URL || "https://localhost:3001", (process.env.BACKEND_URL || "https://localhost:3001").replace('https', 'wss')],
            imgSrc: ["'self'", "data:", "blob:", "https://gateway.pinata.cloud"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));
app.use(hpp());
app.use(cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

const certPath = path.join(process.cwd(), 'certs');
let httpsOptions = null;
if (process.env.NODE_ENV !== 'production') {
    try {
        if (fs.existsSync(path.join(certPath, 'server.key')) && fs.existsSync(path.join(certPath, 'server.cert'))) {
            httpsOptions = { key: fs.readFileSync(path.join(certPath, 'server.key')), cert: fs.readFileSync(path.join(certPath, 'server.cert')) };
        }
    } catch (err) { logger.error('SSL setup failed', 'SERVER', err); }
}

const bcClient = createPublicClient({ chain: polygonAmoy, transport: http(process.env.RPC_URL || 'https://rpc-amoy.polygon.technology') });

function startServer() {
    const httpServer = process.env.NODE_ENV === 'production' ? createServer(app) : (httpsOptions ? createHttpsServer(httpsOptions, app) : createServer(app));
    const io = new Server(httpServer, { cors: { origin: "*", methods: ['GET', 'POST'] } });
    
    httpServer.listen(PORT, '0.0.0.0', () => {
        logger.info(`Sovereign Server active on port ${PORT}. Decentralized Truth active.`, 'SERVER');
    });

    process.on('SIGTERM', () => shutdown(httpServer, 'SIGTERM'));
    process.on('SIGINT', () => shutdown(httpServer, 'SIGINT'));
}

async function shutdown(server, signal) {
    logger.info(`${signal} received. Closing server...`, 'SHUTDOWN');
    server.close(() => {
        logger.success('Sovereign node offline. Data remains on-chain.', 'SHUTDOWN');
        process.exit(0);
    });
}

const sessionNonces = new Map();

app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'sovereign', network: process.env.NETWORK || 'Polygon Amoy' }));

app.use('/api/payments', paymentRoutes);

app.get('/api/auth/nonce/:address', (req, res) => {
    const nonce = crypto.randomBytes(16).toString('hex');
    sessionNonces.set(req.params.address.toLowerCase(), { nonce, timestamp: Date.now() });
    res.json({ nonce });
});

app.post('/api/auth/verify', async (req, res) => {
    try {
        const { message, signature } = req.body;
        const siweMessage = new SiweMessage(message);
        const isValid = await bcClient.verifyMessage({ address: siweMessage.address, message: siweMessage.prepareMessage(), signature });
        if (!isValid) return res.status(401).json({ error: 'Signature verification failed' });
        const session = sessionNonces.get(siweMessage.address.toLowerCase());
        if (!session || session.nonce !== siweMessage.nonce) return res.status(400).json({ error: 'Invalid nonce' });
        sessionNonces.delete(siweMessage.address.toLowerCase());
        res.json({ ok: true, address: siweMessage.address });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/profiles/:address', async (req, res) => {
    try {
        const portfolioCID = await bcClient.readContract({ address: REPUTATION_ADDRESS, abi: REPUTATION_ABI, functionName: 'portfolioCID', args: [req.params.address.toLowerCase()] });
        if (portfolioCID) {
            const data = await (await import('./services/ipfs.js')).getJSONFromIPFS(portfolioCID);
            return res.json({ ...data, address: req.params.address, isSovereign: true });
        }
        res.json({ address: req.params.address, isPlaceholder: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/profiles', async (req, res) => {
    const { address, signature, message } = req.body;
    const isValid = await verifyMessage({ address, message, signature });
    if (!isValid) return res.status(401).json({ error: 'Invalid signature' });
    res.json({ ...req.body, status: 'verified', isSovereign: true });
});

app.get('/api/jobs', (req, res) => res.json([]));
app.get('/api/leaderboard', (req, res) => res.json([]));
app.get('/api/disputes', (req, res) => res.json([]));

app.post('/api/storage/upload-json', async (req, res) => {
    try { res.json({ cid: await uploadJSONToIPFS(req.body) }); } catch (e) { res.status(500).json({ error: e.message }); }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
app.post('/api/storage/upload-file', upload.single('file'), async (req, res) => {
    try { res.json({ cid: await uploadFileToIPFS(req.file.buffer, req.file.originalname) }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/gdpr/export/:address', (req, res) => res.json({ address: req.params.address, message: "Data is on-chain/IPFS. Export via Explorer." }));

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

startServer();
export default app;
