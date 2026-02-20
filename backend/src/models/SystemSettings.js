import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

export const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
