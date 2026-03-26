import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    Animated, PanResponder, Modal, Pressable, 
    KeyboardAvoidingView, Platform, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme.js';
import { useOrders } from '../hooks/useApi.js';
import { apiService } from '../api/apiService.js';

export const OrdersScreen = ({ route, navigation }) => {
    const { orders: activeOrders, loading: loadingOrders, refresh: refreshOrders } = useOrders();
    const [isTicketOpen, setIsTicketOpen] = useState(false);
    const [isFullScreenNumberOpen, setIsFullScreenNumberOpen] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // List for local pending orders (before they are sent to backend)
    const [pendingOrders, setPendingOrders] = useState([]);
    
    const [orderInPayment, setOrderInPayment] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Card Payment State
    const [showCardForm, setShowCardForm] = useState(false);
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

    const sourceConfig = {
        'Almuerzos':      { color: '#10B981', bg: '#ECFDF5', icon: 'restaurant' },
        'Snacks':         { color: '#3B82F6', bg: '#EFF6FF', icon: 'fast-food' },
        'Inicio':         { color: '#F59E0B', bg: '#FFFBEB', icon: 'home' },
        'ProductDetails': { color: '#6366F1', bg: '#EEF2FF', icon: 'information-circle' },
        'Desayunos':      { color: '#F59E0B', bg: '#FFFBEB', icon: 'cafe' },
    };

    const defaultSourceConfig = { color: '#6B7280', bg: '#F3F4F6', icon: 'receipt' };

    // Effect to catch new incoming orders from other screens
    useEffect(() => {
        if (route.params?.orderId && route.params?.incomingItems) {
            const { orderId, incomingItems, source } = route.params;
            
            // Avoid adding the same order twice if the screen re-renders
            setPendingOrders(prev => {
                if (prev.some(o => o.orderId === orderId)) return prev;
                return [...prev, {
                    orderId,
                    items: incomingItems,
                    source,
                    total: incomingItems.reduce((acc, i) => acc + i.price * i.quantity, 0),
                    status: 'Pendiente de pago'
                }];
            });

            // Clear the params so they don't get re-added on back navigation/render
            navigation.setParams({ orderId: null, incomingItems: null, source: null });
        }
    }, [route.params?.orderId]);

    const handlePayment = async (method) => {
        if (!orderInPayment) return;

        if (method === 'Tarjeta' && !showCardForm) {
            setShowCardForm(true);
            return;
        }

        try {
            // Build the confirmed order object for backend
            const orderData = {
                items: orderInPayment.items.map(item => ({
                    productId: item._id || item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                total: orderInPayment.total,
                source: orderInPayment.source,
                paymentMethod: method,
                status: method === 'Efectivo' ? 'Esperando pago' : 'En Preparación'
            };

            const response = await apiService.createOrder(orderData);
            
            if (response.ok) {
                // Remove from local pending
                setPendingOrders(prev => prev.filter(o => o.orderId !== orderInPayment.orderId));
                // Refresh list from backend
                refreshOrders();
                
                setShowPaymentModal(false);
                setShowCardForm(false);
                setCardData({ number: '', expiry: '', cvv: '', name: '' });
                setOrderInPayment(null);
            }
        } catch (error) {
            console.error('Error al crear pedido:', error);
            alert('Error al procesar el pedido: ' + error.message);
        }
    };

    const panY = useRef(new Animated.Value(0)).current;
    const fullPanY = useRef(new Animated.Value(0)).current;
    const paymentPanY = useRef(new Animated.Value(0)).current;

    const ticketPanResponder = useMemo(() => 
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 1.0) {
                    Animated.timing(panY, {
                        toValue: 800,
                        duration: 250,
                        useNativeDriver: false,
                    }).start(() => {
                        setIsTicketOpen(false);
                    });
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: false,
                    }).start();
                }
            }
        }), [panY, setIsTicketOpen]);

    const fullScreenPanResponder = useMemo(() => 
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([null, { dy: fullPanY }], { useNativeDriver: false }),
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 1.0) {
                    Animated.timing(fullPanY, {
                        toValue: 800,
                        duration: 250,
                        useNativeDriver: false,
                    }).start(() => {
                        setIsFullScreenNumberOpen(false);
                    });
                } else {
                    Animated.spring(fullPanY, {
                        toValue: 0,
                        useNativeDriver: false,
                    }).start();
                }
            }
        }), [fullPanY, setIsFullScreenNumberOpen]);

    const paymentPanResponder = useMemo(() => 
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([null, { dy: paymentPanY }], { useNativeDriver: false }),
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 1.0) {
                    Animated.timing(paymentPanY, {
                        toValue: 800,
                        duration: 250,
                        useNativeDriver: false,
                    }).start(() => {
                        setShowPaymentModal(false);
                        setShowCardForm(false);
                        setCardData({ number: '', expiry: '', cvv: '', name: '' });
                    });
                } else {
                    Animated.spring(paymentPanY, {
                        toValue: 0,
                        useNativeDriver: false,
                    }).start();
                }
            }
        }), [paymentPanY, setShowPaymentModal, setShowCardForm, setCardData]);

    useEffect(() => {
        if (isTicketOpen) panY.setValue(0);
    }, [isTicketOpen]);

    useEffect(() => {
        if (isFullScreenNumberOpen) fullPanY.setValue(0);
    }, [isFullScreenNumberOpen]);

    useEffect(() => {
        if (showPaymentModal) paymentPanY.setValue(0);
    }, [showPaymentModal]);

    const renderOrderItem = (item, index) => (
        <View key={index} style={styles.orderDetailRow}>
            <Text style={styles.orderDetailQty}>{item.quantity}x</Text>
            <Text style={styles.orderDetailName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.orderDetailPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
    );



    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.largeTitle}>Mis Pedidos</Text>
                <TouchableOpacity style={styles.profileBtn}>
                    <Ionicons name="receipt" size={28} color={theme.colors.primaryLight} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Loop through all pending orders */}
                {pendingOrders.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Nuevos Pedidos</Text>
                        {pendingOrders.map((order) => {
                            const cfg = sourceConfig[order.source] || defaultSourceConfig;
                            return (
                                <View key={order.orderId} style={[styles.activeOrderCard, styles.pendingOrderCard, { borderLeftWidth: 4, borderLeftColor: cfg.color, marginBottom: 16 }]}>
                                    <View style={styles.activeOrderHeader}>
                                        <View style={styles.activeOrderTitleRow}>
                                            <View style={[styles.sourceBadge, { backgroundColor: cfg.bg }]}>
                                                <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                                                <Text style={[styles.sourceBadgeText, { color: cfg.color }]}>{order.source}</Text>
                                            </View>
                                            <View style={styles.statusIndicator}>
                                                <View style={[styles.pulseDot, { backgroundColor: '#FF4D4D' }]} />
                                                <Text style={[styles.statusText2, { color: '#FF4D4D' }]}>POR PAGAR</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.orderItemsContainer}>
                                        {order.items.map((item, idx) => renderOrderItem(item, idx))}
                                    </View>

                                    <View style={styles.pendingFooterTotal}>
                                        <Text style={styles.pendingTotalLabel}>Total a pagar</Text>
                                        <Text style={styles.activeOrderTotal}>${order.total.toFixed(2)}</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.completeOrderBtn}
                                        onPress={() => {
                                            setOrderInPayment(order);
                                            paymentPanY.setValue(0);
                                            setShowPaymentModal(true);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.completeOrderText}>Completar pedido</Text>
                                        <Ionicons name="receipt-outline" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Loop through all confirmed/active orders */}
                {activeOrders.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {activeOrders.length > 1 ? 'Pedidos listos para recoger' : 'Pedido listo para recoger'}
                        </Text>
                        {activeOrders.map((order) => {
                            const cfg = sourceConfig[order.source] || defaultSourceConfig;
                            // Color mapping for statuses
                            const statusColors = {
                                'Esperando pago': '#F59E0B',
                                'En Preparación': '#3B82F6',
                                'Listo': '#10B981',
                                'Entregado': '#6B7280',
                                'Cancelado': '#EF4444',
                            };
                            const statusColor = statusColors[order.status] || theme.colors.primary;

                            return (
                                <View key={order._id} style={[styles.activeOrderCard, styles.confirmedOrderCard, { borderLeftWidth: 4, borderLeftColor: cfg.color, marginBottom: 16 }]}>
                                    <View style={styles.activeOrderHeader}>
                                        <View>
                                            <View style={[styles.sourceBadge, { backgroundColor: cfg.bg, marginBottom: 8, alignSelf: 'flex-start' }]}>
                                                <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                                                <Text style={[styles.sourceBadgeText, { color: cfg.color, fontSize: 11 }]}>{order.source}</Text>
                                            </View>
                                            <View style={styles.confirmedHeaderRow}>
                                                <Text style={styles.activeOrderLabel}>Estado</Text>
                                                <View style={styles.confirmedBadge}>
                                                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                                                    <Text style={styles.confirmedBadgeText}>CONFIRMADO</Text>
                                                </View>
                                            </View>
                                            <View style={styles.statusRow}>
                                                <View style={[styles.pulseDot, { backgroundColor: statusColor }]} />
                                                <Text style={[styles.activeStatusText, { color: statusColor }]}>
                                                    {order.status}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                <View style={styles.divider} />

                                <View style={styles.activeOrderItems}>
                                    {order.items.map(renderOrderItem)}
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.activeOrderFooter}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.activeTotal}>${order.total.toFixed(2)}</Text>
                                </View>

                                <TouchableOpacity 
                                    style={styles.trackButton} 
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        setSelectedOrder(order);
                                        setIsTicketOpen(true);
                                    }}
                                >
                                    <Text style={styles.trackButtonText}>Ver Ticket</Text>
                                    <Ionicons name="qr-code-outline" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                    </View>
                )}


                
            </ScrollView>

            {/* Modal de Selección de Pago */}
            <Modal
                visible={showPaymentModal}
                transparent={true}
                animationType="none"
                statusBarTranslucent={true}
                onRequestClose={() => {
                    setShowPaymentModal(false);
                    setShowCardForm(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <Pressable 
                        style={styles.modalBackdrop} 
                        onPress={() => {
                            setShowPaymentModal(false);
                            setShowCardForm(false);
                        }} 
                    />
                    <Animated.View 
                        style={[
                            styles.modalContent, 
                            { 
                                height: showCardForm ? '85%' : 'auto',
                                transform: [{ 
                                    translateY: paymentPanY.interpolate({ 
                                        inputRange: [-100, 0, 1000], 
                                        outputRange: [0, 0, 1000] 
                                    }) 
                                }] 
                            }
                        ]}
                    >
                        <View {...paymentPanResponder.panHandlers} style={{ width: '100%', alignItems: 'center', paddingTop: 16, paddingBottom: 16 }}>
                            <View style={styles.modalDragIndicator} />
                        </View>
                        
                        <KeyboardAvoidingView 
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={{ flex: showCardForm ? 1 : 0 }}
                        >
                            {!showCardForm ? (
                                <View style={{ paddingBottom: 40 }}>
                                    <View style={styles.paymentModalHeader}>
                                        <Text style={styles.paymentModalTitle}>Método de pago</Text>
                                        <Text style={styles.paymentModalSubtitle}>
                                            Selecciona cómo deseas pagar tu pedido de {orderInPayment?.source}
                                        </Text>
                                    </View>

                                    <View style={styles.paymentOptionsContainer}>
                                        <TouchableOpacity 
                                            style={styles.paymentOptionCard}
                                            onPress={() => handlePayment('Efectivo')}
                                        >
                                            <View style={[styles.paymentIconBg, { backgroundColor: '#FCD34D' }]}>
                                                <Ionicons name="cash-outline" size={28} color="#92400E" />
                                            </View>
                                            <View style={styles.paymentOptionInfo}>
                                                <Text style={styles.paymentOptionTitle}>Efectivo</Text>
                                                <Text style={styles.paymentOptionDesc}>Paga al retirar tu pedido</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={styles.paymentOptionCard}
                                            onPress={() => handlePayment('Tarjeta')}
                                        >
                                            <View style={[styles.paymentIconBg, { backgroundColor: '#60A5FA' }]}>
                                                <Ionicons name="card-outline" size={28} color="#1E40AF" />
                                            </View>
                                            <View style={styles.paymentOptionInfo}>
                                                <Text style={styles.paymentOptionTitle}>Tarjeta de Débito/Crédito</Text>
                                                <Text style={styles.paymentOptionDesc}>Visa, Mastercard, AMEX</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity 
                                        style={styles.cancelPaymentBtn}
                                        onPress={() => setShowPaymentModal(false)}
                                    >
                                        <Text style={styles.cancelPaymentText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 24 }}>
                                    <View style={styles.paymentModalHeader}>
                                        <TouchableOpacity 
                                            style={styles.backButton}
                                            onPress={() => setShowCardForm(false)}
                                        >
                                            <Ionicons name="arrow-back" size={24} color="#111827" />
                                        </TouchableOpacity>
                                        <Text style={styles.paymentModalTitle}>Detalles de Tarjeta</Text>
                                    </View>

                                    {/* Visual Card Preview */}
                                    <View style={styles.cardPreview}>
                                        <View style={styles.cardPreviewTop}>
                                            <Ionicons name="wifi-outline" size={24} color="#FFF" style={{ transform: [{ rotate: '90deg' }] }} />
                                            <Text style={styles.cardBankName}>ANTARES BANK</Text>
                                        </View>
                                        <Text style={styles.cardNumberPreview}>
                                            {cardData.number || '•••• •••• •••• ••••'}
                                        </Text>
                                        <View style={styles.cardPreviewBottom}>
                                            <View>
                                                <Text style={styles.cardLabelPreview}>TITULAR</Text>
                                                <Text style={styles.cardValuePreview}>{cardData.name.toUpperCase() || 'NOMBRE APELLIDO'}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.cardLabelPreview}>EXP</Text>
                                                <Text style={styles.cardValuePreview}>{cardData.expiry || 'MM/AA'}</Text>
                                            </View>
                                            <Ionicons name="logo-bitcoin" size={32} color="#FFF" style={{ opacity: 0.8 }} />
                                        </View>
                                    </View>

                                    {/* Card Inputs */}
                                    <View style={styles.cardInputsContainer}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Número de Tarjeta</Text>
                                            <TextInput 
                                                style={styles.cardInput}
                                                placeholder="0000 0000 0000 0000"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="numeric"
                                                maxLength={19}
                                                value={cardData.number}
                                                onChangeText={(val) => setCardData({...cardData, number: val})}
                                            />
                                        </View>

                                        <View style={styles.inputRow}>
                                            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                                                <Text style={styles.inputLabel}>Expiración</Text>
                                                <TextInput 
                                                    style={styles.cardInput}
                                                    placeholder="MM/AA"
                                                    placeholderTextColor="#9CA3AF"
                                                    keyboardType="numeric"
                                                    maxLength={5}
                                                    value={cardData.expiry}
                                                    onChangeText={(val) => setCardData({...cardData, expiry: val})}
                                                />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.inputLabel}>CVV</Text>
                                                <TextInput 
                                                    style={styles.cardInput}
                                                    placeholder="123"
                                                    placeholderTextColor="#9CA3AF"
                                                    keyboardType="numeric"
                                                    maxLength={3}
                                                    secureTextEntry
                                                    value={cardData.cvv}
                                                    onChangeText={(val) => setCardData({...cardData, cvv: val})}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Nombre del Titular</Text>
                                            <TextInput 
                                                style={styles.cardInput}
                                                placeholder="Ej: JUAN PEREZ"
                                                placeholderTextColor="#9CA3AF"
                                                autoCapitalize="characters"
                                                value={cardData.name}
                                                onChangeText={(val) => setCardData({...cardData, name: val})}
                                            />
                                        </View>

                                        <TouchableOpacity 
                                            style={styles.payNowBtn}
                                            onPress={() => handlePayment('Tarjeta')}
                                        >
                                            <Text style={styles.payNowText}>Pagar ahora - ${orderInPayment?.total.toFixed(2)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            )}
                        </KeyboardAvoidingView>
                    </Animated.View>
                </View>
            </Modal>

            {selectedOrder && (
                <Modal
                    visible={isTicketOpen}
                    animationType="none"
                    transparent={true}
                    statusBarTranslucent={true}
                    onRequestClose={() => setIsTicketOpen(false)}
                >
                    <View style={styles.modalOverlay}>
                        <Pressable style={styles.modalBackdrop} onPress={() => setIsTicketOpen(false)} />
                        
                        <Animated.View 
                            style={[styles.modalContent, { 
                                transform: [{ 
                                    translateY: panY.interpolate({ inputRange: [-100, 0, 1000], outputRange: [0, 0, 1000] }) 
                                }] 
                            }]}
                        >
                            <View {...ticketPanResponder.panHandlers} style={{ width: '100%', alignItems: 'center', paddingTop: 16, paddingBottom: 16 }}>
                                <View style={styles.modalDragIndicator} />
                            </View>
                            
                            <View style={styles.ticketHeader}>
                                <Text style={styles.ticketTitle}>Ticket de Pedido</Text>
                                <TouchableOpacity onPress={() => setIsTicketOpen(false)}>
                                    <Ionicons name="close-circle" size={28} color={theme.colors.textMuted} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ticketScroll}>
                                <TouchableOpacity 
                                    style={styles.qrContainer}
                                    activeOpacity={0.7}
                                    onPress={() => setIsFullScreenNumberOpen(true)}
                                >
                                    <Ionicons name="qr-code" size={120} color={theme.colors.text} />
                                    <Text style={styles.ticketId}>Pedido #{selectedOrder.orderNumber || selectedOrder._id.slice(-4).toUpperCase()}</Text>
                                    <Text style={styles.expandText}>Toca para agrandar</Text>
                                    <Text style={styles.ticketStatus}>{selectedOrder.status}</Text>
                                </TouchableOpacity>
                                
                                <View style={styles.ticketDivider} />

                                <Text style={styles.ticketSectionTitle}>Detalle del Pedido</Text>
                                {selectedOrder.items.map((item, index) => (
                                    <View key={index} style={styles.ticketItemRow}>
                                        <Text style={styles.ticketItemQty}>{item.quantity}x</Text>
                                        <Text style={styles.ticketItemName}>{item.name}</Text>
                                        <Text style={styles.ticketItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                                    </View>
                                ))}
                                
                                <View style={styles.ticketDivider} />

                                <View style={styles.ticketTotalRow}>
                                    <Text style={styles.ticketTotalLabel}>Total Pagado</Text>
                                    <Text style={styles.ticketTotalValue}>${selectedOrder.total.toFixed(2)}</Text>
                                </View>
                                
                                <Text style={styles.ticketHint}>
                                    Muestra este código en la cafetería para retirar tu pedido.
                                </Text>
                            </ScrollView>
                        </Animated.View>
                    </View>
                </Modal>
            )}

            {selectedOrder && (
                <Modal
                    visible={isFullScreenNumberOpen}
                    animationType="fade"
                    transparent={false}
                    onRequestClose={() => setIsFullScreenNumberOpen(false)}
                >
                    <Animated.View 
                        style={[styles.fullScreenModalContainer, { 
                            transform: [{ 
                                translateY: fullPanY.interpolate({ inputRange: [-100, 0, 1000], outputRange: [0, 0, 1000] }) 
                            }] 
                        }]}
                    >
                        <TouchableOpacity style={styles.fullScreenCloseBtn} onPress={() => setIsFullScreenNumberOpen(false)}>
                            <Ionicons name="close" size={40} color={theme.colors.text} />
                        </TouchableOpacity>
                        
                        <View style={styles.fullScreenContent}>
                            <View style={styles.fullScreenTopSection} {...fullScreenPanResponder.panHandlers}>
                                <Text style={styles.fullScreenLabel}>PEDIDO</Text>
                                <Text style={styles.fullScreenNumber} adjustsFontSizeToFit numberOfLines={1}>
                                    {selectedOrder.orderNumber || selectedOrder._id.slice(-4).toUpperCase()}
                                </Text>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} style={styles.fullScreenItemsScrollView} contentContainerStyle={styles.fullScreenItemsContainer}>
                                {selectedOrder.items.map((item, index) => (
                                    <View key={index} style={styles.fullScreenItemRow}>
                                        <Text style={styles.fullScreenItemQty}>{item.quantity}x</Text>
                                        <Text style={styles.fullScreenItemName}>{item.name}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    </Animated.View>
                </Modal>
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
    scrollContent: {
        paddingBottom: 110,
    },
    section: {
        marginBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 24, 
        fontWeight: '800', 
        color: '#111827',
        marginBottom: theme.spacing.md,
    },
    /* Active Order Styles */
    activeOrderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 2,
        borderColor: theme.colors.primaryLight,
        shadowColor: theme.colors.primaryLight,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
    },
    pendingOrderCard: {
        backgroundColor: '#FAFAFA',
        borderStyle: 'dashed',
        borderColor: '#D1D5DB',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    confirmedOrderCard: {
        backgroundColor: '#FFFFFF',
        borderStyle: 'solid',
        borderColor: theme.colors.primaryLight,
    },
    confirmedHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    confirmedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
    },
    confirmedBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
    },
    activeOrderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    activeOrderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 5,
    },
    sourceBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText2: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderItemsContainer: {
        marginVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    activeOrderLabel: {
        fontSize: 13,
        color: theme.colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    activeStatusText: {
        fontSize: 18,
        fontWeight: '800',
    },
    timeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    timeText: {
        color: theme.colors.primaryLight,
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 6,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    activeOrderItems: {
        gap: 8,
    },
    orderDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderDetailQty: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.primaryLight,
        width: 30,
    },
    orderDetailName: {
        flex: 1,
        fontSize: 15,
        color: '#4B5563',
        fontWeight: '500',
    },
    orderDetailPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    activeOrderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    activeOrderFooterPending: {
        marginTop: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    activeOrderTotal: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
    },
    totalLabel: {
        fontSize: 16,
        color: theme.colors.textMuted,
        fontWeight: '600',
    },
    activeTotal: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
    },
    trackButton: {
        backgroundColor: theme.colors.primaryLight,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    trackButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    pendingFooterTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 14,
        paddingHorizontal: 2,
    },
    pendingTotalLabel: {
        fontSize: 14,
        color: theme.colors.textMuted,
        fontWeight: '600',
    },
    completeOrderBtn: {
        backgroundColor: '#10B981',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    completeOrderText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    /* Past Orders Styles */
    pastOrderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    pastOrderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    pastOrderDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pastOrderDate: {
        fontSize: 14,
        color: theme.colors.textMuted,
        fontWeight: '600',
    },
    pastOrderTotal: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    pastOrderBody: {
        marginBottom: 12,
    },
    pastOrderSummary: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 20,
    },
    pastOrderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    pastOrderActionText: {
        color: theme.colors.primaryLight,
        fontWeight: '700',
        fontSize: 14,
    },
    /* Ticket Modal Styles */
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
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    ticketTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
    },
    ticketScroll: {
        padding: 24,
        paddingBottom: 40,
    },
    qrContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    ticketId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 12,
    },
    ticketStatus: {
        fontSize: 16,
        color: theme.colors.primaryLight,
        fontWeight: '600',
        marginTop: 4,
    },
    ticketDivider: {
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginVertical: 20,
        borderRadius: 1,
    },
    ticketSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    ticketItemRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    ticketItemQty: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.primaryLight,
        width: 32,
    },
    ticketItemName: {
        flex: 1,
        fontSize: 15,
        color: '#4B5563',
    },
    ticketItemPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    ticketTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ticketTotalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    ticketTotalValue: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.primaryLight,
    },
    ticketHint: {
        textAlign: 'center',
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 32,
    },
    expandText: {
        fontSize: 14,
        color: theme.colors.primaryLight,
        fontWeight: '600',
        marginTop: 2,
    },
    /* Full Screen Number Modal Styles */
    fullScreenModalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    fullScreenCloseBtn: {
        alignSelf: 'flex-end',
        padding: 16,
        paddingRight: 24,
    },
    fullScreenContent: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    fullScreenTopSection: {
        alignItems: 'center',
        marginBottom: 10,
        width: '100%',
        paddingVertical: 10,
    },
    fullScreenLabel: {
        fontSize: 36,
        color: theme.colors.textMuted,
        fontWeight: '900',
        marginBottom: 0,
        textTransform: 'uppercase',
        letterSpacing: 4,
    },
    fullScreenNumber: {
        fontSize: 220,
        fontWeight: '900',
        color: theme.colors.primary,
        textAlign: 'center',
        includeFontPadding: false,
    },
    fullScreenItemsScrollView: {
        flex: 1,
        width: '100%',
    },
    fullScreenItemsContainer: {
        paddingHorizontal: 10,
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 40,
    },
    fullScreenItemRow: {
        flexDirection: 'row',
        marginBottom: 28,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    fullScreenItemQty: {
        fontSize: 36,
        fontWeight: '900',
        color: theme.colors.primaryLight,
        marginRight: 16,
    },
    fullScreenItemName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#111827',
        flexShrink: 1,
        textAlign: 'center',
        lineHeight: 40,
    },
    /* Payment Modal Styles */
    paymentModalHeader: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 20,
        alignItems: 'center',
    },
    paymentModalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    paymentModalSubtitle: {
        fontSize: 15,
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
    paymentOptionsContainer: {
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 20,
    },
    paymentOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    paymentIconBg: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    paymentOptionInfo: {
        flex: 1,
    },
    paymentOptionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    paymentOptionDesc: {
        fontSize: 13,
        color: theme.colors.textMuted,
    },
    cancelPaymentBtn: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    cancelPaymentText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '600',
    },
    /* Card Form Styles */
    backButton: {
        position: 'absolute',
        left: 0,
        top: 8,
        padding: 5,
    },
    cardPreview: {
        backgroundColor: '#1F2937',
        height: 190,
        borderRadius: 24,
        padding: 24,
        justifyContent: 'space-between',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    cardPreviewTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardBankName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    cardNumberPreview: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 2,
        marginVertical: 10,
    },
    cardPreviewBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    cardLabelPreview: {
        color: '#9CA3AF',
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardValuePreview: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    cardInputsContainer: {
        gap: 16,
        paddingBottom: 40,
    },
    inputGroup: {
        gap: 8,
    },
    inputRow: {
        flexDirection: 'row',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    cardInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
    },
    payNowBtn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    payNowText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    }
});
