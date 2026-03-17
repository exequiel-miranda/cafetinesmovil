import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export const ProductCard = ({ item, onPress, onAdd }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.card}
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
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color={theme.colors.secondary} />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={onAdd}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="add" size={20} color={theme.colors.surface} />
                    </TouchableOpacity>
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
    addButton: {
        backgroundColor: theme.colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
});
