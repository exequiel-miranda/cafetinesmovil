import express from 'express';
import cors from 'cors';
import categoryRoutes from './src/routes/categoryRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import supplierRoutes from './src/routes/supplierRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import configRoutes from './src/routes/configRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/users', userRoutes);
app.use('/api/config', configRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'CafetinesMóvil API is running' });
});

export default app;
