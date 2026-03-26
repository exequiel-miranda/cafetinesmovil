import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { CustomButton } from '../components/CustomButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { useProducts } from '../hooks/useApi.js';

export const CartScreen = ({ navigation }) => {
    const { products: allProducts } = useProducts();
    const insets = useSafeAreaInsets();

    const [cartItems, setCartItems] = useState([]);

    const updateQuantity = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const renderCartItem = ({ item }) => (
        <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />

            <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>

                <View style={styles.quantityControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, -1)}>
                        <Ionicons name="remove" size={16} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, 1)}>
                        <Ionicons name="add" size={16} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.13; // mock 13% tax
    const total = subtotal + tax;

    return (
        <View style={styles.container}>
            <ScreenHeader title="Mi Pedido" showBack />

            {cartItems.length > 0 ? (
                <>
                    <FlatList
                        data={cartItems}
                        keyExtractor={item => item._id || item.id}
                        renderItem={renderCartItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />

                    <View style={[styles.summaryContainer, { paddingBottom: insets.bottom || theme.spacing.lg }]}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Impuestos (13%)</Text>
                            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                        </View>

                        <CustomButton
                            title="Pagar Pedido"
                            style={styles.checkoutBtn}
                            onPress={() => {
                                alert('Pedido procesado con éxito!');
                                navigation.navigate('Home');
                            }}
                        />
                    </View>
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color={theme.colors.border} />
                    <Text style={styles.emptyText}>Tu carrito está vacío</Text>
                    <Text style={styles.emptySubtext}>Añade algunos snacks o almuerzos deliciosos.</Text>
                    <CustomButton
                        title="Explorar Menú"
                        onPress={() => navigation.navigate('Home')}
                        style={{ marginTop: theme.spacing.xl }}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        padding: theme.spacing.lg,
        paddingBottom: 200, // Make room for summary
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.small,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: theme.radius.md,
        marginRight: theme.spacing.md,
    },
    itemContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: {
        flex: 1,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.semibold,
        color: theme.colors.text,
        marginRight: theme.spacing.sm,
    },
    itemPrice: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.primary,
        marginVertical: theme.spacing.xs,
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        alignSelf: 'flex-start',
        borderRadius: theme.radius.md,
        padding: 2,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    qtyText: {
        paddingHorizontal: theme.spacing.md,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.semibold,
    },
    summaryContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        ...theme.shadows.large,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    summaryLabel: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
    },
    summaryValue: {
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.medium,
        color: theme.colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.sm,
    },
    totalLabel: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
    },
    totalValue: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.primary,
    },
    checkoutBtn: {
        marginTop: theme.spacing.lg,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyText: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
        marginTop: theme.spacing.lg,
    },
    emptySubtext: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
    }
});
