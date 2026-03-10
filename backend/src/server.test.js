import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from './server.js';

// Mock GoogleGenerativeAI
vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: class {
        constructor() {}
        getGenerativeModel() {
            return {
                generateContent: vi.fn().mockResolvedValue({
                    response: {
                        text: () => '{"score": 0.9, "polishedBio": "AI Polished Bio"}'
                    }
                })
            };
        }
    }
}));

// No Mongoose models to mock anymore as we moved to a decentralized/stateless architecture

describe('Sovereign Backend API Endpoints', () => {
    const testAddress = '0x1234567890123456789012345678901234567890';

    it('GET /api/health should return ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.mode).toBe('sovereign');
    });

    it('GET /api/auth/nonce/:address should return a nonce', async () => {
        const res = await request(app).get(`/api/auth/nonce/${testAddress}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('nonce');
    });

    it('GET /api/jobs should return a sovereign empty list (deprecated)', async () => {
        const res = await request(app).get('/api/jobs');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/ai/polish-bio should return a polished bio', async () => {
        // Model is mocked or uses mock key in server.js
        const res = await request(app)
            .post('/api/ai/polish-bio')
            .send({ bio: 'I build dapps' });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('polishedBio');
    });
});
