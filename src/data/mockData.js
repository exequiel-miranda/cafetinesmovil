export const categories = [
    { id: '1', name: 'Todos', icon: 'menu' },
    { id: '2', name: 'Almuerzos', icon: 'restaurant' },
    { id: '3', name: 'Snacks', icon: 'fast-food' },
    { id: '4', name: 'Bebidas', icon: 'cafe' },
    { id: '5', name: 'Postres', icon: 'ice-cream' },
];

export const featuredLunches = [
    {
        id: 'l1',
        name: 'Combo Premium Salmón',
        description: 'Salmón a la plancha con puré de papas rústico y ensalada fresca del huerto. Incluye bebida natural.',
        price: 12.50,
        categoryId: '2',
        image: 'https://loremflickr.com/600/400/salmon,food?lock=1',
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
        image: 'https://loremflickr.com/600/400/salad,food?lock=2',
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
        image: 'https://loremflickr.com/600/400/pasta,food?lock=3',
        rating: 4.9,
        calories: '620 kcal',
        prepTime: '15-20 min',
        popular: false,
    }
];

export const featuredBreakfasts = [
    {
        id: 'b1',
        name: 'Gallo Pinto Tradicional',
        description: 'Auténtico desayuno típico con gallo pinto, huevo al gusto, queso fresco, maduro y natilla.',
        price: 5.50,
        categoryId: '1', 
        image: 'https://loremflickr.com/600/400/breakfast,beans?lock=11',
        rating: 4.9,
        calories: '520 kcal',
        prepTime: '10 min',
        popular: true,
    },
    {
        id: 'b2',
        name: 'Omelette Especial Antares',
        description: 'Omelette de 3 huevos relleno de jamón, queso suizo, champiñones y espinacas tiernas.',
        price: 6.25,
        categoryId: '1',
        image: 'https://loremflickr.com/600/400/omelette,eggs?lock=12',
        rating: 4.7,
        calories: '410 kcal',
        prepTime: '12 min',
        popular: true,
    },
    {
        id: 'b3',
        name: 'Pancakes de Arándanos',
        description: 'Tres esponjosos pancakes con arándanos frescos, miel de maple grado A y mantequilla batida.',
        price: 5.75,
        categoryId: '1',
        image: 'https://loremflickr.com/600/400/pancakes,food?lock=13',
        rating: 4.8,
        calories: '680 kcal',
        prepTime: '15 min',
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
        image: 'https://loremflickr.com/600/400/croissant,food?lock=4',
        rating: 4.7,
        calories: '320 kcal',
    },
    {
        id: 's2',
        name: 'Parfait de Frutos Rojos',
        description: 'Yogurt griego natural, granola crujiente miel de agave y selección de frutos rojos frescos.',
        price: 4.25,
        categoryId: '3',
        image: 'https://loremflickr.com/600/400/yogurt,food?lock=5',
        rating: 4.5,
        calories: '210 kcal',
        popular: true,
    },
    {
        id: 's3',
        name: 'Smoothie Verde Detox',
        description: 'Mezcla refrescante de espinaca, manzana verde, pepino, jengibre y jugo de limón.',
        price: 4.00,
        categoryId: '4',
        image: 'https://loremflickr.com/600/400/smoothie,drink?lock=6',
        rating: 4.8,
        calories: '120 kcal',
    },
    {
        id: 's4',
        name: 'Macarons Surtidos (3 und)',
        description: 'Auténticos macarons franceses de vainilla, pistacho y frambuesa.',
        price: 5.00,
        categoryId: '5',
        image: 'https://loremflickr.com/600/400/macarons,food?lock=7',
        rating: 4.9,
        calories: '150 kcal',
        popular: true,
    }
];

export const combos = [
    {
        id: 'c1',
        name: 'Combo Estudiante',
        description: 'Hamburguesa Burger, papas fritas y refresco mediano.',
        price: 6.50,
        categoryId: '3',
        image: 'https://loremflickr.com/600/400/burger,food?lock=8',
        rating: 4.8,
        calories: '850 kcal',
        popular: true,
        items: [
            { name: 'Hamburguesa Clásica', icon: '🍔' },
            { name: 'Papas Fritas Medianas', icon: '🍟' },
            { name: 'Refresco de Cola', icon: '🥤' }
        ]
    },
    {
        id: 'c2',
        name: 'Combo Saludable',
        description: 'Ensalada ligera, porción de fruta y agua mineral.',
        price: 7.00,
        categoryId: '3',
        image: 'https://loremflickr.com/600/400/salad,fruit?lock=9',
        rating: 4.9,
        calories: '450 kcal',
        popular: true,
        items: [
            { name: 'Ensalada de la Huerta', icon: '🥗' },
            { name: 'Mix de Frutas Frescas', icon: '🍉' },
            { name: 'Agua Mineral 500ml', icon: '💧' }
        ]
    }
];

export const allProducts = [...featuredLunches, ...snacks, ...combos];

export const orders = [
    {
        id: 'o1',
        date: 'Hoy, 12:30 PM',
        status: 'En Preparación',
        statusColor: '#F59E0B', 
        estimatedTime: '10 min',
        total: 15.50,
        items: [
            { name: 'Combo Premium Salmón', quantity: 1, price: 12.50 },
            { name: 'Smoothie Verde Detox', quantity: 1, price: 3.00 }
        ],
        isActive: true,
    },
    {
        id: 'o2',
        date: 'Ayer, 1:15 PM',
        status: 'Entregado',
        statusColor: '#10B981', 
        total: 9.75,
        items: [
            { name: 'Bowl Ejecutivo de Quinoa', quantity: 1, price: 9.75 }
        ],
        isActive: false,
    },
    {
        id: 'o3',
        date: '15 de Mar, 12:45 PM',
        status: 'Entregado',
        statusColor: '#10B981',
        total: 7.00,
        items: [
            { name: 'Combo Saludable', quantity: 1, price: 7.00 }
        ],
        isActive: false,
    }
];
