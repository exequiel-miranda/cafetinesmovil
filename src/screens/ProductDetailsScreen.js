import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { CustomButton } from '../components/CustomButton';
import { useProducts } from '../hooks/useApi.js';
import { ScreenHeader } from '../components/ScreenHeader';

const { height } = Dimensions.get('window');

export const ProductDetailsScreen = ({ route, navigation }) => {
    const { product } = route.params;
    const insets = useSafeAreaInsets();
    const [quantity, setQuantity] = useState(1);
    const { products: allSnacks, loading: loadingSnacks } = useProducts({ type: 'snack' });
    const [selectedSnacks, setSelectedSnacks] = useState({}); // { snackId: quantity }

    const increment = () => setQuantity(prev => prev + 1);
    const decrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    const toggleSnack = (snack) => {
        const id = snack._id || snack.id;
        setSelectedSnacks(prev => {
            const next = { ...prev };
            if (next[id]) {
                delete next[id];
            } else {
                next[id] = 1;
            }
            return next;
        });
    };

    const handleAddToCart = () => {
        // Collect all snacks
        const snacksToInclude = Object.keys(selectedSnacks).map(id => {
            const snackProduct = allSnacks.find(s => (s._id || s.id) === id);
            return snackProduct ? { ...snackProduct, quantity: selectedSnacks[id] } : null;
        }).filter(Boolean);

        const itemsToSend = [
            { ...product, quantity },
            ...snacksToInclude
        ];

        // Navigate to "Pedidos" (OrdersScreen)
        navigation.navigate('MainTabs', {
            screen: 'Pedidos',
            params: {
                incomingItems: itemsToSend,
                source: 'ProductDetails',
                orderId: Date.now()
            }
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Header with Background Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: product.image }} style={styles.image} />

                    {/* Overlay for top icons */}
                    <View style={[styles.headerOverlay, { paddingTop: insets.top + theme.spacing.sm }]}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content Details */}
                <View style={styles.contentContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{product.name}</Text>
                        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoBadge}>
                            <Ionicons name="star" size={16} color={theme.colors.secondary} />
                            <Text style={styles.infoText}>{product.rating}</Text>
                        </View>
                        <View style={styles.infoBadge}>
                            <Ionicons name="flame-outline" size={16} color={theme.colors.error} />
                            <Text style={styles.infoText}>{product.calories}</Text>
                        </View>
                        {product.prepTime && (
                            <View style={styles.infoBadge}>
                                <Ionicons name="time-outline" size={16} color={theme.colors.primaryLight} />
                                <Text style={styles.infoText}>{product.prepTime}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.description}>{product.description}</Text>

                    {product.items && product.items.length > 0 && (
                        <View style={styles.itemsSection}>
                            <View style={styles.divider} />
                            <Text style={styles.sectionTitle}>¿Qué incluye este combo?</Text>
                            <View style={styles.itemsGrid}>
                                {product.items.map((item, index) => (
                                    <View key={index} style={styles.itemRow}>
                                        <View style={styles.itemIconBg}>
                                            <Text style={styles.itemIcon}>{item.icon}</Text>
                                        </View>
                                        <Text style={styles.itemText}>{item.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Quantity Selector */}
                    <View style={styles.quantitySection}>
                        <Text style={styles.sectionTitle}>Cantidad</Text>
                        <View style={styles.quantityControl}>
                            <TouchableOpacity style={styles.qtyButton} onPress={decrement}>
                                <Ionicons name="remove" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{quantity}</Text>
                            <TouchableOpacity style={styles.qtyButton} onPress={increment}>
                                <Ionicons name="add" size={24} color={theme.colors.surface} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Snack Suggestions Section - Only if lunch/breakfast */}
                    {(product.type === 'lunch' || product.type === 'breakfast' || product.categoryId === '2') && (
                        <View style={styles.snackSection}>
                            <View style={styles.divider} />
                            <Text style={styles.sectionTitle}>Complementa tu comida</Text>
                            <Text style={styles.sectionSubtitle}>¿Deseas agregar una bebida o snack?</Text>
                            
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.snackScroll}>
                                {loadingSnacks ? (
                                    <Text style={styles.loadingText}>Cargando opciones...</Text>
                                ) : allSnacks.slice(0, 6).map((snack) => {
                                    const id = snack._id || snack.id;
                                    const isSelected = !!selectedSnacks[id];
                                    return (
                                        <TouchableOpacity 
                                            key={id} 
                                            style={[styles.snackCard, isSelected && styles.snackCardSelected]}
                                            onPress={() => toggleSnack(snack)}
                                            activeOpacity={0.8}
                                        >
                                            <Image source={{ uri: snack.image }} style={styles.snackImage} />
                                            <View style={styles.snackInfo}>
                                                <Text style={styles.snackName} numberOfLines={1}>{snack.name}</Text>
                                                <Text style={styles.snackPrice}>+${snack.price.toFixed(2)}</Text>
                                            </View>
                                            <View style={[styles.snackCheck, isSelected && styles.snackCheckActive]}>
                                                <Ionicons 
                                                    name={isSelected ? "checkmark" : "add"} 
                                                    size={16} 
                                                    color={isSelected ? "#FFF" : theme.colors.primary} 
                                                />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom || theme.spacing.md }]}>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Precio Total</Text>
                    <Text style={styles.totalPrice}>${(product.price * quantity).toFixed(2)}</Text>
                </View>
                <CustomButton
                    title={product.categoryId === '2' ? "Crear pedido" : "Añadir al carrito"}
                    onPress={handleAddToCart}
                    style={styles.addButton}
                    icon={<Ionicons name={product.categoryId === '2' ? "receipt-outline" : "cart-outline"} size={20} color={theme.colors.surface} />}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    imageContainer: {
        width: '100%',
        height: height * 0.45,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    contentContainer: {
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radius.xl * 1.5,
        borderTopRightRadius: theme.radius.xl * 1.5,
        marginTop: -30, // Overlap with image
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    title: {
        flex: 1,
        fontSize: theme.typography.sizes.xxl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
        lineHeight: 32,
        paddingRight: theme.spacing.sm,
    },
    price: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.primary,
    },
    infoRow: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        fontWeight: theme.typography.weights.medium,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
        lineHeight: 24,
    },
    quantitySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.full,
        padding: 4,
    },
    qtyButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    qtyText: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
        paddingHorizontal: theme.spacing.lg,
    },
    snackSection: {
        marginTop: theme.spacing.sm,
    },
    sectionSubtitle: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.md,
    },
    snackScroll: {
        paddingRight: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    snackCard: {
        width: 130,
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        padding: 8,
        borderWidth: 1.5,
        borderColor: 'transparent',
        position: 'relative',
    },
    snackCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: '#EFF6FF',
    },
    snackImage: {
        width: '100%',
        height: 80,
        borderRadius: 12,
        marginBottom: 8,
    },
    snackName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    snackPrice: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginTop: 2,
    },
    snackCheck: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    snackCheckActive: {
        backgroundColor: theme.colors.primary,
    },
    loadingText: {
        color: theme.colors.textMuted,
        fontStyle: 'italic',
        marginTop: 10,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    totalContainer: {
        flex: 1,
    },
    totalLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
    },
    totalPrice: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
    },
    addButton: {
        flex: 1.5,
    },
    itemsSection: {
        marginTop: theme.spacing.md,
    },
    itemsGrid: {
        marginTop: theme.spacing.sm,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    itemIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...theme.shadows.small,
    },
    itemIcon: {
        fontSize: 20,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    }
});
