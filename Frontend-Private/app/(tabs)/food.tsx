import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, StatusBar, Animated, Dimensions, ActivityIndicator, Image, Switch, Platform
} from 'react-native';
import { AppModal, AppModalAction } from '@/components/ui/AppModal';
import { SwipeableSheet } from '@/components/ui/SwipeableSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '@/contexts/DrawerContext';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/utils/api';
import { pickImageFromGallery, takePhoto, uploadImageToCloudinary } from '@/utils/cloudinary';
import { getMaterialIcon } from '@/utils/icons';

const { width } = Dimensions.get('window');

const C = {
  bg: '#0E0B24',
  card: '#1A1640',
  cardHi: '#231F52',
  border: '#2E2A62',
  purple: '#7B5CF5',
  purpleLight: '#9B7BFF',
  purpleDim: 'rgba(123,92,245,0.18)',
  teal: '#00D2A3',
  tealDim: 'rgba(0,210,163,0.15)',
  amber: '#FFB038',
  amberDim: 'rgba(255,176,56,0.15)',
  rose: '#FF6B8A',
  roseDim: 'rgba(255,107,138,0.15)',
  textPri: '#FFFFFF',
  textSec: '#9B96C8',
  textMut: '#4A4580',
};

type MealType = 'breakfast' | 'lunch';
interface Category { _id: string; name: string; icon: string; active: boolean; }

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
  const [form, setForm] = useState({ name: '', price: '', type: 'lunch' as MealType, description: '', image: '', popular: false });
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [selectedMealForOptions, setSelectedMealForOptions] = useState<Meal | null>(null);

  // New Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedMealForPreview, setSelectedMealForPreview] = useState<Meal | null>(null);

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
      showAlert({
        title: 'Error de Datos',
        message: 'No pudimos cargar los menús. ' + (error.message || ''),
        type: 'error',
        actions: [{ label: 'Reintentar', onPress: () => { hideAlert(); loadData(); } }]
      });
    } finally {
      setLoading(false);
    }
  };

  const list = meals.filter(m => m.type === activeTab);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', price: '', type: activeTab, description: '', image: '', popular: false });
    setModalOpen(true);
  };

  const openEdit = (m: Meal) => {
    setEditing(m);
    setForm({
      name: m.name,
      price: String(m.price),
      type: m.type,
      description: m.description,
      image: m.image || '',
      popular: m.popular || false
    });
    setModalOpen(true);
  };

  const handlePickImage = async () => {
    showAlert({
      title: 'Imagen del Plato',
      message: '¿De dónde quieres obtener la foto para este menú?',
      type: 'info',
      icon: 'add-a-photo',
      actions: [
        { 
          label: 'Cámara', 
          onPress: async () => {
            hideAlert();
            try {
              const uri = await takePhoto();
              if (uri) setForm(f => ({ ...f, image: uri }));
            } catch (e: any) {
              showAlert({ title: 'Error', message: e.message, type: 'error', actions: [{label: 'Cerrar', onPress: hideAlert}] });
            }
          }
        },
        { 
          label: 'Galería', 
          onPress: async () => {
            hideAlert();
            try {
              const uri = await pickImageFromGallery();
              if (uri) setForm(f => ({ ...f, image: uri }));
            } catch (e: any) {
              showAlert({ title: 'Error', message: e.message, type: 'error', actions: [{label: 'Cerrar', onPress: hideAlert}] });
            }
          }
        },
        { label: 'Cancelar', type: 'secondary', onPress: hideAlert }
      ]
    });
  };

  const save = async () => {
    if (!form.name.trim() || !form.price || !form.description.trim()) {
      showAlert({
        title: 'Datos Incompletos',
        message: 'Por favor completa todos los campos del plato.',
        type: 'confirm',
        actions: [{ label: 'Revisar', onPress: hideAlert }]
      });
      return;
    }
    const priceNum = Number(form.price);
    if (priceNum <= 0) { 
      showAlert({
        title: 'Precio Inválido',
        message: 'El precio debe ser un número mayor a cero.',
        type: 'confirm',
        actions: [{ label: 'Corregir', onPress: hideAlert }]
      });
      return; 
    }

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
        image: imageUrl,
        popular: form.popular,
      };

      if (editing) {
        await apiPatch(`/products/${editing._id}`, payload);
      } else {
        await apiPost('/products', payload);
      }
      setModalOpen(false);
      loadData();
    } catch (error: any) {
      showAlert({
        title: 'Error al Guardar',
        message: error.message || 'No se pudo actualizar el menú en el servidor.',
        type: 'error',
        actions: [{ label: 'Cerrar', onPress: hideAlert }]
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const toggle = async (id: string, currentVal: boolean) => {
    try {
      await apiPatch(`/products/${id}`, { available: !currentVal });
      setMeals(prev => prev.map(m => m._id === id ? { ...m, available: !currentVal } : m));
    } catch (error: any) {
      showAlert({
        title: 'Estado',
        message: 'No se pudo cambiar la disponibilidad del plato.',
        type: 'error',
        actions: [{ label: 'OK', onPress: hideAlert }]
      });
    }
  };

  const del = (id: string) => showAlert({
    title: 'Eliminar Menú',
    message: '¿Estás seguro de borrar este plato definitivamente?',
    type: 'error',
    icon: 'delete-forever',
    actions: [
      { label: 'Cancelar', type: 'secondary', onPress: hideAlert },
      { 
        label: 'Eliminar Plato', 
        type: 'danger', 
        onPress: async () => {
          try {
            await apiDelete(`/products/${id}`);
            setMeals(prev => prev.filter(m => m._id !== id));
            setPreviewModalOpen(false);
            hideAlert();
          } catch (e: any) {
            showAlert({ title: 'Error', message: 'No se pudo eliminar: ' + e.message, type: 'error', actions: [{label: 'Cerrar', onPress: hideAlert}] });
          }
        }
      }
    ]
  });

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
            <MaterialIcons name={getMaterialIcon('coffee')} size={16} color={activeTab === 'breakfast' ? '#fff' : C.textSec} style={{ marginRight: 6 }} />
            <Text style={[s.tabText, activeTab === 'breakfast' && s.tabTextActive]}>Desayunos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.tabTrigger} onPress={() => setActiveTab('lunch')} activeOpacity={0.8}>
            <MaterialIcons name="restaurant" size={16} color={activeTab === 'lunch' ? '#fff' : C.textSec} style={{ marginRight: 6 }} />
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
              <TouchableOpacity 
                key={m._id} 
                style={[s.row, !m.available && { opacity: 0.8 }]} 
                onPress={() => {
                  setSelectedMealForPreview(m);
                  setPreviewModalOpen(true);
                }} 
                activeOpacity={0.7}
              >
                <View style={[s.rowIcon, { backgroundColor: activeTab === 'breakfast' ? C.amberDim : C.purpleDim, overflow: 'hidden' }]}>
                  {m.image ? (
                    <Image source={{ uri: m.image }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <MaterialIcons 
                      name={m.categoryId?.icon ? getMaterialIcon(m.categoryId.icon) : (m.type === 'breakfast' ? 'coffee' : 'restaurant')} 
                      size={24} 
                      color={activeTab === 'breakfast' ? C.amber : C.purple} 
                    />
                  )}
                </View>
                <View style={s.rowInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[s.rowName, { flexShrink: 1 }]} numberOfLines={1}>{m.name}</Text>
                    {m.popular && (
                      <View style={{ backgroundColor: activeTab === 'breakfast' ? C.amberDim : C.purpleDim, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: activeTab === 'breakfast' ? C.amber : C.purple, fontSize: 10, fontWeight: '800' }}>POPULAR</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.rowDesc} numberOfLines={1}>{m.description}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <Text style={s.rowSub}>{m.categoryId?.name || (m.type === 'breakfast' ? 'Desayuno' : 'Almuerzo')}</Text>
                    <View style={{ 
                      backgroundColor: m.available ? 'rgba(0,210,163,0.08)' : 'rgba(255,107,138,0.08)', 
                      paddingHorizontal: 8, 
                      paddingVertical: 2, 
                      borderRadius: 6, 
                      borderWidth: 0.5, 
                      borderColor: m.available ? 'rgba(0,210,163,0.3)' : 'rgba(255,107,138,0.3)' 
                    }}>
                      <Text style={{ 
                        color: m.available ? C.teal : C.rose, 
                        fontSize: 9, 
                        fontWeight: '800', 
                        letterSpacing: 0.5 
                      }}>
                        {m.available ? '• ACTIVO' : '• OCULTO'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={s.rowRight}>
                  <Text style={[s.rowPrice, { color: activeTab === 'breakfast' ? C.amber : C.purple }]}>${m.price.toLocaleString()}</Text>
                  <View style={s.rowActions}>
                    <TouchableOpacity 
                        style={s.moreBtn} 
                        onPress={() => {
                            setSelectedMealForOptions(m);
                            setOptionsModalOpen(true);
                        }}
                    >
                      <MaterialIcons name="more-horiz" size={22} color={C.textSec} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── MODAL NUEVO / EDITAR ── */}
      <SwipeableSheet visible={modalOpen} onClose={() => setModalOpen(false)} fullHeight maxHeight="90%">
            <View style={{ paddingHorizontal: 24, paddingBottom: 20, flex: 1 }}>
                <Text style={s.sheetTitle}>{editing ? 'Editar Menú' : `Nuevo ${activeTab === 'breakfast' ? 'Desayuno' : 'Almuerzo'}`}</Text>

                <ScrollView 
                  style={{ flex: 1 }}
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ gap: 14, paddingBottom: 20 }}
                >
                  {/* Image Picker */}
                  <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    <TouchableOpacity style={s.imgPicker} onPress={handlePickImage} activeOpacity={0.8}>
                      {form.image ? (
                        <Image source={{ uri: form.image }} style={s.imgPreview} />
                      ) : (
                        <View style={s.imgPlaceholder}>
                          <MaterialIcons name="add-a-photo" size={28} color={C.textSec} />
                          <Text style={{ color: C.textSec, fontSize: 12, marginTop: 4 }}>Subir Foto</Text>
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

                  <Text style={s.lbl}>Clasificación del Plato</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                      onPress={() => setForm(f => ({ ...f, type: 'breakfast' }))} 
                      style={[s.catChip, form.type === 'breakfast' && { backgroundColor: C.amberDim, borderColor: C.amber }]}
                    >
                      <MaterialIcons name="coffee" size={16} color={form.type === 'breakfast' ? C.amber : C.textMut} />
                      <Text style={[s.catChipTxt, form.type === 'breakfast' && { color: C.amber }]}>DESAYUNO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setForm(f => ({ ...f, type: 'lunch' }))} 
                      style={[s.catChip, form.type === 'lunch' && { backgroundColor: C.purpleDim, borderColor: C.purple }]}
                    >
                      <MaterialIcons name="restaurant" size={16} color={form.type === 'lunch' ? C.purple : C.textMut} />
                      <Text style={[s.catChipTxt, form.type === 'lunch' && { color: C.purple }]}>ALMUERZO</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[s.formRow, { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 }]}>
                    <Text style={s.lbl}>¿ES POPULAR?</Text>
                    <Switch
                      value={form.popular}
                      onValueChange={(v) => setForm(f => ({ ...f, popular: v }))}
                      trackColor={{ false: C.cardHi, true: form.type === 'breakfast' ? C.amber : C.purple }}
                      thumbColor={'#fff'}
                    />
                  </View>
                </ScrollView>

                <View style={[s.sheetActions, { paddingBottom: Platform.OS === 'ios' ? 20 : 10 }]}>
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
      </SwipeableSheet>

      {/* ── MODAL DE OPCIONES (TRES PUNTOS) ── */}
      <SwipeableSheet visible={optionsModalOpen} onClose={() => setOptionsModalOpen(false)}>
            <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
                <Text style={s.optionsTitle}>{selectedMealForOptions?.name}</Text>
                
                <View style={[s.optionsGrid, { marginTop: 10 }]}>
                  <TouchableOpacity style={s.optionItem} onPress={() => {
                      setOptionsModalOpen(false);
                      if (selectedMealForOptions) openEdit(selectedMealForOptions);
                  }}>
                    <View style={[s.optionIcon, { backgroundColor: C.purpleDim }]}>
                      <MaterialIcons name="edit" size={24} color={C.purple} />
                    </View>
                    <Text style={s.optionLabel}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={s.optionItem} onPress={() => {
                      setOptionsModalOpen(false);
                      if (selectedMealForOptions) toggle(selectedMealForOptions._id, selectedMealForOptions.available);
                  }}>
                    <View style={[s.optionIcon, { backgroundColor: selectedMealForOptions?.available ? C.roseDim : C.tealDim }]}>
                      <MaterialIcons name={selectedMealForOptions?.available ? 'visibility-off' : 'visibility'} size={24} color={selectedMealForOptions?.available ? C.rose : C.teal} />
                    </View>
                    <Text style={s.optionLabel}>{selectedMealForOptions?.available ? 'Ocultar' : 'Reactivar'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={s.optionItem} onPress={() => {
                      setOptionsModalOpen(false);
                      if (selectedMealForOptions) del(selectedMealForOptions._id);
                  }}>
                    <View style={[s.optionIcon, { backgroundColor: C.roseDim }]}>
                      <MaterialIcons name="delete-outline" size={24} color={C.rose} />
                    </View>
                    <Text style={[s.optionLabel, { color: C.rose }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
            </View>
      </SwipeableSheet>

      {/* ── MODAL DE VISTA PREVIA (FICHA) ── */}
      <SwipeableSheet 
        visible={previewModalOpen} 
        onClose={() => setPreviewModalOpen(false)}
        maxHeight="90%"
        fullHeight
        backgroundColor={C.card}
      >
            <View style={s.previewImgWrap}>
              {selectedMealForPreview?.image ? (
                <Image source={{ uri: selectedMealForPreview.image }} style={s.previewImg} resizeMode="cover" />
              ) : (
                <View style={[s.previewImgPlaceholder, { backgroundColor: selectedMealForPreview?.type === 'breakfast' ? C.amberDim : C.purpleDim }]}>
                  <MaterialIcons name={selectedMealForPreview?.type === 'breakfast' ? 'coffee' : 'restaurant'} size={80} color={selectedMealForPreview?.type === 'breakfast' ? C.amber : C.purple} />
                </View>
              )}
              <LinearGradient colors={['transparent', 'rgba(14,11,36,0.9)']} style={s.previewImgOverlay} />
              <TouchableOpacity style={s.closePreviewBtn} onPress={() => setPreviewModalOpen(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={s.previewBody}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={s.previewHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.previewName}>{selectedMealForPreview?.name}</Text>
                    <Text style={s.previewType}>{selectedMealForPreview?.type === 'breakfast' ? 'Desayuno VIP' : 'Almuerzo Ejecutivo'}</Text>
                  </View>
                  <Text style={[s.previewPrice, { color: selectedMealForPreview?.type === 'breakfast' ? C.amber : C.purple }]}>${selectedMealForPreview?.price.toLocaleString()}</Text>
                </View>

                <View style={s.previewStatusRow}>
                  <View style={[s.statusPill, { backgroundColor: selectedMealForPreview?.available ? 'rgba(0,210,163,0.1)' : 'rgba(255,107,138,0.1)', borderColor: selectedMealForPreview?.available ? C.teal : C.rose }]}>
                    <View style={[s.statusDot, { backgroundColor: selectedMealForPreview?.available ? C.teal : C.rose }]} />
                    <Text style={[s.statusPillTxt, { color: selectedMealForPreview?.available ? C.teal : C.rose }]}>
                      {selectedMealForPreview?.available ? 'DISPONIBLE' : 'AGOTADO / OCULTO'}
                    </Text>
                  </View>
                  {selectedMealForPreview?.popular && (
                    <View style={[s.statusPill, { backgroundColor: C.amberDim, borderColor: C.amber }]}>
                      <MaterialIcons name="star" size={12} color={C.amber} />
                      <Text style={[s.statusPillTxt, { color: C.amber }]}>POPULAR</Text>
                    </View>
                  )}
                </View>

                <Text style={s.previewLabel}>Descripción e Ingredientes</Text>
                <Text style={[s.previewContent, { marginBottom: 24 }]}>{selectedMealForPreview?.description || 'Sin descripción detallada.'}</Text>

                <View style={s.previewActions}>
                  <TouchableOpacity 
                    style={s.editProductBtn} 
                    onPress={() => {
                      setPreviewModalOpen(false);
                      if (selectedMealForPreview) openEdit(selectedMealForPreview);
                    }}
                  >
                    <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.editProductGradient}>
                      <MaterialIcons name="edit" size={20} color="#fff" />
                      <Text style={s.editProductTxt}>Editar Plato</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
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
  catChip: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 5 },
  catChipTxt: { fontSize: 12, color: C.textMut, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontWeight: '700', fontSize: 15 },
  saveBtn: { paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  moreBtn: { padding: 4, marginLeft: 4 },
  optionsSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 20 },
  optionsTitle: { color: C.textPri, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  optionsGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  optionItem: { alignItems: 'center', gap: 8 },
  optionIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { color: C.textPri, fontSize: 13, fontWeight: '600' },

  previewImgWrap: { width: '100%', height: 300, position: 'relative' },
  previewImg: { width: '100%', height: '100%' },
  previewImgPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  previewImgOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  closePreviewBtn: { position: 'absolute', top: 20, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  previewBody: { flex: 1, padding: 24, marginTop: -20, backgroundColor: C.card, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  previewName: { fontSize: 24, fontWeight: '800', color: C.textPri, flex: 1, marginRight: 8 },
  previewPrice: { fontSize: 24, fontWeight: '800' },
  previewType: { fontSize: 14, color: C.textSec, marginTop: 4, fontWeight: '600' },
  previewStatusRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  previewLabel: { fontSize: 13, color: C.textMut, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  previewContent: { fontSize: 16, color: C.textSec, lineHeight: 24 },
  previewActions: { marginTop: 24 },
  editProductBtn: { borderRadius: 18, overflow: 'hidden' },
  editProductGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  editProductTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  imgPicker: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  imgPreview: { width: '100%', height: '100%' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
});
