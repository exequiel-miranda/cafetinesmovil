import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, StatusBar, ActivityIndicator, Switch, KeyboardAvoidingView, Platform
} from 'react-native';
import { AppModal, AppModalAction } from '@/components/ui/AppModal';
import { SwipeableSheet } from '@/components/ui/SwipeableSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { getMaterialIcon } from '@/utils/icons';

const C = {
  bg:         '#0E0B24',
  card:       '#1A1640',
  cardHi:     '#231F52',
  border:     '#2E2A62',
  purple:     '#7B5CF5',
  purpleLight:'#9B7BFF',
  purpleDim:  'rgba(123,92,245,0.18)',
  teal:       '#00D2A3',
  tealDim:    'rgba(0,210,163,0.15)',
  amber:      '#FFB038',
  amberDim:   'rgba(255,176,56,0.15)',
  rose:       '#FF6B8A',
  roseDim:    'rgba(255,107,138,0.15)',
  textPri:    '#FFFFFF',
  textSec:    '#9B96C8',
  textMut:    '#4A4580',
};

const PREDEFINED_ICONS = [
  // Cafetín - Comida Principal
  'fastfood', 'restaurant', 'restaurant-menu', 'lunch-dining', 'dinner-dining', 
  'breakfast-dining', 'brunch-dining', 'ramen-dining', 'soup-kitchen', 'set-meal',
  'tapas', 'kebab-dining', 'rice-bowl', 'egg-alt', 'egg', 'flatware',
  
  // Cafetín - Bebidas y Café
  'local-cafe', 'coffee', 'coffee-maker', 'free-breakfast', 'emoji-food-beverage',
  'local-drink', 'liquor', 'wine-bar', 'local-bar', 'icecream', 'cake', 'cookie',
  
  // Cafetín - Snacks y Otros
  'local-pizza', 'bakery-dining', 'outdoor-grill', 'takeout-dining', 'delivery-dining',
  'local-offer', 'loyalty', 'confirmation-number', 'stars',
  
  // Gestión y Operaciones
  'point-of-sale', 'receipt-long', 'payments', 'credit-card', 'account-balance-wallet',
  'inventory', 'inventory-2', 'badge', 'assignment', 'list-alt', 'history-edu',
  'storefront', 'store', 'campaign', 'notifications-active', 'event-note',
  
  // Instalaciones y Mobiliario
  'table-bar', 'table-restaurant', 'chair-alt', 'weekend', 'event-seat',
  'kitchen', 'microwave', 'ac-unit', 'wifi', 'cleaning-services', 'sanitizer',
  
  // VIP y Categorías Especiales
  'star', 'favorite', 'verified', 'new-releases', 'trending-up', 'eco', 'spa',
  'emoji-events', 'celebration', 'festival'
];

interface Category {
    _id: string;
    name: string;
    icon: string;
    active: boolean;
}

