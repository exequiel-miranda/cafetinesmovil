import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, FlatList, Dimensions, Modal, Pressable, Animated, PanResponder, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { snacks, combos, allProducts } from '../data/mockData';

const { width } = Dimensions.get('window');

export const SnacksScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [quantities, setQuantities] = useState({});

    const handleAdd = (item) => {
        setQuantities(prev => ({
            ...prev,
            [item.id]: (prev[item.id] || 0) + 1
        }));
    };

    const handleRemove = (item) => {
        setQuantities(prev => {
            const newQuantities = { ...prev };
            if (newQuantities[item.id] > 1) {
                newQuantities[item.id] -= 1;
            } else {
                delete newQuantities[item.id];
            }
            return newQuantities;
        });
    };

    const handleToggle = (item) => {
        if (quantities[item.id]) {
            setQuantities(prev => { const next = { ...prev }; delete next[item.id]; return next; });
        } else {
            handleAdd(item);
        }
    };

    const bestSellers = useMemo(() => {
        // Filter out lunches (categoryId '2') AND combos (anything in the 'combos' array)
        const comboIds = combos.map(c => c.id);
        return allProducts.filter(item => 
            item.popular && 
            item.categoryId !== '2' && 
            !comboIds.includes(item.id)
        ); 
    }, []);

    const filteredSnacks = useMemo(() => {
        if (!searchQuery) return snacks;
        return snacks.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    const selectedItemsList = useMemo(() => {
        return allProducts
            .filter(item => quantities[item.id])
            .map(item => ({ ...item, quantity: quantities[item.id] }));
    }, [quantities]);

    const totalOrderPrice = selectedItemsList.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItemsCount = selectedItemsList.reduce((acc, item) => acc + item.quantity, 0);

    // Horizontal Scroll Card (For Best Sellers)
    const renderSnackCard = ({ item }) => {
        const qty = quantities[item.id] || 0;
        
        return (
            <TouchableOpacity 
                activeOpacity={1}
                style={[styles.snackCard, qty > 0 && styles.cardSelected]}
                onPress={() => handleToggle(item)}
            >
                <Image source={{ uri: item.image }} style={styles.snackImage} />
                <View style={styles.snackInfo}>
                    <Text style={styles.snackTitle} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.snackFooter}>
                        <Text style={styles.snackPrice}>${item.price.toFixed(2)}</Text>
                        
                        {qty === 0 ? (
                            <TouchableOpacity 
                                style={[styles.largeSelectBtn, { paddingHorizontal: 16 }]} 
                                onPress={() => handleAdd(item)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.largeSelectBtnText}>Agregar</Text>
                                <Ionicons name="add" size={20} color={theme.colors.primaryLight} />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.largeQtyControls}>
                                <TouchableOpacity style={styles.largeQtyBtn} onPress={() => handleRemove(item)} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                                    <Ionicons name="remove" size={24} color="#FFF" />
                                </TouchableOpacity>
                                <Text style={styles.largeQtyText}>{qty}</Text>
                                <TouchableOpacity style={styles.largeQtyBtn} onPress={() => handleAdd(item)} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                                    <Ionicons name="add" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Full Width List Card (For "Todos los Snacks")
    const renderListCard = (item) => {
        const qty = quantities[item.id] || 0;

        return (
            <TouchableOpacity 
                key={item.id}
                activeOpacity={1}
                style={[styles.listCard, qty > 0 && styles.cardSelected]}
                onPress={() => item.categoryId === '2' ? navigation.navigate('ProductDetails', { product: item }) : handleToggle(item)}
            >
                <Image source={{ uri: item.image }} style={styles.listImage} />
                <View style={styles.listContent}>
                    <Text style={styles.listTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.listDescription} numberOfLines={2}>{item.description}</Text>
                    
                    <View style={styles.listFooter}>
                        <Text style={styles.listPrice}>${item.price.toFixed(2)}</Text>
                        
                        {qty === 0 ? (
                            <TouchableOpacity 
                                style={[styles.largeSelectBtn, item.categoryId === '2' && { backgroundColor: '#EEF2FF' }]} 
                                onPress={() => item.categoryId === '2' ? navigation.navigate('ProductDetails', { product: item }) : handleAdd(item)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.largeSelectBtnText, item.categoryId === '2' && { color: '#6366F1' }]}>
                                    {item.categoryId === '2' ? 'Crear pedido' : 'Agregar'}
                                </Text>
                                <Ionicons 
                                    name={item.categoryId === '2' ? "receipt-outline" : "add"} 
                                    size={20} 
                                    color={item.categoryId === '2' ? '#6366F1' : theme.colors.primaryLight} 
                                />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.largeQtyControls}>
                                <TouchableOpacity style={styles.largeQtyBtn} onPress={() => handleRemove(item)} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                                    <Ionicons name="remove" size={24} color="#FFF" />
                                </TouchableOpacity>
                                <Text style={styles.largeQtyText}>{qty}</Text>
                                <TouchableOpacity style={styles.largeQtyBtn} onPress={() => handleAdd(item)} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                                    <Ionicons name="add" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.largeTitle}>Snacks</Text>
                <TouchableOpacity style={styles.profileBtn}>
                    <Ionicons name="fast-food" size={28} color={theme.colors.primaryLight} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInner}>
                    <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Quiero pedir..."
                        placeholderTextColor="#8E8E93"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {searchQuery === '' && bestSellers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Más Vendidos</Text>
                        <FlatList 
                            data={bestSellers}
                            keyExtractor={item => item.id}
                            renderItem={renderSnackCard}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                            snapToInterval={276} 
                            decelerationRate="fast"
                        />
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{searchQuery ? 'Resultados' : 'Todos los Snacks'}</Text>
                    <View style={styles.listContainer}>
                        {filteredSnacks.map(item => renderListCard(item))}
                        
                        {filteredSnacks.length === 0 && (
                            <View style={styles.emptyStateContainer}>
                                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyText}>No encontramos lo que buscas.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {totalItemsCount > 0 && (
                <View style={styles.floatingContainer}>
                    <TouchableOpacity 
                        style={styles.checkoutBtn} 
                        activeOpacity={0.9} 
                        onPress={() => {
                            navigation.navigate('Pedidos', { 
                                incomingItems: selectedItemsList, 
                                source: 'Snacks',
                                orderId: Date.now()
                            });
                        }}
                    >
                        <View style={styles.checkoutInfo}>
                            <View style={styles.checkoutBadge}>
                                <Text style={styles.checkoutBadgeText}>{totalItemsCount}</Text>
                            </View>
                            <Text style={styles.checkoutText}>Ver Pedido</Text>
                        </View>
                        <Text style={styles.checkoutTotal}>${totalOrderPrice.toFixed(2)}</Text>
                    </TouchableOpacity>
                </View>
            )}


        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    largeTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#111827',
        letterSpacing: 0.5,
    },
    profileBtn: {
        backgroundColor: '#EFF6FF',
        padding: 8,
        borderRadius: 16,
    },
    searchContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
    },
    searchInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        height: '100%',
    },
    scrollContent: {
        paddingBottom: 140, 
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: 24, 
        fontWeight: '800', 
        color: '#111827',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    horizontalList: {
        paddingHorizontal: theme.spacing.lg,
        gap: 16, 
    },
    cardSelected: {
        borderColor: theme.colors.primaryLight,
        borderWidth: 2,
    },
    /* Horizontal Snack Cards */
    snackCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24, 
        width: 260, 
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    snackImage: {
        width: '100%',
        height: 180, 
        backgroundColor: '#F3F4F6',
    },
    snackInfo: {
        padding: 18, 
    },
    snackTitle: {
        fontSize: 18, 
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
        minHeight: 46, 
    },
    snackFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    snackPrice: {
        fontSize: 20, 
        fontWeight: '900',
        color: theme.colors.primaryLight,
    },
    /* Full Width List Cards */
    listContainer: {
        paddingHorizontal: theme.spacing.lg,
    },
    listCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 16,
        padding: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'center',
    },
    listImage: {
        width: 100, 
        height: 100,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
    },
    listContent: {
        flex: 1,
        marginLeft: 16, 
        justifyContent: 'center',
    },
    listTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    listDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 12,
    },
    listFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listPrice: {
        fontSize: 19,
        fontWeight: '900',
        color: theme.colors.primaryLight,
    },
    /* Reused UI Large Add Buttons */
    largeSelectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
    },
    largeSelectBtnText: {
        fontSize: 16,
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
        width: 120, 
        height: 46, 
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
        fontSize: 18,
    },
    /* Combo Cards Configuration */
    comboCard: {
        width: 320, 
        height: 220, 
        borderRadius: 24, 
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: '#FFF',
    },
    comboImage: {
        width: '100%',
        height: 140,
    },
    comboInfo: {
        padding: 16,
        backgroundColor: '#FFF',
    },
    comboTitle: {
        color: '#111827',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    comboPrice: {
        color: theme.colors.primaryLight,
        fontSize: 17,
        fontWeight: '900',
    },
    comboAddBtnFloat: {
        position: 'absolute',
        top: 14,
        right: 14,
        backgroundColor: '#FFF',
        width: 44, 
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    comboQtyControlsFloat: {
        position: 'absolute',
        top: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primaryLight,
        borderRadius: 22,
        padding: 6,
        height: 46, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    comboQtyValueContainer: {
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    comboQtyTextFloat: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 18,
    },
    /* Empty State */
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    /* Floating Bottom Bar */
    floatingContainer: {
        position: 'absolute',
        bottom: 110, 
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        backgroundColor: theme.colors.primaryLight,
        borderRadius: 18, 
        shadowColor: theme.colors.primaryLight,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    checkoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    checkoutInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkoutBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkoutBadgeText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 15,
    },
    checkoutText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    checkoutTotal: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    /* Preview Modal Styles */
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '80%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 10,
    },
    modalDragIndicator: {
        width: 48,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 12,
    },
    dragHandle: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 16,
    },
    modalImageContainer: {
        position: 'relative',
        width: '100%',
        height: 240,
        paddingHorizontal: 20,
    },
    modalImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 10,
        right: 30,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width:0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modalInfoContainer: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        flex: 1,
        marginRight: 10,
    },
    modalPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.primaryLight,
    },
    modalDescription: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalItemsSection: {
        marginTop: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 20,
    },
    modalItemsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    modalItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalItemIconBg: {
        backgroundColor: '#EFF6FF',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modalItemIcon: {
        fontSize: 22,
    },
    modalItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    modalBottomActionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 36, // SafeArea padding
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    modalAddBtn: {
        backgroundColor: theme.colors.primaryLight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 18,
        borderRadius: 20,
    },
    modalAddBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    modalAddBtnPrice: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
    },
    modalStepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primaryLight,
        borderRadius: 20,
        height: 60,
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    modalStepperInnerBtn: {
        paddingHorizontal: 16,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalStepperText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    }
});
