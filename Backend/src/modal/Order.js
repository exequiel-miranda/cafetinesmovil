import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
    },
    items: {
        type: [orderItemSchema],
        required: true,
    },
    total: {
        type: Number,
        required: true,
        min: 0,
    },
    // 'Pendiente de pago' | 'Esperando pago' | 'En Preparación' | 'Listo' | 'Entregado' | 'Cancelado' | ''
    status: {
        type: String,
        enum: ['Pendiente de pago', 'Esperando pago', 'En Preparación', 'Listo', 'Entregado', 'Cancelado', ''],
        default: 'Pendiente de pago',
    },
    // 'Efectivo' | 'Tarjeta'
    paymentMethod: {
        type: String,
        enum: ['Efectivo', 'Tarjeta', null],
        default: null,
    },
    // Pantalla de origen: 'Almuerzos' | 'Snacks' | 'Inicio' | 'Desayunos'
    source: {
        type: String,
        default: 'Inicio',
    },
}, { timestamps: true });

// Auto-generar número de pedido correlativo antes de guardar
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = String(count + 1).padStart(2, '0');
    }
    next();
});

export default mongoose.model('Order', orderSchema);
