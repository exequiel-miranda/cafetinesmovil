import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    icon: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
