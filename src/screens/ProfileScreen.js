import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, PanResponder, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useOrders } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const ProfileScreen = () => {
    const { orders: allOrders, loading } = useOrders();
    const { logout } = useAuth();
    const [activeModal, setActiveModal] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const openModal = (item) => {
        setActiveModal(item);
        setModalVisible(true);
        translateY.setValue(SCREEN_HEIGHT);
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 4,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 280,
            useNativeDriver: false,
        }).start(() => {
            setModalVisible(false);
            setActiveModal(null);
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (e, gestureState) => {
                const clampedDy = Math.max(-80, gestureState.dy);
                translateY.setValue(clampedDy);
            },
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.8) {
                    closeModal();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: false,
                        bounciness: 6,
                    }).start();
                }
            }
        })
    ).current;

    const menuItems = [
        { id: '3', title: 'Mis Pedidos Pasados', icon: 'time-outline', color: '#8B5CF6' },
        { id: '2', title: 'Métodos de Pago', icon: 'card-outline', color: '#3B82F6' },
        { id: '4', title: 'Configuración', icon: 'settings-outline', color: '#6B7280' },
        { id: '5', title: 'Ayuda y Soporte', icon: 'help-circle-outline', color: '#F59E0B' },
    ];

    const pastOrders = allOrders.filter(o => o.status === 'Entregado' || o.status === 'Cancelado' || !o.isActive);

    const renderPastOrder = (item) => (
        <TouchableOpacity key={item._id || item.id} style={styles.pastOrderCard} activeOpacity={0.7}>
            <View style={styles.pastOrderHeader}>
                <View style={styles.pastOrderDateContainer}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textMuted} />
                    <Text style={styles.pastOrderDate}>{item.date}</Text>
                </View>
                <Text style={styles.pastOrderTotal}>${item.total.toFixed(2)}</Text>
            </View>

            <View style={styles.pastOrderBody}>
                <Text style={styles.pastOrderSummary} numberOfLines={1}>
                    {item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </Text>
            </View>

            <View style={styles.pastOrderFooter}>
                <View style={[styles.statusBadge, { backgroundColor: item.statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
                </View>
                <Text style={styles.pastOrderActionText}>Ver Detalles</Text>
            </View>
        </TouchableOpacity>
    );

    const renderMenuItem = (item) => (
        <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => openModal(item)}
        >
            <View style={styles.menuItemLeft}>
                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.largeTitle}>Mi Perfil</Text>
                <TouchableOpacity style={styles.settingsBtn}>
                    <Ionicons name="notifications-outline" size={28} color={theme.colors.primaryLight} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person-circle" size={80} color={theme.colors.primaryLight} />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>Estudiante Ejemplo</Text>
                        <Text style={styles.userEmail}>estudiante@escuela.edu</Text>
                        <View style={styles.userBadge}>
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.userBadgeText}>Cliente Premium</Text>
                        </View>
                    </View>
                </View>

                {/* Main Menu */}
                <View style={styles.menuSection}>
                    {menuItems.map(renderMenuItem)}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    activeOpacity={0.8}
                    onPress={() => openModal({ title: 'Cerrar Sesión', icon: 'log-out-outline', color: '#EF4444' })}
                >
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>

                <Text style={styles.appVersion}>Antares App v1.0.0 by Bryan.exe</Text>

            </ScrollView>

            {/* Custom draggable bottom sheet modal */}
            <Modal
                visible={modalVisible}
                animationType="none"
                transparent={true}
                statusBarTranslucent={true}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={closeModal} />

                    <Animated.View style={[styles.modalContent, { transform: [{ translateY }] }]}>

                        {/* Drag Handle — gesture captured HERE */}
                        <View
                            {...panResponder.panHandlers}
                            style={styles.dragHandle}
                        >
                            <View style={styles.modalDragIndicator} />
                        </View>

                        {activeModal && (
                            <>
                                <View style={styles.modalHeader}>
                                    <View style={[styles.iconBox, { backgroundColor: activeModal.color + '15', marginRight: 12 }]}>
                                        <Ionicons name={activeModal.icon} size={24} color={activeModal.color} />
                                    </View>
                                    <Text style={styles.modalTitle}>{activeModal.title}</Text>
                                    <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
                                        <Ionicons name="close-circle" size={28} color={theme.colors.textMuted} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalBody}>
                                    {activeModal.id === '3' ? (
                                        <ScrollView
                                            showsVerticalScrollIndicator={false}
                                            style={styles.historyScroll}
                                            contentContainerStyle={styles.historyContent}
                                        >
                                            {pastOrders.map(renderPastOrder)}
                                        </ScrollView>
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={activeModal.title === 'Cerrar Sesión' ? 'log-out-outline' : 'construct-outline'}
                                                size={60}
                                                color={theme.colors.textMuted}
                                                style={styles.modalBodyIcon}
                                            />
                                            <Text style={styles.modalBodyText}>
                                                {activeModal.title === 'Cerrar Sesión'
                                                    ? '¿Estás seguro que deseas cerrar sesión de tu cuenta en este dispositivo?'
                                                    : `La sección de ${activeModal.title} se encuentra en desarrollo. Próximamente podrás gestionar estos datos aquí.`}
                                            </Text>
                                            <TouchableOpacity
                                                style={[styles.modalActionBtn, activeModal.title === 'Cerrar Sesión' && { backgroundColor: '#EF4444' }]}
                                                onPress={async () => {
                                                    if (activeModal.title === 'Cerrar Sesión') {
                                                        await logout();
                                                    }
                                                    closeModal();
                                                }}
                                            >
                                                <Text style={styles.modalActionText}>
                                                    {activeModal.title === 'Cerrar Sesión' ? 'Cerrar Sesión' : 'Entendido'}
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </>
                        )}
                    </Animated.View>
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
    settingsBtn: {
        backgroundColor: '#EFF6FF',
        padding: 8,
        borderRadius: 16,
    },
    scrollContent: {
        paddingBottom: 120,
        paddingHorizontal: theme.spacing.lg,
    },
    /* User Card */
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    avatarContainer: {
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 15,
        color: theme.colors.textMuted,
        marginBottom: 8,
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    userBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D97706',
        marginLeft: 4,
    },
    /* Menu Section */
    menuSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    /* Logout */
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingVertical: 16,
        borderRadius: 20,
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#EF4444',
        marginLeft: 8,
    },
    appVersion: {
        textAlign: 'center',
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    /* Modal Styles */
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
        minHeight: '40%',
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 10,
    },
    dragHandle: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 14,
        paddingBottom: 10,
    },
    modalDragIndicator: {
        width: 48,
        height: 5,
        backgroundColor: '#D1D5DB',
        borderRadius: 3,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalBody: {
        padding: 24,
        alignItems: 'center',
    },
    modalBodyIcon: {
        marginBottom: 16,
        opacity: 0.5,
    },
    modalBodyText: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    modalActionBtn: {
        backgroundColor: theme.colors.primaryLight,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    modalActionText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    /* History Styles */
    historyScroll: {
        width: '100%',
        maxHeight: SCREEN_HEIGHT * 0.6,
    },
    historyContent: {
        paddingBottom: 20,
    },
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
});
