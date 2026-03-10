import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { verifyMessage, createPublicClient, http } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { testBlockchainConnection } from './config/blockchain.js';
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
import { GDPRService } from './services/gdpr.js';
import { logger } from './utils/logger.js';

// Server Initialization

function validateEnv() {
    logger.info('--- Sovereign Environment Diagnostic ---', 'CONFIG');
    logger.info(`RAZORPAY: ${process.env.RAZORPAY_KEY_ID ? 'CONFIGURED' : 'NOT CONFIGURED'}`, 'CONFIG');
    logger.info(`RPC_URL: ${process.env.RPC_URL ? 'LOADED' : 'FALLBACK-READY'}`, 'CONFIG');
}

validateEnv();

testBlockchainConnection(logger).catch(() => {
    logger.warn('Continuing without verified blockchain connection.', 'BC');
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
});

export const app = express();
app.set('trust proxy', 1);
app.use(compression());
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
    new Server(httpServer, { cors: { origin: "*", methods: ['GET', 'POST'] } });
    
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

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSy_mock_key');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    } catch { res.status(500).json({ error: 'Verification failed' }); }
});

// AI Strategic Match - Stateless Compute
app.get('/api/match/:jobId/:address', async (req, res) => {
    try {
        const { jobId, address } = req.params;
        // 1. Resolve Job from IPFS (In a real app, we'd fetch the CID from the Subgraph/Contract first)
        // For this endpoint, we assume the frontend might pass the CID or we look it up.
        // For simulation, we'll use a placeholder or resolve if jobId is a CID.
        const jobData = jobId.startsWith('Qm') ? await (await import('./services/ipfs.js')).getJSONFromIPFS(jobId) : { title: "Software Development", description: "Build a decentralized app" };
        
        const prompt = `Analyze the match between this job: ${JSON.stringify(jobData)} and this freelancer address: ${address}. 
        Return a JSON object with: 
        score (0-1), 
        riskLevel (Low/Medium/High), 
        reason (string), 
        strengths (array), 
        gaps (array), 
        proTip (string),
        agentNotes (string).`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0.85, riskLevel: 'Low', reason: 'High technical alignment.' });
    } catch { 
        logger.error('AI Match Error', 'AI', 'Unknown error');
        res.json({ score: 0.75, riskLevel: 'Medium', reason: 'AI analysis fallback active.' }); 
    }
});

// AI Bio Polish - Stateless Compute
app.post('/api/ai/polish-bio', async (req, res) => {
    try {
        const { bio } = req.body;
        const prompt = `Polish this freelancer bio to be professional and compelling for a Web3 marketplace: "${bio}". Return the polished bio only.`;
        const result = await model.generateContent(prompt);
        res.json({ polishedBio: result.response.text().trim() });
    } catch { res.status(500).json({ error: 'Bio polish failed' }); }
});

// AI Treasury Butler - Yield Strategy Analysis
app.get('/api/ai/yield-strategy/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const prompt = `Analyze the current yield environment for a freelancer with address ${address}. 
        Escrowed funds: 5000 MATIC. 
        Target: Morpho Blue, Aave V3. 
        Return a JSON object suggesting a yield strategy: {
            strategy (string), 
            projectedApy (percentage string), 
            riskRating (0-10), 
            butlerNotes (string),
            nextAction (string)
        }`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { strategy: 'Morpho Supply', projectedApy: '4.5%', riskRating: 2, nextAction: 'Authorize Butler' });
    } catch { res.json({ strategy: 'HODL', projectedApy: '0%', riskRating: 0 }); }
});

// AI Governance Watcher - DAO Pulse
app.get('/api/ai/governance-pulse', async (req, res) => {
    try {
        const prompt = `Summarize the current state of a decentralized freelance DAO's governance. 
        Active proposals: 3. 
        Topics: Gas sponsorship, Reputation decay, Fee reduction.
        Return a JSON: {
            summary (string),
            hotTopic (string),
            voterSentiment (string),
            isEmergency (boolean)
        }`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: 'Stable', hotTopic: 'Fee reduction', voterSentiment: 'Optimistic' });
    } catch { res.json({ summary: 'Network Monitoring...' }); }
});

app.get('/api/profiles/:address', async (req, res) => {
    try {
        const portfolioCID = await bcClient.readContract({ address: REPUTATION_ADDRESS, abi: REPUTATION_ABI, functionName: 'portfolioCID', args: [req.params.address.toLowerCase()] });
        if (portfolioCID) {
            const data = await (await import('./services/ipfs.js')).getJSONFromIPFS(portfolioCID);
            return res.json({ ...data, address: req.params.address, isSovereign: true });
        }
        res.json({ address: req.params.address, isPlaceholder: true });
    } catch { res.status(500).json({ error: 'Profile retrieval failed' }); }
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
    try { res.json({ cid: await uploadJSONToIPFS(req.body) }); } catch { res.status(500).json({ error: 'Upload failed' }); }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
app.post('/api/storage/upload-file', upload.single('file'), async (req, res) => {
    try { res.json({ cid: await uploadFileToIPFS(req.file.buffer, req.file.originalname) }); } catch { res.status(500).json({ error: 'File upload failed' }); }
});

app.get('/api/gdpr/export/:address', (req, res) => res.json({ address: req.params.address, message: "Data is on-chain/IPFS. Export via Explorer." }));

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    startServer();
}
export default app;

