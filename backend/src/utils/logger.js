/**
 * Simple Logger Utility for PolyLance Backend
 * Provides structured logging with timestamps and levels.
 */

const levels = {
    ERROR: '❌ ERROR',
    WARN: '⚠️  WARN',
    INFO: 'ℹ️  INFO',
    SUCCESS: '✅ SUCCESS',
    AUTH: '🔐 AUTH',
    SYNC: '⛓️  SYNC'
};

const formatMessage = (level, message, context = '') => {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` [${context}]` : '';
    return `${timestamp} ${level}${ctx}: ${message}`;
};

export const logger = {
    info: (msg, ctx) => console.log(formatMessage(levels.INFO, msg, ctx)),
    error: (msg, ctx, err) => {
        console.error(formatMessage(levels.ERROR, msg, ctx));
        if (err) console.error(err);
    },
    warn: (msg, ctx) => console.warn(formatMessage(levels.WARN, msg, ctx)),
    success: (msg, ctx) => console.log(formatMessage(levels.SUCCESS, msg, ctx)),
    auth: (msg) => console.log(formatMessage(levels.AUTH, msg, 'AUTH')),
    sync: (msg) => console.log(formatMessage(levels.SYNC, msg, 'BC-SYNC'))
};
