import Product from '../modal/Product.js';

// GET /api/products
// Query params: ?type=lunch|snack|breakfast|combo  &  ?categoryId=xxx  &  ?popular=true
export const getAll = async (req, res) => {
    try {
        const filter = { available: true };
        if (req.query.type) filter.type = req.query.type;
        if (req.query.categoryId) filter.categoryId = req.query.categoryId;
        if (req.query.popular === 'true') filter.popular = true;

        const products = await Product.find(filter)
            .populate('categoryId', 'name icon')
            .sort({ createdAt: 1 });

        res.json({ ok: true, data: products });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener productos', error: error.message });
    }
};

// GET /api/products/featured
// Devuelve productos populares de tipo lunch
export const getFeatured = async (req, res) => {
    try {
        const products = await Product.find({ popular: true, available: true })
            .populate('categoryId', 'name icon')
            .sort({ rating: -1 });
        res.json({ ok: true, data: products });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener destacados', error: error.message });
    }
};

// GET /api/products/:id
export const getById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('categoryId', 'name icon');
        if (!product) return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
        res.json({ ok: true, data: product });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener producto', error: error.message });
    }
};

// POST /api/products
export const create = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ ok: true, data: product });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al crear producto', error: error.message });
    }
};

// PATCH /api/products/:id
export const update = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
        res.json({ ok: true, data: product });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al actualizar producto', error: error.message });
    }
};
