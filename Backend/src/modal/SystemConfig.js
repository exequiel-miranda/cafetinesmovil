import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
    maintenanceMode: {
        type: Boolean,
        default: false,
    },
    allowNewRegistrations: {
        type: Boolean,
        default: true,
    },
    adminContactEmail: {
        type: String,
        default: '',
    },
    orderNotifications: {
        type: Boolean,
        default: true,
    },
    appVersion: {
        type: String,
        default: '1.2.0',
    },
    schoolName: {
        type: String,
        default: 'Antares VIP Management',
    },
    systemLogsEnabled: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

export default mongoose.model('SystemConfig', systemConfigSchema);