export default function CategoriesScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [form, setForm] = useState({
        name: '',
        icon: PREDEFINED_ICONS[0],
        active: true
    });

    const [alert, setAlert] = useState<{
      visible: boolean;
      title: string;
      message: string;
      type: 'info' | 'success' | 'error' | 'confirm';
      actions: AppModalAction[];
      icon?: keyof typeof MaterialIcons.glyphMap;
    }>({ 
      visible: false, title: '', message: '', type: 'info', actions: [] 
    });

    const showAlert = (cfg: Omit<typeof alert, 'visible'>) => setAlert({ ...cfg, visible: true });
    const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const res = await apiGet('/categories');
            setCategories(res);
        } catch (error: any) {
            showAlert({
                title: 'Error de Datos',
                message: 'No pudimos cargar las categorías. ' + (error.message || ''),
                type: 'error',
                actions: [{ label: 'Reintentar', onPress: () => { hideAlert(); loadCategories(); } }]
            });
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', icon: PREDEFINED_ICONS[0], active: true });
        setModalOpen(true);
    };

    const openEdit = (cat: Category) => {
        setEditing(cat);
        setForm({ name: cat.name, icon: cat.icon, active: cat.active });
        setModalOpen(true);
    };

    const save = async () => {
        if (!form.name.trim()) {
            showAlert({
                title: 'Nombre Requerido',
                message: 'Por favor asigna un nombre a la categoría.',
                type: 'confirm',
                actions: [{ label: 'Entendido', onPress: hideAlert }]
            });
            return;
        }

        try {
            if (editing) {
                await apiPut(`/categories/${editing._id}`, form);
            } else {
                await apiPost('/categories', form);
            }
            setModalOpen(false);
            loadCategories();
        } catch (error: any) {
            showAlert({
                title: 'Error al Guardar',
                message: error.message || 'No se pudo procesar la categoría.',
                type: 'error',
                actions: [{ label: 'Cerrar', onPress: hideAlert }]
            });
        }
    };

    const toggleActive = async (cat: Category) => {
        try {
            await apiPut(`/categories/${cat._id}`, { ...cat, active: !cat.active });
            setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, active: !c.active } : c));
        } catch (error: any) {
            showAlert({
                title: 'Estado',
                message: 'No se pudo actualizar la visibilidad de la categoría.',
                type: 'error',
                actions: [{ label: 'OK', onPress: hideAlert }]
            });
        }
    };

    const remove = (id: string) => {
        showAlert({
            title: 'Eliminar Categoría',
            message: '¿Estás seguro de borrar esta categoría? Los productos asociados podrían quedar sin grupo.',
            type: 'error',
            icon: 'delete-sweep',
            actions: [
                { label: 'Cancelar', type: 'secondary', onPress: hideAlert },
                { 
                    label: 'Eliminar Ahora', 
                    type: 'danger', 
                    onPress: async () => {
                        try {
                            await apiDelete(`/categories/${id}`);
                            setCategories(prev => prev.filter(c => c._id !== id));
                            hideAlert();
                        } catch (error: any) {
                            showAlert({ title: 'Error', message: 'No se pudo eliminar: ' + error.message, type: 'error', actions: [{label: 'Cerrar', onPress: hideAlert}] });
                        }
                    }
                }
            ]
        });
    };

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor={C.bg} />
            
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={C.textPri} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Gestión de Categorías</Text>
                <TouchableOpacity onPress={openAdd}>
                    <LinearGradient colors={[C.purple, C.purpleLight]} style={s.addBtn}>
                        <MaterialIcons name="add" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator color={C.purple} size="large" /></View>
            ) : (
                <ScrollView contentContainerStyle={s.listContent}>
                    {categories.map(cat => (
                        <TouchableOpacity key={cat._id} style={[s.card, !cat.active && { opacity: 0.6 }]} onPress={() => openEdit(cat)}>
                            <View style={[s.iconCircle, { backgroundColor: C.purpleDim }]}>
                                <MaterialIcons name={getMaterialIcon(cat.icon)} size={24} color={C.purple} />
                            </View>
                            <View style={s.cardInfo}>
                                <Text style={s.catName}>{cat.name}</Text>
                                <Text style={[s.status, { color: cat.active ? C.teal : C.rose }]}>
                                    {cat.active ? 'Activa' : 'Inactiva'}
                                </Text>
                            </View>
                            <View style={s.actions}>
                                <Switch 
                                    value={cat.active} 
                                    onValueChange={() => toggleActive(cat)}
                                    trackColor={{ false: C.cardHi, true: C.purple }}
                                    thumbColor="#fff"
                                />
                                <TouchableOpacity onPress={() => remove(cat._id)} style={s.delBtn}>
                                    <MaterialIcons name="delete-outline" size={20} color={C.rose} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            <SwipeableSheet visible={modalOpen} onClose={() => setModalOpen(false)} fullHeight maxHeight="90%">
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ paddingHorizontal: 24, paddingBottom: 20, flex: 1 }}
                >
                    <Text style={s.sheetTitle}>{editing ? 'Editar Categoría' : 'Nueva Categoría'}</Text>
                    
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 20 }}>
                        <View style={{ gap: 8, marginTop: 10 }}>
                            <Text style={s.lbl}>Nombre de la Categoría</Text>
                            <TextInput 
                                style={s.inp} 
                                placeholder="Ej: Bebidas, Snacks..." 
                                placeholderTextColor={C.textMut}
                                value={form.name}
                                onChangeText={t => setForm(f => ({ ...f, name: t }))}
                            />
                        </View>

                        <View style={s.rowBetween}>
                            <Text style={s.lbl}>Estado: {form.active ? 'Activo' : 'Inactivo'}</Text>
                            <Switch 
                                value={form.active} 
                                onValueChange={v => setForm(f => ({ ...f, active: v }))}
                                trackColor={{ false: C.cardHi, true: C.purple }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={{ gap: 12 }}>
                            <Text style={s.lbl}>Selecciona un Icono</Text>
                            <View style={s.iconGrid}>
                                {PREDEFINED_ICONS.map(icon => {
                                    const isSelected = form.icon === icon;
                                    return (
                                        <TouchableOpacity 
                                            key={icon} 
                                            style={[s.iconOption, isSelected && s.iconOptionActive]}
                                            onPress={() => setForm(f => ({ ...f, icon }))}
                                        >
                                            <MaterialIcons name={icon as any} size={24} color={isSelected ? C.purple : C.textSec} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <TouchableOpacity style={s.saveBtn} onPress={save}>
                            <LinearGradient colors={[C.purple, C.purpleLight]} style={s.saveBtnGradient}>
                                <Text style={s.saveBtnText}>Guardar Categoría</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SwipeableSheet>

            {/* Premium Alert System */}
            <AppModal 
                {...alert} 
                onClose={hideAlert}
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'space-between' },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', flex: 1, marginLeft: 10 },
    addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: 20, gap: 12 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: C.border },
    iconCircle: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    cardInfo: { flex: 1, marginLeft: 16 },
    catName: { color: '#fff', fontSize: 16, fontWeight: '700' },
    status: { fontSize: 12, marginTop: 4, fontWeight: '600' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    delBtn: { padding: 8 },
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
    sheet: { backgroundColor: C.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, gap: 20 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 10 },
    sheetTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    lbl: { color: C.textSec, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    inp: { backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16, color: '#fff', fontSize: 16 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    iconOption: { width: 50, height: 50, borderRadius: 12, backgroundColor: C.cardHi, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    iconOptionActive: { borderColor: C.purple, backgroundColor: C.purpleDim },
    saveBtn: { marginTop: 10 },
    saveBtnGradient: { paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
