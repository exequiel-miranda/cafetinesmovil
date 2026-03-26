import mongoose from 'mongoose';
import Category from '../src/modal/Category.js';
import Product from '../src/modal/Product.js';
import Order from '../src/modal/Order.js';

const MONGODB_URI = 'mongodb://localhost:27017/cafetines';

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Category.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});
        console.log('Cleared existing data.');

        // Seed Categories
        const categoriesData = [
            { name: 'Todos', icon: 'menu' },
            { name: 'Almuerzos', icon: 'restaurant' },
            { name: 'Snacks', icon: 'fast-food' },
            { name: 'Bebidas', icon: 'cafe' },
            { name: 'Postres', icon: 'ice-cream' },
        ];

        const createdCategories = await Category.insertMany(categoriesData);
        console.log('Categories seeded.');

        // Map mock IDs to real MongoDB IDs
        const catMap = {
            '1': createdCategories.find(c => c.name === 'Todos')._id,
            '2': createdCategories.find(c => c.name === 'Almuerzos')._id,
            '3': createdCategories.find(c => c.name === 'Snacks')._id,
            '4': createdCategories.find(c => c.name === 'Bebidas')._id,
            '5': createdCategories.find(c => c.name === 'Postres')._id,
        };

        // Seed Products (Lunches)
        const lunches = [
            {
                name: 'Combo Premium Salmón',
                description: 'Salmón a la plancha con puré de papas rústico y ensalada fresca del huerto. Incluye bebida natural.',
                price: 12.50,
                categoryId: catMap['2'],
                image: 'https://loremflickr.com/600/400/salmon,food?lock=1',
                rating: 4.8,
                calories: '450 kcal',
                prepTime: '15-20 min',
                popular: true,
                type: 'lunch'
            },
            {
                name: 'Bowl Ejecutivo de Quinoa',
                description: 'Bowl saludable con quinoa tricolor, pollo grillado, aguacate, tomates cherry y aderezo de cilantro.',
                price: 9.75,
                categoryId: catMap['2'],
                image: 'https://loremflickr.com/600/400/salad,food?lock=2',
                rating: 4.6,
                calories: '380 kcal',
                prepTime: '10-15 min',
                popular: true,
                type: 'lunch'
            },
            {
                name: 'Pasta Trufada con Champiñones',
                description: 'Pasta artesanal en salsa cremosa de trufas negras y toque de parmesano reggiano.',
                price: 11.00,
                categoryId: catMap['2'],
                image: 'https://loremflickr.com/600/400/pasta,food?lock=3',
                rating: 4.9,
                calories: '620 kcal',
                prepTime: '15-20 min',
                popular: false,
                type: 'lunch'
            }
        ];

        // Seed Products (Snacks & Drinks)
        const snacksData = [
            {
                name: 'Croissant Almendrado',
                description: 'Masa hojaldrada francesa horneada hoy, rellena de crema de almendras y cubierta con almendras fileteadas.',
                price: 3.50,
                categoryId: catMap['3'],
                image: 'https://loremflickr.com/600/400/croissant,food?lock=4',
                rating: 4.7,
                calories: '320 kcal',
                type: 'snack'
            },
            {
                name: 'Parfait de Frutos Rojos',
                description: 'Yogurt griego natural, granola crujiente miel de agave y selección de frutos rojos frescos.',
                price: 4.25,
                categoryId: catMap['3'],
                image: 'https://loremflickr.com/600/400/yogurt,food?lock=5',
                rating: 4.5,
                calories: '210 kcal',
                popular: true,
                type: 'snack'
            },
            {
                name: 'Smoothie Verde Detox',
                description: 'Mezcla refrescante de espinaca, manzana verde, pepino, jengibre y juego de limón.',
                price: 4.00,
                categoryId: catMap['4'],
                image: 'https://loremflickr.com/600/400/smoothie,drink?lock=6',
                rating: 4.8,
                calories: '120 kcal',
                type: 'snack'
            },
            {
                name: 'Macarons Surtidos (3 und)',
                description: 'Auténticos macarons franceses de vainilla, pistacho y frambuesa.',
                price: 5.00,
                categoryId: catMap['5'],
                image: 'https://loremflickr.com/600/400/macarons,food?lock=7',
                rating: 4.9,
                calories: '150 kcal',
                popular: true,
                type: 'snack'
            }
        ];

        // Seed Combos
        const combos = [
            {
                name: 'Combo Estudiante',
                description: 'Hamburguesa Burger, papas fritas y refresco mediano.',
                price: 6.50,
                categoryId: catMap['3'],
                image: 'https://loremflickr.com/600/400/burger,food?lock=8',
                rating: 4.8,
                calories: '850 kcal',
                popular: true,
                type: 'combo',
                comboItems: [
                    { name: 'Hamburguesa Clásica', icon: '🍔' },
                    { name: 'Papas Fritas Medianas', icon: '🍟' },
                    { name: 'Refresco de Cola', icon: '🥤' }
                ]
            },
            {
                name: 'Combo Saludable',
                description: 'Ensalada ligera, porción de fruta y agua mineral.',
                price: 7.00,
                categoryId: catMap['3'],
                image: 'https://loremflickr.com/600/400/salad,fruit?lock=9',
                rating: 4.9,
                calories: '450 kcal',
                popular: true,
                type: 'combo',
                comboItems: [
                    { name: 'Ensalada de la Huerta', icon: '🥗' },
                    { name: 'Mix de Frutas Frescas', icon: '🍉' },
                    { name: 'Agua Mineral 500ml', icon: '💧' }
                ]
            }
        ];

        await Product.insertMany([...lunches, ...snacksData, ...combos]);
        console.log('Products and Combos seeded.');

        // Seed Orders (Historical)
        const ordersData = [
            {
                orderNumber: 'HIST-001',
                total: 15.50,
                status: 'Entregado',
                paymentMethod: 'Tarjeta',
                source: 'Almuerzos',
                items: [
                    { name: 'Combo Premium Salmón', quantity: 1, price: 12.50 },
                    { name: 'Smoothie Verde Detox', quantity: 1, price: 3.00 }
                ]
            },
            {
                orderNumber: 'HIST-002',
                total: 9.75,
                status: 'Entregado',
                paymentMethod: 'Efectivo',
                source: 'Almuerzos',
                items: [
                    { name: 'Bowl Ejecutivo de Quinoa', quantity: 1, price: 9.75 }
                ]
            }
        ];

        await Order.insertMany(ordersData);
        console.log('Historical orders seeded.');

        console.log('Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
