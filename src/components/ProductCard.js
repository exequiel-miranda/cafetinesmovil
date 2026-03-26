import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export const ProductCard = ({ item, onPress, onAdd, onRemove, quantity = 0, isSelected }) => {
    const [infoVisible, setInfoVisible] = useState(false);

    return (
        <>
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
                    {/* Info Button */}
                    <TouchableOpacity
                        style={styles.infoBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            setInfoVisible(true);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="information-circle" size={22} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
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

            {/* Info Modal */}
            <Modal
                visible={infoVisible}
                transparent
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setInfoVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setInfoVisible(false)} />
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                            <Image
                                source={{ uri: item.image }}
                                style={styles.modalImage}
                                resizeMode="cover"
                            />
                            <View style={styles.modalBody}>
                                {item.popular && (
                                    <View style={styles.modalBadge}>
                                        <Ionicons name="star" size={12} color="#F59E0B" />
                                        <Text style={styles.modalBadgeText}>Popular</Text>
                                    </View>
                                )}
                                <Text style={styles.modalTitle}>{item.name}</Text>
                                <Text style={styles.modalPrice}>${item.price.toFixed(2)}</Text>
                                {item.description ? (
                                    <Text style={styles.modalDescription}>{item.description}</Text>
                                ) : null}
                                {item.category && (
                                    <View style={styles.modalCategoryRow}>
                                        <Ionicons name="pricetag-outline" size={14} color={theme.colors.textMuted} />
                                        <Text style={styles.modalCategory}>{item.category}</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setInfoVisible(false)}>
                                <Text style={styles.closeBtnText}>Cerrar</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
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
    infoBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: '#FFFBEB',
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
    /* Info Modal */
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 12,
    },
    modalHandle: {
        width: 44,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 14,
        marginBottom: 4,
    },
    modalContent: {
        paddingBottom: 8,
    },
    modalImage: {
        width: '100%',
        height: 220,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalBody: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    modalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFBEB',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 10,
    },
    modalBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400E',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 6,
    },
    modalPrice: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.primary,
        marginBottom: 14,
    },
    modalDescription: {
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 24,
        marginBottom: 16,
    },
    modalCategoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modalCategory: {
        fontSize: 14,
        color: theme.colors.textMuted,
        fontWeight: '600',
    },
    closeBtn: {
        marginHorizontal: 24,
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6B7280',
    },
});
