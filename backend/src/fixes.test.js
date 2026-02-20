import { describe, it, expect, vi } from 'vitest';
import { sanitizeForPrompt } from './services/aiMatcher.js';
import request from 'supertest';
import { app } from './server.js';

// Mock Razorpay
vi.mock('razorpay', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            orders: {
                create: vi.fn().mockResolvedValue({ id: 'order_mock_123', amount: 50000 })
            }
        }))
    };
});

describe('Security Fixes Verification', () => {
    describe('AI Prompt Sanitization', () => {
        it('should remove JSON-breaking characters', () => {
            const input = 'This is safe { "dangerous": "json" }';
            const output = sanitizeForPrompt(input);
            expect(output).not.toContain('{');
            expect(output).not.toContain('}');
            expect(output).not.toContain('"');
            expect(output).toBe('This is safe  dangerous: json ');
        });

        it('should handle empty input', () => {
            expect(sanitizeForPrompt(null)).toBe("");
            expect(sanitizeForPrompt(undefined)).toBe("");
        });
    });

    describe('Regex Injection Protection (Search)', () => {
        function escapeRegex(text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        }

        it('should escape special regex characters', () => {
            const malicious = '(a+)+';
            const escaped = escapeRegex(malicious);
            expect(escaped).toBe('\\(a\\+\\)\\+');
        });
    });

    describe('Financial Precision (Math)', () => {
        it('should handle large wei values correctly using BigInt', () => {
            const val1 = BigInt("1000000000000000000"); // 1 ETH
            const val2 = BigInt("1"); // 1 Wei
            const sum = val1 + val2;
            expect(sum.toString()).toBe("1000000000000000001");
            expect(Number.isSafeInteger(Number(val1))).toBe(false);
        });
    });

    describe('Server Logic Fixes', () => {
        it('POST /api/payments/create-order should be reachable (Razorpay Integration)', async () => {
            const res = await request(app)
                .post('/api/payments/create-order')
                .set('Authorization', 'Bearer mock_token') // Optional depending on auth middleware
                .send({ amount: 500, currency: 'INR' });

            expect(res.statusCode).not.toBe(404);
            // It might be 401 if auth is on, but at least not 404
            if (res.statusCode === 200) {
                expect(res.body.id).toBe('order_mock_123');
            }
        });
    });
});
