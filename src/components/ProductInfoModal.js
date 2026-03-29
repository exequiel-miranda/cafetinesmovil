import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Pressable, ScrollView, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const ProductInfoModal = ({ item, visible, onClose }) => {
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
            panY.setValue(SCREEN_HEIGHT);
            Animated.spring(panY, {
                toValue: 0,
                grow: false,
                useNativeDriver: true,
                bounciness: 4,
            }).start();
        }
    }, [visible]);

    const closeModal = () => {
        Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const panResponder = useMemo(() => 
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (e, gestureState) => {
                const clampedDy = Math.max(-80, gestureState.dy);
                panY.setValue(clampedDy);
            },
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.8) {
                    closeModal();
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 6,
                    }).start();
                }
            }
        }), [panY]);

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={closeModal}
        >
            <View style={styles.modalOverlay}>
                <Pressable style={styles.modalBackdrop} onPress={closeModal} />
                <Animated.View 
                    style={[
                        styles.modalSheet,
                        {
                            transform: [{ 
                                translateY: panY.interpolate({ 
                                    inputRange: [-100, 0, SCREEN_HEIGHT], 
                                    outputRange: [0, 0, SCREEN_HEIGHT] 
                                }) 
                            }]
                        }
                    ]}
                >
                    <View {...panResponder.panHandlers} style={styles.modalHandleContainer}>
                        <View style={styles.modalHandle} />
                    </View>
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
                            
                            {item.items && item.items.length > 0 && (
                                <View style={styles.itemsSection}>
                                    <Text style={styles.itemsTitle}>¿Qué incluye este combo?</Text>
                                    {item.items.map((subitem, index) => (
                                        <View key={index} style={styles.itemRow}>
                                            <View style={styles.itemIconBg}>
                                                <Text style={styles.itemIcon}>{subitem.icon}</Text>
                                            </View>
                                            <Text style={styles.itemText}>{subitem.name}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                            <Text style={styles.closeBtnText}>Cerrar</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 12,
    },
    modalHandleContainer: {
        width: '100%',
        paddingTop: 14,
        paddingBottom: 4,
        alignItems: 'center',
    },
    modalHandle: {
        width: 44,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
    },
    modalContent: {
        paddingBottom: 8,
    },
    modalImage: {
        width: '100%',
        height: 240,
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
    itemsSection: {
        marginTop: 10,
    },
    itemsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    itemIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...theme.shadows.small,
    },
    itemIcon: {
        fontSize: 20,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
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
