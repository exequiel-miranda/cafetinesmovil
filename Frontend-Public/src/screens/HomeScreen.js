import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme.js';
import { useOrders } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.js';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation }) => {
    // Dashboard Data from Hooks & Context
    const { user } = useAuth();
    const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
    const { orders: allOrders, loading: loadingOrders, refresh: refreshOrders } = useOrders();

    // Refresh data when the screen is focused
    useFocusEffect(
        React.useCallback(() => {
            refreshOrders();
            return () => { };
        }, [])
    );

    // Filter Active Orders (Exclude finished/canceled ones)
    const activeOrders = allOrders.filter(o =>
        o.status !== 'Entregado' &&
        o.status !== 'Cancelado'
    );

    const userBalance = user?.balance || 0;
    const userName = user?.name?.split(' ')[0] || 'Estudiante';

    const todayMenu = {
        lunch: { name: 'Pechuga a la Plancha', side: 'Ensalada Cesar', icon: 'restaurant-outline' },
        breakfast: { name: 'Waffles con Frutas', side: 'Jugo de Naranja', icon: 'cafe-outline' }
    };

    const announcements = [
        { id: '1', title: 'Lunes de Fruta Gratis', body: 'Por cada almuerzo recibe una manzana o pera totalmente gratis.', icon: 'leaf-outline', color: '#10B981' },
        { id: '2', title: 'Horarios de Exámenes', body: 'El cafetín cerrará 15 minutos más tarde durante esta semana.', icon: 'time-outline', color: '#F59E0B' }
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola, {userName}</Text>
                    <Text style={styles.subtitle}>Panel de Control</Text>
                </View>
                <View style={styles.profileIconBg}>
                    <Ionicons name="home" size={24} color={theme.colors.primaryLight} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* 1. Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceInfo}>
                        <Text style={styles.balanceLabel}>Saldo Disponible</Text>
                        <Text style={styles.balanceAmount}>${userBalance.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity style={styles.rechargeBtn} onPress={() => setRechargeModalOpen(true)}>
                        <Ionicons name="add-circle" size={24} color="#FFF" />
                        <Text style={styles.rechargeText}>Recargar</Text>
                    </TouchableOpacity>
                </View>

                {/* 2. Active Order Status (If exists) */}
                {loadingOrders ? (
                    <View style={styles.statusSection}>
                        <Text style={styles.sectionTitle}>Estado de mis pedidos</Text>
                        <View style={[styles.statusCard, { justifyContent: 'center', opacity: 0.6 }]}>
                            <Text style={styles.orderId}>Actualizando pedidos...</Text>
                        </View>
                    </View>
                ) : activeOrders.length > 0 && (
                    <View style={styles.statusSection}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>
                                {activeOrders.length > 1 ? 'Estado de mis pedidos' : 'Estado de mi pedido'}
                            </Text>
                        </View>

                        <View style={styles.statusCardWrapper}>
                            <TouchableOpacity
                                style={styles.statusCard}
                                onPress={() => navigation.navigate('Pedidos')}
                            >
                                <View style={styles.statusIconBg}>
                                    <Ionicons name="timer" size={28} color={theme.colors.primaryLight} />
                                </View>
                                <View style={styles.statusTextContainer}>
                                    <View style={styles.statusHeaderRow}>
                                        <Text style={styles.orderId}>
                                            Pedido #{activeOrders[0].orderNumber || (activeOrders[0]._id ? activeOrders[0]._id.slice(-4).toUpperCase() : '----')}
                                        </Text>
                                        {activeOrders[0].status ? (
                                            <View style={[
                                                styles.activeBadge,
                                                {
                                                    backgroundColor:
                                                        activeOrders[0].status?.toLowerCase() === 'listo' ? '#10B981' :
                                                            activeOrders[0].status?.toLowerCase() === 'esperando pago' ? '#F59E0B' :
                                                                '#3B82F6'
                                                }
                                            ]}>
                                                <Text style={styles.activeBadgeText}>{activeOrders[0].status}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <Text style={styles.orderDetail} numberOfLines={1}>
                                        {activeOrders[0].items && activeOrders[0].items.length > 0
                                            ? activeOrders[0].items.map(i => `${i.quantity}x ${i.name}`).join(', ')
                                            : 'Sin detalles del producto'}
                                    </Text>
                                    <Text style={styles.orderTime}>
                                        {activeOrders[0].date ? `Fecha: ${activeOrders[0].date}` : `Origen: ${activeOrders[0].source || 'Cafetería'}`}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                            </TouchableOpacity>

                            {activeOrders.length > 1 && (
                                <TouchableOpacity
                                    style={styles.seeMoreVertical}
                                    onPress={() => navigation.navigate('Pedidos')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.vShape} />
                                    <View style={styles.seeMoreTextBox}>
                                        <Text style={styles.seeMoreVerticalText}>Ver más ({activeOrders.length})</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* 3. Quick Access Tiles */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
                    <View style={styles.tilesGrid}>
                        <TouchableOpacity
                            style={[styles.tile, { backgroundColor: '#EEF2FF' }]}
                            onPress={() => navigation.navigate('Almuerzos')}
                        >
                            <View style={[styles.tileIconBg, { backgroundColor: '#6366F1' }]}>
                                <Ionicons name="restaurant" size={24} color="#FFF" />
                            </View>
                            <Text style={styles.tileTitle}>Pedir Comida</Text>
                            <Text style={styles.tileSubtitle}>Almuerzos y Desayunos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tile, { backgroundColor: '#E0F2FE' }]}
                            onPress={() => navigation.navigate('Snacks')}
                        >
                            <View style={[styles.tileIconBg, { backgroundColor: '#0EA5E9' }]}>
                                <Ionicons name="fast-food" size={24} color="#FFF" />
                            </View>
                            <Text style={styles.tileTitle}>Pedir Snack</Text>
                            <Text style={styles.tileSubtitle}>Snacks, Bebidas y más</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 4. Menu of the Day (Informational) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Menú de Hoy</Text>
                    <View style={styles.menuBillboard}>
                        <View style={styles.menuItem}>
                            <View style={styles.menuRow}>
                                <Ionicons name={todayMenu.lunch.icon} size={22} color={theme.colors.primaryLight} />
                                <Text style={styles.menuType}>Almuerzo</Text>
                            </View>
                            <Text style={styles.menuName}>{todayMenu.lunch.name}</Text>
                            <Text style={styles.menuSide}>con {todayMenu.lunch.side}</Text>
                        </View>
                        <View style={styles.menuDivider} />
                        <View style={styles.menuItem}>
                            <View style={styles.menuRow}>
                                <Ionicons name={todayMenu.breakfast.icon} size={22} color="#D97706" />
                                <Text style={[styles.menuType, { color: '#D97706' }]}>Desayuno</Text>
                            </View>
                            <Text style={styles.menuName}>{todayMenu.breakfast.name}</Text>
                            <Text style={styles.menuSide}>con {todayMenu.breakfast.side}</Text>
                        </View>
                    </View>
                </View>

                {/* 5. Announcements / News */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <Text style={styles.sectionTitle}>Avisos del Cafetín</Text>
                    {announcements.map(notice => (
                        <View key={notice.id} style={styles.noticeCard}>
                            <View style={[styles.noticeIconBg, { backgroundColor: notice.color + '15' }]}>
                                <Ionicons name={notice.icon} size={22} color={notice.color} />
                            </View>
                            <View style={styles.noticeTextContainer}>
                                <Text style={styles.noticeTitle}>{notice.title}</Text>
                                <Text style={styles.noticeBody}>{notice.body}</Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>

            <Modal
                visible={rechargeModalOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setRechargeModalOpen(false)}
            >
                <View style={styles.rechargeModalBg}>
                    <View style={styles.rechargeModalContainer}>
                        <View style={styles.rechargeHeaderRow}>
                            <Text style={styles.rechargeModalTitle}>Recargar Saldo</Text>
                            <TouchableOpacity onPress={() => setRechargeModalOpen(false)}>
                                <Ionicons name="close-circle" size={28} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.rechargeModalSubtitle}>Selecciona tu método de abono</Text>

                        {/* Cash Option */}
                        <View style={[styles.rechargeOptionCard, { borderColor: '#10B981', backgroundColor: '#ECFDF5' }]}>
                            <View style={styles.rechargeOptionRow}>
                                <View style={[styles.rechargeIconSquare, { backgroundColor: '#10B981' }]}>
                                    <Ionicons name="cash" size={24} color="#FFF" />
                                </View>
                                <Text style={[styles.rechargeOptionTitle, { color: '#065F46' }]}>En Efectivo</Text>
                            </View>
                            <View style={styles.rechargeStepsBox}>
                                <Text style={styles.rechargeStepText}>1. Dirígete al cafetín.</Text>
                                <Text style={styles.rechargeStepText}>2. Da tu número de carnet.</Text>
                                <Text style={styles.rechargeStepText}>3. Entrega el dinero en efectivo.</Text>
                                <Text style={styles.rechargeStepText}>4. ¡Tu saldo se actualizará al instante!</Text>
                            </View>
                        </View>

                        {/* Card Option (Disabled) */}
                        <View style={[styles.rechargeOptionCard, { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' }]}>
                            <View style={[styles.rechargeOptionRow, { opacity: 0.85 }]}>
                                <View style={[styles.rechargeIconSquare, { backgroundColor: '#94A3B8' }]}>
                                    <Ionicons name="card" size={24} color="#FFF" />
                                </View>
                                <Text style={[styles.rechargeOptionTitle, { color: '#64748B' }]}>Con Tarjeta</Text>
                            </View>
                            <View style={styles.disabledOverlay}>
                                <View style={styles.disabledBadge}>
                                    <Text style={styles.disabledBadgeText}>Opción no disponible</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

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
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    greeting: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 2,
    },
    profileIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        paddingBottom: 120, // Space for bottom tab bar and fab
    },
    /* Balance Card */
    balanceCard: {
        backgroundColor: theme.colors.primary,
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...theme.shadows.medium,
        marginBottom: 24,
    },
    balanceInfo: {
        flex: 1,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    balanceAmount: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
    },
    rechargeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        gap: 8,
    },
    rechargeText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    /* Section Shared Styles */
    statusSection: {
        marginTop: 8,
        marginBottom: 16,
    },
    section: {
        marginTop: 32,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    /* Status Card */
    statusCardWrapper: {
        alignItems: 'center',
    },
    statusCard: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...theme.shadows.small,
        zIndex: 2,
    },
    seeMoreVertical: {
        marginTop: -1,
        alignItems: 'center',
        zIndex: 1,
    },
    vShape: {
        width: 10,
        height: 10,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderColor: '#E2E8F0',
        transform: [{ rotate: '-45deg' }],
        marginTop: 4,
    },
    seeMoreTextBox: {
        marginTop: 4,
    },
    seeMoreVerticalText: {
        color: '#94A3B8',
        fontWeight: '800',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statusIconBg: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    statusHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    orderId: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    activeBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    activeBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    orderDetail: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 2,
    },
    orderTime: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
    /* Tiles Grid */
    tilesGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    tile: {
        flex: 1,
        height: 140,
        borderRadius: 24,
        padding: 16,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    tileIconBg: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tileTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginTop: 12,
    },
    tileSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    /* Menu Billboard */
    menuBillboard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...theme.shadows.small,
    },
    menuItem: {
        paddingVertical: 4,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    menuType: {
        fontSize: 13,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: theme.colors.primaryLight,
    },
    menuName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    menuSide: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    /* Notice Card */
    noticeCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    noticeIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noticeTextContainer: {
        flex: 1,
        marginLeft: 14,
    },
    noticeTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 2,
    },
    noticeBody: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    // Modal Styles
    rechargeModalBg: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    rechargeModalContainer: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    rechargeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    rechargeModalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
    },
    rechargeModalSubtitle: {
        fontSize: 15,
        color: '#64748B',
        marginBottom: 20,
    },
    rechargeOptionCard: {
        borderWidth: 2,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    rechargeOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    rechargeIconSquare: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rechargeOptionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    rechargeStepsBox: {
        marginLeft: 52,
        gap: 6,
    },
    rechargeStepText: {
        fontSize: 14,
        color: '#064E3B',
        fontWeight: '500',
    },
    disabledOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    disabledBadge: {
        backgroundColor: 'rgba(226, 232, 240, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(203, 213, 225, 0.5)',
    },
    disabledBadgeText: {
        color: 'rgba(71, 85, 105, 0.6)',
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    }
});
