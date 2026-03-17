export const categories = [
    { id: '1', name: 'Todos', icon: 'menu' },
    { id: '2', name: 'Almuerzos', icon: 'restaurant' },
    { id: '3', name: 'Snacks', icon: 'fastfood' },
    { id: '4', name: 'Bebidas', icon: 'local-cafe' },
    { id: '5', name: 'Postres', icon: 'icecream' },
];

export const featuredLunches = [
    {
        id: 'l1',
        name: 'Combo Premium Salmón',
        description: 'Salmón a la plancha con puré de papas rústico y ensalada fresca del huerto. Incluye bebida natural.',
        price: 12.50,
        categoryId: '2',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=600&auto=format&fit=crop',
        rating: 4.8,
        calories: '450 kcal',
        prepTime: '15-20 min',
        popular: true,
    },
    {
        id: 'l2',
        name: 'Bowl Ejecutivo de Quinoa',
        description: 'Bowl saludable con quinoa tricolor, pollo grillado, aguacate, tomates cherry y aderezo de cilantro.',
        price: 9.75,
        categoryId: '2',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
        rating: 4.6,
        calories: '380 kcal',
        prepTime: '10-15 min',
        popular: true,
    },
    {
        id: 'l3',
        name: 'Pasta Trufada con Champiñones',
        description: 'Pasta artesanal en salsa cremosa de trufas negras y toque de parmesano reggiano.',
        price: 11.00,
        categoryId: '2',
        image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?q=80&w=600&auto=format&fit=crop',
        rating: 4.9,
        calories: '620 kcal',
        prepTime: '15-20 min',
        popular: false,
    }
];

export const snacks = [
    {
        id: 's1',
        name: 'Croissant Almendrado',
        description: 'Masa hojaldrada francesa horneada hoy, rellena de crema de almendras y cubierta con almendras fileteadas.',
        price: 3.50,
        categoryId: '3',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?q=80&w=600&auto=format&fit=crop',
        rating: 4.7,
        calories: '320 kcal',
    },
    {
        id: 's2',
        name: 'Parfait de Frutos Rojos',
        description: 'Yogurt griego natural, granola crujiente miel de agave y selección de frutos rojos frescos.',
        price: 4.25,
        categoryId: '3',
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=600&auto=format&fit=crop',
        rating: 4.5,
        calories: '210 kcal',
    },
    {
        id: 's3',
        name: 'Smoothie Verde Detox',
        description: 'Mezcla refrescante de espinaca, manzana verde, pepino, jengibre y jugo de limón.',
        price: 4.00,
        categoryId: '4',
        image: 'https://images.unsplash.com/photo-1610970881699-44a5009a6331?q=80&w=600&auto=format&fit=crop',
        rating: 4.8,
        calories: '120 kcal',
    },
    {
        id: 's4',
        name: 'Macarons Surtidos (3 und)',
        description: 'Auténticos macarons franceses de vainilla, pistacho y frambuesa.',
        price: 5.00,
        categoryId: '5',
        image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?q=80&w=600&auto=format&fit=crop',
        rating: 4.9,
        calories: '150 kcal',
    }
];

export const allProducts = [...featuredLunches, ...snacks];
