import Category from '../modal/Category.js';

// GET /api/categories
export const getAll = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: 1 });
        res.json({ ok: true, data: categories });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener categorías', error: error.message });
    }
};

// GET /api/categories/:id
export const getById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
        res.json({ ok: true, data: category });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener categoría', error: error.message });
    }
};

// POST /api/categories
export const create = async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json({ ok: true, data: category });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al crear categoría', error: error.message });
    }
};
