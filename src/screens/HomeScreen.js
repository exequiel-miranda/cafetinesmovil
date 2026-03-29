import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useCategories, useFeaturedProducts, useProducts } from '../hooks/useApi';
import { ProductCard } from '../components/ProductCard';
import { FloatingCheckout } from '../components/FloatingCheckout';
import { ProductInfoModal } from '../components/ProductInfoModal';

export const HomeScreen = ({ navigation }) => {
    const { categories, loading: loadingCats } = useCategories();
    const { products: featuredProducts, loading: loadingFeatured } = useFeaturedProducts();
    
    const [activeCategory, setActiveCategory] = useState('1'); // '1' es 'Todos'
    const [quantities, setQuantities] = useState({});
    
    // Info Modal State for Featured
    const [selectedInfoItem, setSelectedInfoItem] = useState(null);
    const [infoModalVisible, setInfoModalVisible] = useState(false);

    const openInfoModal = (item) => {
        setSelectedInfoItem(item);
        setInfoModalVisible(true);
    };

    const closeInfoModal = () => {
        setInfoModalVisible(false);
    };

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
    
    // Find product helper to check types
    const findProduct = (id) => {
        return [...featuredProducts, ...currentProducts].find(p => (p._id || p.id) === id);
    };

    const totalHomePrice = Object.keys(quantities).reduce((acc, id) => {
        const qty = quantities[id];
        const item = findProduct(id);
        return acc + (item ? item.price * qty : 0);
    }, 0);

    // Dynamic showSuggestions: only if there's a lunch or breakfast selected
    const hasMealSelected = Object.keys(quantities).some(id => {
        const item = findProduct(id);
        return item && (item.type === 'lunch' || item.type === 'breakfast' || item.categoryId === '2');
    });

    // Dynamic source name
    const getSourceName = () => {
        const items = Object.keys(quantities).map(id => findProduct(id)).filter(Boolean);
        if (items.some(i => i.type === 'lunch')) return 'Almuerzo';
        if (items.some(i => i.type === 'breakfast' || i.categoryId === '2')) return 'Desayuno';
        return 'Snack';
    };

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
                            {featuredProducts.map((item) => {
                                const id = item._id || item.id;
                                const isSelected = (quantities[id] || 0) > 0;
                                
                                return (
                                    <TouchableOpacity
                                        key={id}
                                        style={[styles.featuredCard, isSelected && styles.featuredCardSelected]}
                                        activeOpacity={0.9}
                                        onPress={() => handleToggle(item)}
                                    >
                                        <Image source={{ uri: item.image }} style={styles.featuredImage} />
                                        <View style={styles.featuredOverlay}>
                                            <Text style={styles.featuredTitle}>{item.name}</Text>
                                            <View style={styles.featuredBottomRow}>
                                                <Text style={styles.featuredPrice}>${item.price.toFixed(2)}</Text>
                                                {isSelected && (
                                                    <View style={styles.featuredQtyBadge}>
                                                        <Text style={styles.featuredQtyText}>x{quantities[id]}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        
                                        <TouchableOpacity 
                                            style={styles.featuredInfoBtn}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                openInfoModal(item);
                                            }}
                                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                        >
                                            <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.9)" />
                                        </TouchableOpacity>

                                        {item.popular && (
                                            <View style={styles.popularBadge}>
                                                <Text style={styles.popularBadgeText}>Especial</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
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
                            const item = findProduct(id);
                            return item ? { ...item, quantity: quantities[id] } : null;
                        })
                        .filter(Boolean);
                    navigation.navigate('Pedidos', {
                        incomingItems: selectedItems,
                        source: getSourceName(),
                        orderId: Date.now()
                    });
                }}
                onAddSnack={(snack) => handleAdd(snack)}
                onRemoveSnack={(snack) => handleRemove(snack)}
                showSuggestions={hasMealSelected}
                quantities={quantities}
            />

            <ProductInfoModal
                visible={infoModalVisible}
                item={selectedInfoItem}
                onClose={closeInfoModal}
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
        borderWidth: 2,
        borderColor: 'transparent',
    },
    featuredCardSelected: {
        borderColor: theme.colors.primaryLight,
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
    },
    featuredBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    featuredQtyBadge: {
        backgroundColor: theme.colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    featuredQtyText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
    },
    featuredInfoBtn: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.2)',
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
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
