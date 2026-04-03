import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
    },
    image: {
        type: String,
        default: '',
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    calories: {
        type: String,
        default: '',
    },
    prepTime: {
        type: String,
        default: '',
    },
    popular: {
        type: Boolean,
        default: false,
    },
    // 'lunch' | 'snack' | 'breakfast' | 'combo'
    type: {
        type: String,
        enum: ['lunch', 'snack', 'breakfast', 'combo'],
        required: true,
    },
    // Para combos: lista de ítems incluidos
    comboItems: [
        {
            name: String,
            icon: String,
        }
    ],
    available: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
