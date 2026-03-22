import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export const ProductCard = ({ item, onPress, onAdd, onRemove, quantity = 0, isSelected }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={[styles.card, (isSelected || quantity > 0) && styles.cardSelected]}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="cover"
                />
                {item.popular && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Popular</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                    
                    {!quantity ? (
                        <TouchableOpacity style={styles.largeSelectBtn} onPress={onAdd} activeOpacity={0.7}>
                            <Text style={styles.largeSelectBtnText}>
                                {item.categoryId === '2' ? 'Crear pedido' : 'Agregar'}
                            </Text>
                            <Ionicons 
                                name={item.categoryId === '2' ? "receipt-outline" : "add"} 
                                size={20} 
                                color={theme.colors.primaryLight} 
                            />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.largeQtyControls}>
                            <TouchableOpacity style={styles.largeQtyBtn} onPress={onRemove} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                                <Ionicons name="remove" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.largeQtyText}>{quantity}</Text>
                            <TouchableOpacity style={styles.largeQtyBtn} onPress={onAdd} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                                <Ionicons name="add" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        marginBottom: theme.spacing.lg,
        overflow: 'hidden',
        ...theme.shadows.medium,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: theme.colors.primaryLight,
    },
    imageContainer: {
        height: 180,
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    badge: {
        position: 'absolute',
        top: theme.spacing.md,
        left: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.sm,
    },
    badgeText: {
        color: theme.colors.surface,
        fontSize: theme.typography.sizes.xs,
        fontWeight: theme.typography.weights.bold,
    },
    content: {
        padding: theme.spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    title: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB', // Light amber background
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.radius.sm,
    },
    ratingText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.semibold,
        color: theme.colors.secondary,
        marginLeft: 4,
    },
    description: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        lineHeight: 20,
        marginBottom: theme.spacing.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    price: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.primary,
    },
    largeSelectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
    },
    largeSelectBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.primaryLight,
        marginRight: 6,
    },
    largeQtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primaryLight,
        borderRadius: 16,
        paddingHorizontal: 6,
        paddingVertical: 4,
        width: 110, 
        height: 42, 
        justifyContent: 'space-between',
    },
    largeQtyBtn: {
        paddingHorizontal: 10,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    largeQtyText: {
        color: '#FFF',
        fontWeight: '900', 
        fontSize: 16,
    },
});
