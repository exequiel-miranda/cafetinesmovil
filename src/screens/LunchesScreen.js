import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProductCard } from '../components/ProductCard';
import { theme } from '../theme/theme';
import { useProducts } from '../hooks/useApi.js';
import { FloatingCheckout } from '../components/FloatingCheckout';

export const LunchesScreen = ({ navigation }) => {
    const { products: allAlmuerzos, loading: loadingAlmuerzos } = useProducts({ type: 'lunch' });
    const { products: allDesayunos, loading: loadingDesayunos } = useProducts({ type: 'breakfast' });
    const { products: allSnacks, loading: loadingSnacks } = useProducts({ type: 'snack' });

    const [mealType, setMealType] = useState('Almuerzos'); // 'Almuerzos' o 'Desayunos'
    const [quantities, setQuantities] = useState({});

    const handleAdd = (item) => {
        const id = item._id || item.id;
        setQuantities(prev => ({
            ...prev,
            [id]: (prev[id] || 0) + 1
        }));
    };

    const handleRemove = (item) => {
        const id = item._id || item.id;
        setQuantities(prev => {
            const newQuantities = { ...prev };
            if (newQuantities[id] > 1) {
                newQuantities[id] -= 1;
            } else {
                delete newQuantities[id];
            }
            return newQuantities;
        });
    };

    const handleToggle = (item) => {
        const id = item._id || item.id;
        if (quantities[id]) {
            setQuantities(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        } else {
            handleAdd(item);
        }
    };

    const handleCheckout = () => {
        Alert.alert(
            "Pedido Confirmado", 
            "Tu almuerzo y acompañamientos han sido agregados al carrito exitosamente.",
            [{ text: "OK" }]
        );
    };

    // Función para obtener la fecha formateada
    const getFormattedDate = () => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const now = new Date();
        return `${days[now.getDay()]} ${now.getDate()} de ${months[now.getMonth()]}`;
    };

    // Calcular total
    let total = 0;
    let totalItems = 0;
    
    Object.keys(quantities).forEach(id => {
        const qty = quantities[id];
        const product = [...allAlmuerzos, ...allDesayunos, ...allSnacks].find(p => (p._id || p.id) === id);
        if (product) {
            total += product.price * qty;
            totalItems += qty;
        }
    });

    const currentMenu = mealType === 'Almuerzos' ? allAlmuerzos : allDesayunos;
    const isLoading = mealType === 'Almuerzos' ? loadingAlmuerzos : loadingDesayunos;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.largeTitle}>{mealType}</Text>
                    <Text style={styles.headerDate}>{getFormattedDate()}</Text>
                </View>
                <View style={styles.profileBtn}>
                    <Ionicons name={mealType === 'Almuerzos' ? "restaurant" : "cafe"} size={28} color={theme.colors.primaryLight} />
                </View>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, mealType === 'Desayunos' && styles.activeTab]} 
                    onPress={() => setMealType('Desayunos')}
                >
                    <Ionicons name="cafe-outline" size={20} color={mealType === 'Desayunos' ? '#FFF' : '#6B7280'} />
                    <Text style={[styles.tabText, mealType === 'Desayunos' && styles.activeTabText]}>Desayunos</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, mealType === 'Almuerzos' && styles.activeTab]} 
                    onPress={() => setMealType('Almuerzos')}
                >
                    <Ionicons name="restaurant-outline" size={20} color={mealType === 'Almuerzos' ? '#FFF' : '#6B7280'} />
                    <Text style={[styles.tabText, mealType === 'Almuerzos' && styles.activeTabText]}>Almuerzos</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Menú del Día</Text>
                    <Text style={styles.sectionSubtitle}>Explora nuestras opciones de {mealType.toLowerCase()}</Text>
                    
                    {isLoading ? (
                        <Text style={styles.emptyText}>Cargando menú...</Text>
                    ) : currentMenu.map((item) => (
                        <View key={item._id || item.id} style={styles.itemWrapper}>
                            <ProductCard 
                                item={item} 
                                quantity={quantities[item._id || item.id] || 0}
                                onPress={() => handleToggle(item)}
                                onAdd={() => handleAdd(item)}
                                onRemove={() => handleRemove(item)}
                            />
                        </View>
                    ))}
                </View>


            </ScrollView>

            {/* Floating order button - same style as SnacksScreen */}
            <FloatingCheckout 
                totalItems={totalItems}
                totalPrice={total}
                onCheckout={() => {
                    const selectedItems = Object.keys(quantities)
                        .map(id => {
                            const product = [...allAlmuerzos, ...allDesayunos, ...allSnacks].find(p => (p._id || p.id) === id);
                            return product ? { ...product, quantity: quantities[id] } : null;
                        })
                        .filter(Boolean);
                    navigation.navigate('Pedidos', { 
                        incomingItems: selectedItems, 
                        source: mealType,
                        orderId: Date.now()
                    });
                }}
                onAddSnack={(snack) => handleAdd(snack)}
                onRemoveSnack={(snack) => handleRemove(snack)}
                showSuggestions={true}
                quantities={quantities}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
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
    headerDate: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: -4,
        fontWeight: '500',
    },
    profileBtn: {
        backgroundColor: '#EFF6FF',
        padding: 8,
        borderRadius: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        padding: 4,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    activeTab: {
        backgroundColor: theme.colors.primaryLight,
        shadowColor: theme.colors.primaryLight,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#FFF',
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 110, // Make sure we can scroll past the footer
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
    },
    sectionSubtitle: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.md,
        marginTop: 2,
    },
    itemWrapper: {
        marginBottom: theme.spacing.md,
    },
});
