import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useProducts } from '../hooks/useApi';

const SnackCard = React.memo(({ snack, quantity, onAdd, onRemove }) => {
    return (
        <TouchableOpacity
            style={[styles.snackCard, quantity > 0 && styles.snackCardSelected]}
            onPress={() => quantity === 0 && onAdd(snack)}
            activeOpacity={0.85}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: snack.image }} style={styles.snackImage} />
                
                {quantity === 0 ? (
                    <TouchableOpacity 
                        style={styles.miniAddBtn} 
                        onPress={() => onAdd(snack)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Ionicons name="add" size={22} color={theme.colors.primaryLight} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.integratedControlsContainer}>
                        <TouchableOpacity 
                            style={styles.integratedBtn} 
                            onPress={() => onRemove && onRemove(snack)}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 10 }}
                        >
                            <Ionicons name="remove" size={24} color={theme.colors.primaryLight} />
                        </TouchableOpacity>
                        
                        <Text style={styles.integratedQtyText}>{quantity}</Text>
                        
                        <TouchableOpacity 
                            style={styles.integratedBtn} 
                            onPress={() => onAdd(snack)}
                            hitSlop={{ top: 15, bottom: 15, left: 10, right: 15 }}
                        >
                            <Ionicons name="add" size={24} color={theme.colors.primaryLight} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            <View style={styles.snackInfo}>
                <Text style={styles.snackName} numberOfLines={1}>{snack.name}</Text>
                <Text style={styles.snackPrice}>${snack.price.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    );
});

export const FloatingCheckout = ({ totalItems, totalPrice, onCheckout, onAddSnack, onRemoveSnack, showSuggestions = true, quantities = {} }) => {
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
                            <SnackCard 
                                key={snack._id || snack.id}
                                snack={snack}
                                quantity={quantities[snack._id || snack.id] || 0}
                                onAdd={onAddSnack}
                                onRemove={onRemoveSnack}
                            />
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
        borderRadius: 20,
        width: 140,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    snackCardSelected: {
        borderColor: theme.colors.primaryLight,
    },
    imageContainer: {
        width: '100%',
        height: 95,
        position: 'relative',
    },
    snackImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
    },
    miniAddBtn: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#FFF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        zIndex: 10,
    },
    integratedControlsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        paddingHorizontal: 4,
        zIndex: 10,
    },
    integratedBtn: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    integratedQtyText: {
        color: theme.colors.primary,
        fontSize: 17,
        fontWeight: '900',
        minWidth: 24,
        textAlign: 'center',
    },
    snackInfo: {
        padding: 10,
        paddingTop: 10,
        alignItems: 'flex-start',
    },
    snackName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 2,
    },
    snackPrice: {
        fontSize: 13,
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
