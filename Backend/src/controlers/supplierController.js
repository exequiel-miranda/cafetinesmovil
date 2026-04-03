import Supplier from '../modal/Supplier.js';

export const getAll = async (req, res) => {
    try {
        const suppliers = await Supplier.find().sort({ createdAt: -1 });
        res.json({ ok: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener proveedores', error: error.message });
    }
};

export const getById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ ok: false, message: 'Proveedor no encontrado' });
        res.json({ ok: true, data: supplier });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener proveedor', error: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const supplier = new Supplier(req.body);
        await supplier.save();
        res.status(201).json({ ok: true, data: supplier });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al crear proveedor', error: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!supplier) return res.status(404).json({ ok: false, message: 'Proveedor no encontrado' });
        res.json({ ok: true, data: supplier });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al actualizar proveedor', error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) return res.status(404).json({ ok: false, message: 'Proveedor no encontrado' });
        res.json({ ok: true, message: 'Proveedor eliminado' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al eliminar proveedor', error: error.message });
    }
};
