import Order from '../modal/Order.js';

// GET /api/orders
export const getAll = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 });
        res.json({ ok: true, data: orders });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener pedidos', error: error.message });
    }
};

// GET /api/orders/:id
export const getById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ ok: false, message: 'Pedido no encontrado' });
        res.json({ ok: true, data: order });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener pedido', error: error.message });
    }
};

// POST /api/orders
// Body: { items: [{productId?, name, quantity, price}], total, source, paymentMethod? }
export const create = async (req, res) => {
    try {
        const { items, total, source, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ ok: false, message: 'El pedido debe contener al menos un ítem' });
        }

        const calculatedTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

        const order = new Order({
            items,
            total: total ?? calculatedTotal,
            source: source ?? 'Inicio',
            paymentMethod: paymentMethod ?? null,
            status: paymentMethod ? 'Esperando pago' : 'Pendiente de pago',
        });

        await order.save();
        res.status(201).json({ ok: true, data: order });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al crear pedido', error: error.message });
    }
};

// PATCH /api/orders/:id/status
// Body: { status: 'En Preparación' | 'Listo' | 'Entregado' | 'Cancelado', paymentMethod? }
export const updateStatus = async (req, res) => {
    try {
        const { status, paymentMethod } = req.body;
        const update = { status };
        if (paymentMethod) update.paymentMethod = paymentMethod;

        const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!order) return res.status(404).json({ ok: false, message: 'Pedido no encontrado' });
        res.json({ ok: true, data: order });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al actualizar estado', error: error.message });
    }
};

// DELETE /api/orders/:id  (cancelar)
export const remove = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: 'Cancelado' },
            { new: true }
        );
        if (!order) return res.status(404).json({ ok: false, message: 'Pedido no encontrado' });
        res.json({ ok: true, message: 'Pedido cancelado', data: order });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al cancelar pedido', error: error.message });
    }
};
