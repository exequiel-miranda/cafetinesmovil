import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useCategories, useFeaturedProducts, useProducts } from '../hooks/useApi';
import { ProductCard } from '../components/ProductCard';
import { FloatingCheckout } from '../components/FloatingCheckout';

export const HomeScreen = ({ navigation }) => {
    const { categories, loading: loadingCats } = useCategories();
    const { products: featuredProducts, loading: loadingFeatured } = useFeaturedProducts();
    
    const [activeCategory, setActiveCategory] = useState('1'); // '1' es 'Todos'
    const [quantities, setQuantities] = useState({});

    // Cargar productos según categoría activa
    const { products: currentProducts, loading: loadingProducts } = useProducts(
        activeCategory === '1' ? { type: 'snack' } : { categoryId: activeCategory }
    );

    const handleAdd = (item) => {
        const id = item._id || item.id;
        setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    };

    const handleRemove = (item) => {
        const id = item._id || item.id;
        setQuantities(prev => {
            const next = { ...prev };
            if (next[id] > 1) { next[id] -= 1; } else { delete next[id]; }
            return next;
        });
    };

    const handleToggle = (item) => {
        const id = item._id || item.id;
        if (quantities[id]) {
            setQuantities(prev => { const next = { ...prev }; delete next[id]; return next; });
        } else {
            handleAdd(item);
        }
    };

    const renderCategory = ({ item }) => {
        const id = item._id || item.id;
        const isActive = activeCategory === id;
        return (
            <TouchableOpacity
                style={[styles.categoryItem, isActive && styles.categoryItemActive]}
                onPress={() => setActiveCategory(id)}
            >
                <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? theme.colors.surface : theme.colors.primary}
                />
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const totalHomeItems = Object.values(quantities).reduce((acc, q) => acc + q, 0);
    const totalHomePrice = Object.keys(quantities).reduce((acc, id) => {
        const qty = quantities[id];
        const item = currentProducts.find(s => (s._id || s.id) === id);
        return acc + (item ? item.price * qty : 0);
    }, 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola, Usuario </Text>
                    <Text style={styles.subtitle}>¿Qué te apetece hoy?</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Featured Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Menú Destacado</Text>
                    {loadingFeatured ? (
                        <Text style={styles.emptyText}>Cargando destacados...</Text>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                        >
                            {featuredProducts.map((item) => (
                                <TouchableOpacity
                                    key={item._id || item.id}
                                    style={styles.featuredCard}
                                    activeOpacity={0.9}
                                    onPress={() => navigation.navigate('ProductDetails', { product: item })}
                                >
                                    <Image source={{ uri: item.image }} style={styles.featuredImage} />
                                    <View style={styles.featuredOverlay}>
                                        <Text style={styles.featuredTitle}>{item.name}</Text>
                                        <Text style={styles.featuredPrice}>${item.price.toFixed(2)}</Text>
                                    </View>
                                    {item.popular && (
                                        <View style={styles.popularBadge}>
                                            <Text style={styles.popularBadgeText}>Especial</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Categories */}
                <View style={styles.categoriesSection}>
                    <FlatList
                        data={categories}
                        renderItem={renderCategory}
                        keyExtractor={item => item._id || item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    />
                </View>

                {/* Products Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Para ti</Text>
                    <View style={styles.productsGrid}>
                        {loadingProducts ? (
                            <Text style={styles.emptyText}>Cargando productos...</Text>
                        ) : currentProducts.length > 0 ? currentProducts.map((item) => (
                            <View key={item._id || item.id} style={styles.gridItem}>
                                <ProductCard
                                    item={item}
                                    quantity={quantities[item._id || item.id] || 0}
                                    onPress={() => handleToggle(item)}
                                    onAdd={() => handleAdd(item)}
                                    onRemove={() => handleRemove(item)}
                                />
                            </View>
                        )) : (
                            <Text style={styles.emptyText}>No hay productos en esta categoría.</Text>
                        )}
                    </View>
                </View>

            </ScrollView>

            <FloatingCheckout 
                totalItems={totalHomeItems}
                totalPrice={totalHomePrice}
                onCheckout={() => {
                    const selectedItems = Object.keys(quantities)
                        .map(id => {
                            const item = currentProducts.find(s => (s._id || s.id) === id);
                            return item ? { ...item, quantity: quantities[id] } : null;
                        })
                        .filter(Boolean);
                    navigation.navigate('Pedidos', {
                        incomingItems: selectedItems,
                        source: 'Inicio',
                        orderId: Date.now()
                    });
                }}
                onAddSnack={(snack) => handleAdd(snack)}
                showSuggestions={false}
                quantities={quantities}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    greeting: {
        fontSize: theme.typography.sizes.lg,
        color: theme.colors.textMuted,
    },
    subtitle: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
        marginTop: 4,
    },
    cartBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    cartBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: theme.colors.error,
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: theme.spacing.xxl,
    },
    section: {
        marginTop: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    horizontalList: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    featuredCard: {
        width: 280,
        height: 180,
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        ...theme.shadows.medium,
    },
    featuredImage: {
        width: '100%',
        height: '100%',
    },
    featuredOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.md,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', // dark transparent overlay
    },
    featuredTitle: {
        color: theme.colors.surface,
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
    },
    featuredPrice: {
        color: theme.colors.secondary,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.bold,
        marginTop: 4,
    },
    popularBadge: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.sm,
    },
    popularBadgeText: {
        color: '#fff',
        fontSize: theme.typography.sizes.xs,
        fontWeight: theme.typography.weights.bold,
    },
    categoriesSection: {
        marginTop: theme.spacing.xl,
    },
    categoriesList: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        ...theme.shadows.small,
    },
    categoryItemActive: {
        backgroundColor: theme.colors.primary,
    },
    categoryText: {
        marginLeft: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontWeight: theme.typography.weights.medium,
    },
    categoryTextActive: {
        color: theme.colors.surface,
    },
    productsGrid: {
        paddingHorizontal: theme.spacing.lg,
    },
    gridItem: {
        marginBottom: theme.spacing.md,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textMuted,
        margin: theme.spacing.xl,
    },
});
