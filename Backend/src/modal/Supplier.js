import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        required: false,
        trim: true,
        default: 'General'
    },
    contact: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: '',
    },
    active: {
        type: Boolean,
        default: true,
    },
    description: {
        type: String,
        default: '',
    },
    lastPurchase: {
        type: String, // format: DD/MM/YYYY or similar for simplicity as requested
        default: '',
    },
    nextVisit: {
        type: String, // format: DD/MM/YYYY
        default: '',
    },
    lastAmount: {
        type: Number,
        default: 0,
    },
    lastNote: {
        type: String,
        default: '',
    },
}, { timestamps: true });

export default mongoose.model('Supplier', supplierSchema);
