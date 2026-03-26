import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useProducts } from '../hooks/useApi';

export const FloatingCheckout = ({ totalItems, totalPrice, onCheckout, onAddSnack, showSuggestions = true, quantities = {} }) => {
    const { products: allSnacks, loading: loadingSnacks } = useProducts({ type: 'snack' });
    const [isExpanded, setIsExpanded] = React.useState(false);

    if (totalItems === 0) return null;

    return (
        <View style={styles.floatingContainer}>
            {/* Quick Add Snacks Section (Collapsible) */}
            {showSuggestions && isExpanded && (
                <View style={styles.snackSuggestionSection}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="fast-food" size={18} color="#FFF" />
                            <Text style={styles.snackSuggestionTitle}>¿Deseas acompañar tu pedido?</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsExpanded(false)}>
                            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.snackScroll}
                    >
                        {loadingSnacks ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Buscando complementos...</Text>
                            </View>
                        ) : allSnacks.slice(0, 8).map((snack) => (
                            <TouchableOpacity
                                key={snack._id || snack.id}
                                style={styles.snackCard}
                                onPress={() => onAddSnack(snack)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.imageContainer}>
                                    <Image source={{ uri: snack.image }} style={styles.snackImage} />
                                    <View style={styles.plusBadge}>
                                        {(quantities[snack._id || snack.id] || 0) > 0 ? (
                                            <Text style={styles.plusBadgeText}>
                                                {quantities[snack._id || snack.id]}
                                            </Text>
                                        ) : (
                                            <Ionicons name="add" size={16} color="#FFF" />
                                        )}
                                    </View>
                                </View>
                                <View style={styles.snackInfo}>
                                    <Text style={styles.snackName} numberOfLines={1}>{snack.name}</Text>
                                    <Text style={styles.snackPrice}>${snack.price.toFixed(2)}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Main Checkout Button Area */}
            <View style={styles.buttonArea}>
                {showSuggestions && !isExpanded && (
                    <TouchableOpacity
                        style={styles.suggestionToggle}
                        onPress={() => setIsExpanded(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="fast-food" size={16} color="#FFF" />
                        <Text style={styles.suggestionToggleText}>Agregar</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.checkoutBtn}
                    activeOpacity={0.9}
                    onPress={onCheckout}
                >
                    <View style={styles.checkoutInfo}>
                        <View style={styles.checkoutBadge}>
                            <Text style={styles.checkoutBadgeText}>{totalItems}</Text>
                        </View>
                        <Text style={styles.checkoutText}>Realizar pedido</Text>
                    </View>
                    <View style={styles.totalContainer}>
                        <Text style={styles.checkoutTotal}>${totalPrice.toFixed(2)}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: 6 }} />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    floatingContainer: {
        position: 'absolute',
        bottom: 110,
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        backgroundColor: theme.colors.primary,
        borderRadius: 30,
        padding: 8,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
    },
    snackSuggestionSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 24,
        padding: 12,
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    snackSuggestionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    snackScroll: {
        gap: 12,
        paddingRight: 10,
    },
    snackCard: {
        backgroundColor: '#FFF',
        borderRadius: 18,
        width: 100,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 70,
        position: 'relative',
    },
    snackImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
    },
    plusBadge: {
        position: 'absolute',
        bottom: -10,
        right: 8,
        backgroundColor: theme.colors.secondary || '#F59E0B',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        zIndex: 10,
    },
    plusBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
    },
    snackInfo: {
        padding: 8,
        paddingTop: 12,
        alignItems: 'center',
    },
    snackName: {
        fontSize: 10,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 2,
    },
    snackPrice: {
        fontSize: 11,
        fontWeight: '900',
        color: theme.colors.primary,
    },
    buttonArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    suggestionToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        gap: 6,
    },
    suggestionToggleText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
    },
    checkoutBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 8,
    },
    checkoutInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkoutBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkoutBadgeText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 16,
    },
    checkoutText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '800',
    },
    totalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkoutTotal: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '900',
    },
    loadingContainer: {
        height: 100,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 13,
        fontStyle: 'italic',
    }
});
