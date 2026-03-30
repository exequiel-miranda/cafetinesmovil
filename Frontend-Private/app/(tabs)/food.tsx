import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, StatusBar, Animated, Dimensions, ActivityIndicator, Image, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '@/contexts/DrawerContext';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/utils/api';
import { pickImageFromGallery, takePhoto, uploadImageToCloudinary } from '@/utils/cloudinary';
import { getMaterialIcon } from '@/utils/icons';

const { width } = Dimensions.get('window');

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

type MealType = 'breakfast' | 'lunch';
interface Category { _id: string; name: string; icon: string; }

interface Meal {
    _id: string;
    name: string;
    description: string;
    price: number;
    type: MealType;
    categoryId: Category;
    available: boolean;
    image: string;
    calories: string;
    popular: boolean;
    rating: number;
}

export default function FoodScreen() {
  const { openDrawer } = useDrawer();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<MealType>('lunch');
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [form, setForm] = useState({ name: '', price: '', type: 'lunch' as MealType, description: '', categoryId: '', image: '', calories: '', popular: false, rating: '0' });

  // Slider Animation
  const tabWidth = (width - 48) / 2; // Math for half the container minus horizontal padding
  const slideAnim = useRef(new Animated.Value(activeTab === 'lunch' ? tabWidth : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'lunch' ? tabWidth : 0,
      useNativeDriver: true,
      bounciness: 2,
      speed: 16,
    }).start();
  }, [activeTab]);

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      try {
          setLoading(true);
          const [cats, allProds] = await Promise.all([
              apiGet('/categories'),
              apiGet('/products') // Fetch all and filter client, or you could do 2 calls for lunch & breakfast context
          ]);
          setCategories(cats);
          setMeals(allProds.filter((m: Meal) => m.type === 'lunch' || m.type === 'breakfast'));
      } catch (error: any) {
          Alert.alert('Error de API', error.message || 'No se pudo conectar al servidor.');
      } finally {
          setLoading(false);
      }
  };

  const list = meals.filter(m => m.type === activeTab);

  const openAdd = () => { 
      setEditing(null); 
      setForm({ name: '', price: '', type: activeTab, description: '', categoryId: categories[0]?._id || '', image: '', calories: '', popular: false, rating: '0' }); 
      setModalOpen(true); 
  };
  
  const openEdit = (m: Meal) => { 
      setEditing(m); 
      setForm({ 
          name: m.name, 
          price: String(m.price), 
          type: m.type, 
          description: m.description, 
          categoryId: m.categoryId?._id || '', 
          image: m.image || '', 
          calories: m.calories || '', 
          popular: m.popular || false,
          rating: String(m.rating || 0)
      }); 
      setModalOpen(true); 
  };

  const handlePickImage = async () => {
    Alert.alert(
      'Seleccionar Imagen',
      '¿De dónde quieres obtener la imagen?',
      [
        {
          text: 'Cámara',
          onPress: async () => {
            try {
              const uri = await takePhoto();
              if (uri) setForm(f => ({ ...f, image: uri }));
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }
        },
        {
          text: 'Galería',
          onPress: async () => {
            try {
              const uri = await pickImageFromGallery();
              if (uri) setForm(f => ({ ...f, image: uri }));
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const save = async () => {
    if (!form.name.trim() || !form.price || !form.description.trim() || !form.categoryId) { 
        Alert.alert('Incompleto', 'Completa todos los campos, incluyendo categoría.'); return; 
    }
    const priceNum = Number(form.price);
    if (priceNum <= 0) { Alert.alert('Precio inválido', 'El precio debe ser mayor a 0.'); return; }
    
    try {
        setUploadingImage(true);
        let imageUrl = form.image;
        if (imageUrl && imageUrl.startsWith('file://')) {
            imageUrl = await uploadImageToCloudinary(imageUrl);
        }

        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            price: priceNum,
            type: form.type,
            categoryId: form.categoryId,
            image: imageUrl,
            calories: form.calories.trim(),
            popular: form.popular,
            rating: Number(form.rating) || 0
        };

        if (editing) {
            await apiPatch(`/products/${editing._id}`, payload);
        } else {
            await apiPost('/products', payload);
        }
        setModalOpen(false);
        loadData();
    } catch (error: any) {
        Alert.alert('Error', error.message || 'No se pudo guardar el menú');
    } finally {
        setUploadingImage(false);
    }
  };

  const toggle = async (id: string, currentVal: boolean) => {
      try {
          await apiPatch(`/products/${id}`, { available: !currentVal });
          setMeals(prev => prev.map(m => m._id === id ? { ...m, available: !currentVal } : m));
      } catch (error: any) {
          Alert.alert('Error', error.message || 'No se pudo actualizar disponibilidad');
      }
  };

  const del = (id: string) => Alert.alert('Eliminar', '¿Eliminar este menú?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
            await apiDelete(`/products/${id}`);
            setMeals(prev => prev.filter(m => m._id !== id));
        } catch (e: any) {
            Alert.alert('Error', 'No se pudo eliminar: ' + e.message);
        }
    }},
  ]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.wrap}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.menuBtn} onPress={openDrawer}>
             <View style={s.menuLine} />
             <View style={[s.menuLine, { width: 14 }]} />
             <View style={s.menuLine} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Comedor VIP</Text>
          <TouchableOpacity onPress={openAdd} activeOpacity={0.8}>
            <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.addBtn}>
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={s.addTxt}>Crear</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── SLIDER TAB SELECTOR ── */}
        <View style={s.tabContainer}>
          <Animated.View style={[s.activeTabBg, { width: tabWidth, transform: [{ translateX: slideAnim }] }]} />
          
          <TouchableOpacity style={s.tabTrigger} onPress={() => setActiveTab('breakfast')} activeOpacity={0.8}>
            <MaterialIcons name={getMaterialIcon('coffee')} size={16} color={activeTab === 'breakfast' ? '#fff' : C.textSec} style={{marginRight: 6}} />
            <Text style={[s.tabText, activeTab === 'breakfast' && s.tabTextActive]}>Desayunos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.tabTrigger} onPress={() => setActiveTab('lunch')} activeOpacity={0.8}>
            <MaterialIcons name="restaurant" size={16} color={activeTab === 'lunch' ? '#fff' : C.textSec} style={{marginRight: 6}} />
            <Text style={[s.tabText, activeTab === 'lunch' && s.tabTextActive]}>Almuerzos</Text>
          </TouchableOpacity>
        </View>

        {/* ── LISTA DE MENÚ ── */}
        {loading ? (
             <View style={s.empty}><ActivityIndicator color={C.purple} size="large" /></View>
        ) : (
        <ScrollView style={s.list} contentContainerStyle={s.listInner} showsVerticalScrollIndicator={false}>
          {list.length === 0 ? (
            <View style={s.empty}>
              <MaterialIcons name="no-meals" size={44} color={C.textMut} />
              <Text style={s.emptyT}>No hay menús registrados</Text>
            </View>
          ) : list.map(m => (
            <TouchableOpacity key={m._id} style={[s.row, !m.available && { opacity: 0.5 }]} onPress={() => openEdit(m)} activeOpacity={0.7}>
              <View style={[s.rowIcon, { backgroundColor: activeTab === 'breakfast' ? C.amberDim : C.purpleDim, overflow: 'hidden' }]}>
                {m.image ? (
                    <Image source={{ uri: m.image }} style={{ width: '100%', height: '100%' }} />
                ) : (
                    <MaterialIcons name={getMaterialIcon(m.categoryId?.icon)} size={24} color={activeTab === 'breakfast' ? C.amber : C.purple} />
                )}
              </View>
              <View style={s.rowInfo}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Text style={s.rowName}>{m.name}</Text>
                    {m.popular && (
                      <View style={{backgroundColor: activeTab === 'breakfast' ? C.amberDim : C.purpleDim, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>
                        <Text style={{color: activeTab === 'breakfast' ? C.amber : C.purple, fontSize: 10, fontWeight: '800'}}>POPULAR</Text>
                      </View>
                    )}
                </View>
                <Text style={s.rowDesc} numberOfLines={1}>{m.description}</Text>
                <Text style={s.rowSub}>{!m.available ? 'Pausado (Agotado)' : m.categoryId?.name}</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={[s.rowPrice, { color: activeTab === 'breakfast' ? C.amber : C.purple }]}>${m.price.toLocaleString()}</Text>
                <View style={s.rowActions}>
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: m.available ? C.tealDim : C.roseDim }]} onPress={() => toggle(m._id, m.available)}>
                    <MaterialIcons name={m.available ? 'visibility' : 'visibility-off'} size={16} color={m.available ? C.teal : C.rose} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: C.roseDim }]} onPress={() => del(m._id)}>
                    <MaterialIcons name="delete-outline" size={16} color={C.rose} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        )}
      </View>

      {/* ── MODAL NUEVO / EDITAR ── */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={s.overlay}>
          <TouchableOpacity style={s.overlayBg} onPress={() => setModalOpen(false)} />
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{editing ? 'Editar Menú' : `Nuevo ${activeTab === 'breakfast' ? 'Desayuno' : 'Almuerzo'}`}</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
                {/* Image Picker */}
                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    <TouchableOpacity style={s.imgPicker} onPress={handlePickImage} activeOpacity={0.8}>
                        {form.image ? (
                            <Image source={{ uri: form.image }} style={s.imgPreview} />
                        ) : (
                            <View style={s.imgPlaceholder}>
                                <MaterialIcons name="add-a-photo" size={28} color={C.textSec} />
                                <Text style={{color: C.textSec, fontSize: 12, marginTop: 4}}>Subir Foto</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={s.lbl}>Nombre del plato</Text>
                <TextInput style={s.inp} placeholder="Ej: Pollo al jugo..." placeholderTextColor={C.textMut} value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))} />

                <Text style={s.lbl}>Descripción (Ingredientes)</Text>
                <TextInput style={[s.inp, { height: 70, textAlignVertical: 'top' }]} multiline placeholder="Describe detalladamente..." placeholderTextColor={C.textMut} value={form.description} onChangeText={t => setForm(f => ({ ...f, description: t }))} />

                <View style={s.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.lbl}>Precio Final ($)</Text>
                    <TextInput style={s.inp} placeholder="3500" placeholderTextColor={C.textMut} keyboardType="numeric" value={form.price} onChangeText={t => setForm(f => ({ ...f, price: t }))} />
                  </View>
                </View>

                <View style={s.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.lbl}>Calorías</Text>
                    <TextInput style={s.inp} placeholder="Ej: 500 kcal" placeholderTextColor={C.textMut} value={form.calories} onChangeText={t => setForm(f => ({ ...f, calories: t }))} />
                  </View>
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}>
                    <Text style={[s.lbl, {marginBottom: 8}]}>¿ES POPULAR?</Text>
                    <Switch
                        value={form.popular}
                        onValueChange={(v) => setForm(f => ({...f, popular: v}))}
                        trackColor={{ false: C.cardHi, true: activeTab === 'breakfast' ? C.amber : C.purple }}
                        thumbColor={'#fff'}
                    />
                  </View>
                </View>

                <View style={s.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.lbl}>Rating (0-5)</Text>
                    <TextInput style={s.inp} placeholder="0" placeholderTextColor={C.textMut} keyboardType="numeric" value={form.rating} onChangeText={t => setForm(f => ({ ...f, rating: t }))} />
                  </View>
                  <View style={{ flex: 1 }} />
                </View>

                <Text style={s.lbl}>Categoría en Base de Datos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.catRow}>
                    {categories.length === 0 && <Text style={{color: C.rose}}>Debes crear Categorías en tu Backend primero.</Text>}
                    {categories.map(cat => {
                        const on = form.categoryId === cat._id;
                        return (
                        <TouchableOpacity key={cat._id} style={[s.catChip, on && { backgroundColor: activeTab === 'breakfast' ? C.amberDim : C.purpleDim, borderColor: activeTab === 'breakfast' ? C.amber : C.purple }]} onPress={() => setForm(f => ({ ...f, categoryId: cat._id }))}>
                            <MaterialIcons name={getMaterialIcon(cat.icon)} size={16} color={on ? (activeTab === 'breakfast' ? C.amber : C.purple) : C.textMut} />
                            <Text style={[s.catChipTxt, on && { color: activeTab === 'breakfast' ? C.amber : C.purple }]}>{cat.name}</Text>
                        </TouchableOpacity>
                        );
                    })}
                  </View>
                </ScrollView>
            </ScrollView>

            <View style={s.sheetActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalOpen(false)} disabled={uploadingImage}>
                <Text style={s.cancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} style={{ flex: 2 }} activeOpacity={0.85} disabled={uploadingImage}>
                <LinearGradient colors={activeTab === 'breakfast' ? [C.amber, '#FFC266'] : [C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtn}>
                  {uploadingImage ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="check" size={16} color="#fff" />}
                  <Text style={s.saveTxt}>{uploadingImage ? 'Subiendo y Guardando...' : 'Guardar Menú'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  wrap: { flex: 1 },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.textPri, letterSpacing: 0.5 },
  menuBtn: { gap: 4 },
  menuLine: { width: 22, height: 2, backgroundColor: C.textPri, borderRadius: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: C.card,
    marginHorizontal: 24,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: C.border,
    position: 'relative',
    marginBottom: 8,
  },
  activeTabBg: {
    position: 'absolute',
    height: '100%',
    top: 4, // Respect padding of parent
    left: 4,
    backgroundColor: C.cardHi,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabTrigger: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    zIndex: 2, // Keep text over the animated background
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textSec,
  },
  tabTextActive: {
    color: '#fff',
  },

  list: { flex: 1 },
  listInner: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 28, gap: 12 },
  
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: C.border },
  rowIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '700', color: C.textPri },
  rowDesc: { fontSize: 12, color: C.textSec, marginTop: 4, paddingRight: 8 },
  rowSub: { fontSize: 11, color: C.textMut, marginTop: 4, fontWeight: '600' },
  rowRight: { alignItems: 'flex-end', gap: 10 },
  rowPrice: { fontSize: 16, fontWeight: '800' },
  rowActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8, borderRadius: 10 },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyT: { fontSize: 16, color: C.textSec, fontWeight: '500' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 44, gap: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: C.textPri },
  lbl: { fontSize: 12, color: C.textMut, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  inp: { backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, color: C.textPri, fontSize: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  catRow: { flexDirection: 'row', gap: 8 },
  catChip: { paddingHorizontal:14, paddingVertical: 11, borderRadius: 14, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 5 },
  catChipTxt: { fontSize: 12, color: C.textMut, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontWeight: '700', fontSize: 15 },
  saveBtn: { paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },

  imgPicker: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  imgPreview: { width: '100%', height: '100%' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
});
