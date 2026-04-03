import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, StatusBar, ActivityIndicator, Image, Switch,
  TouchableWithoutFeedback, Platform
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

interface Category { _id: string; name: string; icon: string; active: boolean; }
type ProductType = 'snack' | 'combo' | 'lunch' | 'breakfast';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  type: ProductType;
  categoryId: Category;
  available: boolean;
  image: string;
  popular: boolean;
  comboItems: {name: string, icon: string}[];
}

export default function ProductsScreen() {
  const { openDrawer } = useDrawer();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [filter, setFilter] = useState<string>('Todos'); // 'Todos' or Category _id
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ 
      name: '', description: '', price: '', type: 'snack' as ProductType, categoryId: '',
      image: '', popular: false, comboItems: [] as string[]
  });
  const [comboSearch, setComboSearch] = useState('');
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [selectedProductForOptions, setSelectedProductForOptions] = useState<Product | null>(null);

  // New Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedProductForPreview, setSelectedProductForPreview] = useState<Product | null>(null);

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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, allProds] = await Promise.all([
        apiGet('/categories'),
        apiGet('/products')
      ]);
      setCategories(cats);
      // Solo tomamos snacks y combos para esta pantalla
      setProducts(allProds.filter((p: Product) => p.type === 'snack' || p.type === 'combo'));
    } catch (error: any) {
      showAlert({
        title: 'Error de Datos',
        message: 'No pudimos conectar con la base de datos. ' + (error.message || ''),
        type: 'error',
        actions: [{ label: 'Reintentar', onPress: () => { hideAlert(); loadData(); } }]
      });
    } finally {
      setLoading(false);
    }
  };

  const list = filter === 'Todos' ? products : products.filter(p => p.categoryId?._id === filter);

  const openAdd = () => { 
    setEditing(null); 
    setForm({ name: '', description: '', price: '', type: 'snack', categoryId: categories[0]?._id || '', image: '', popular: false, comboItems: [] }); 
    setModalOpen(true); 
  };
  
  const openEdit = (p: Product) => { 
    setEditing(p); 
    setForm({ 
        name: p.name, 
        description: p.description, 
        price: String(p.price), 
        type: p.type, 
        categoryId: p.categoryId?._id || '', 
        image: p.image || '', 
        popular: p.popular || false, 
        comboItems: p.comboItems ? p.comboItems.map(c => c.name) : []
    }); 
    setModalOpen(true); 
  };

  const handlePickImage = async () => {
    showAlert({
      title: 'Imagen del Snack',
      message: '¿De dónde quieres obtener la foto del producto?',
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
    if (!form.name.trim() || !form.price || !form.categoryId) { 
        showAlert({
            title: 'Datos Incompletos',
            message: 'Asegúrate de poner un nombre, precio y categoría.',
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

      const comboItemsArray = form.type === 'combo' ? 
          form.comboItems.map(name => ({ name, icon: 'fastfood' })) : [];

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || 'Sin descripción',
        price: priceNum,
        type: form.type,
        categoryId: form.categoryId,
        image: imageUrl,
        popular: form.popular,
        comboItems: comboItemsArray,
      };

      if (editing) {
        await apiPatch(`/products/${editing._id}`, payload);
      } else {
        await apiPost('/products', payload);
      }
      setModalOpen(false);
      loadData(); // Refrescar lista
    } catch (error: any) {
      showAlert({
        title: 'Error al Guardar',
        message: error.message || 'No se pudo procesar el snack en el servidor.',
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
      setProducts(prev => prev.map(p => p._id === id ? { ...p, available: !currentVal } : p));
    } catch (e: any) {
      showAlert({
        title: 'Estado',
        message: 'No se pudo actualizar la disponibilidad del producto.',
        type: 'error',
        actions: [{ label: 'OK', onPress: hideAlert }]
      });
    }
  };

  const del = (id: string) => showAlert({
    title: 'Eliminar Snack',
    message: '¿Estás seguro de que deseas borrar este producto? Esta acción no se puede deshacer.',
    type: 'error',
    icon: 'delete-sweep',
    actions: [
      { label: 'Cancelar', type: 'secondary', onPress: hideAlert },
      { 
        label: 'Eliminar Ahora', 
        type: 'danger', 
        onPress: async () => {
          try {
            await apiDelete(`/products/${id}`);
            setProducts(prev => prev.filter(p => p._id !== id));
            setPreviewModalOpen(false);
            hideAlert();
          } catch (e: any) {
            showAlert({ title: 'Error', message: 'No se pudo eliminar: ' + e.message, type: 'error', actions: [{label: 'Cerrar', onPress: hideAlert}] });
          }
        }
      },
    ]
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.wrap}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.menuBtn} onPress={openDrawer}>
             <View style={s.menuLine} />
             <View style={[s.menuLine, { width: 14 }]} />
             <View style={s.menuLine} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Snacks y Bebidas</Text>
          <TouchableOpacity onPress={openAdd} activeOpacity={0.8}>
            <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.addBtn}>
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={s.addTxt}>Nuevo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Summary chips */}
        <View style={s.summaryRow}>
          <View style={[s.summaryChip, { borderColor: C.teal + '55' }]}>
            <Text style={[s.summaryN, { color: C.teal }]}>{products.filter(p => p.available).length}</Text>
            <Text style={s.summaryL}>Activos</Text>
          </View>
          <View style={[s.summaryChip, { borderColor: C.rose + '55' }]}>
            <Text style={[s.summaryN, { color: C.rose }]}>{products.filter(p => !p.available).length}</Text>
            <Text style={s.summaryL}>Ocultos</Text>
          </View>
          <View style={[s.summaryChip, { borderColor: C.purple + '55' }]}>
            <Text style={[s.summaryN, { color: C.purple }]}>{products.length}</Text>
            <Text style={s.summaryL}>Total</Text>
          </View>
        </View>

        {/* Filter tabs — dynamic from API */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabsContent}>
          <TouchableOpacity onPress={() => setFilter('Todos')} activeOpacity={0.8}>
            {filter === 'Todos' ? (
              <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tabOn}>
                <Text style={s.tabOnTxt}>Todos</Text>
              </LinearGradient>
            ) : (
              <View style={s.tab}><Text style={s.tabTxt}>Todos</Text></View>
            )}
          </TouchableOpacity>

          {categories
            .filter(cat => cat.active !== false) // Handle undefined/default as active
            .map(cat => {
            const on = filter === cat._id;
            return (
              <TouchableOpacity key={cat._id} onPress={() => setFilter(cat._id)} activeOpacity={0.8}>
                {on ? (
                  <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tabOn}>
                    <Text style={s.tabOnTxt}>{cat.name}</Text>
                  </LinearGradient>
                ) : (
                  <View style={s.tab}>
                    <Text style={s.tabTxt}>{cat.name}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List */}
        {loading ? (
             <View style={s.empty}><ActivityIndicator color={C.purple} size="large" /></View>
        ) : (
        <ScrollView style={s.list} contentContainerStyle={s.listInner} showsVerticalScrollIndicator={false}>
          {list.length === 0 ? (
            <View style={s.empty}>
              <MaterialIcons name="inventory-2" size={44} color={C.textMut} />
              <Text style={s.emptyT}>Sin productos aquí</Text>
            </View>
          ) : list.map(p => {
            return (
              <TouchableOpacity 
                key={p._id} 
                style={[s.row, !p.available && { opacity: 0.8 }]} 
                onPress={() => {
                  setSelectedProductForPreview(p);
                  setPreviewModalOpen(true);
                }} 
                activeOpacity={0.7}
              >
                <View style={[s.rowIcon, { backgroundColor: C.purpleDim, overflow: 'hidden' }]}>
                  {p.image ? (
                    <Image source={{ uri: p.image }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <MaterialIcons name={getMaterialIcon(p.categoryId?.icon)} size={20} color={C.purple} />
                  )}
                </View>
                <View style={s.rowInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[s.rowName, { flexShrink: 1 }]} numberOfLines={1}>{p.name}</Text>
                    {p.popular && (
                      <View style={{ backgroundColor: C.amberDim, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: C.amber, fontSize: 10, fontWeight: '800' }}>POPULAR</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <Text style={s.rowSub}>{p.categoryId?.name || 'Snack'}</Text>
                    <View style={{ 
                      backgroundColor: p.available ? 'rgba(0,210,163,0.08)' : 'rgba(255,107,138,0.08)', 
                      paddingHorizontal: 8, 
                      paddingVertical: 2, 
                      borderRadius: 6, 
                      borderWidth: 0.5, 
                      borderColor: p.available ? 'rgba(0,210,163,0.3)' : 'rgba(255,107,138,0.3)' 
                    }}>
                      <Text style={{ 
                        color: p.available ? C.teal : C.rose, 
                        fontSize: 9, 
                        fontWeight: '800', 
                        letterSpacing: 0.5 
                      }}>
                        {p.available ? '• ACTIVO' : '• OCULTO'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={s.rowRight}>
                  <Text style={[s.rowPrice, { color: C.purple }]}>${p.price.toLocaleString()}</Text>
                  <View style={s.rowActions}>
                    <TouchableOpacity 
                        style={s.moreBtn} 
                        onPress={() => {
                            setSelectedProductForOptions(p);
                            setOptionsModalOpen(true);
                        }}
                    >
                      <MaterialIcons name="more-horiz" size={22} color={C.textSec} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        )}
      </View>

      {/* Modal */}
      <SwipeableSheet visible={modalOpen} onClose={() => setModalOpen(false)} fullHeight maxHeight="90%">
            <View style={{ paddingHorizontal: 24, flex: 1 }}>
                <Text style={s.sheetTitle}>{editing ? 'Editar Producto' : 'Nuevo Producto'}</Text>
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
                                    <Text style={{color: C.textSec, fontSize: 12, marginTop: 4}}>Subir Foto</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={s.formRow}>
                      <View style={{ flex: 2 }}>
                        <Text style={s.lbl}>Nombre</Text>
                        <TextInput style={s.inp} placeholder="Cereal Bar..." placeholderTextColor={C.textMut} value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.lbl}>Precio ($)</Text>
                        <TextInput style={s.inp} placeholder="900" placeholderTextColor={C.textMut} keyboardType="numeric" value={form.price} onChangeText={t => setForm(f => ({ ...f, price: t }))} />
                      </View>
                    </View>

                    <Text style={s.lbl}>Descripción (Opcional)</Text>
                    <TextInput style={[s.inp, {height: 60, textAlignVertical: 'top'}]} multiline placeholder="Ingredientes o detalles..." placeholderTextColor={C.textMut} value={form.description} onChangeText={t => setForm(f => ({ ...f, description: t }))} />

                    <View style={[s.formRow, {alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10}]}>
                        <Text style={s.lbl}>¿ES UN PRODUCTO POPULAR / DESTACADO?</Text>
                        <Switch
                            value={form.popular}
                            onValueChange={(v) => setForm(f => ({...f, popular: v}))}
                            trackColor={{ false: C.cardHi, true: C.purple }}
                            thumbColor={'#fff'}
                        />
                    </View>

                    <Text style={s.lbl}>Categoría</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={s.catRow}>
                        {categories.length === 0 && <Text style={{color: C.rose}}>Debes crear Categorías en tu Backend primero.</Text>}
                        {categories
                          .filter(cat => {
                            const n = cat.name.toLowerCase();
                            const isFood = n.includes('desayuno') || n.includes('almuerzo');
                            return cat.active !== false && !isFood;
                          })
                          .map(cat => {
                            const on = form.categoryId === cat._id;
                            return (
                            <TouchableOpacity key={cat._id} style={[s.catChip, on && { backgroundColor: C.purpleDim, borderColor: C.purple }]} onPress={() => setForm(f => ({ ...f, categoryId: cat._id }))}>
                                <MaterialIcons name={getMaterialIcon(cat.icon)} size={16} color={on ? C.purple : C.textMut} />
                                <Text style={[s.catChipTxt, on && { color: C.purple }]}>{cat.name}</Text>
                            </TouchableOpacity>
                            );
                        })}
                      </View>
                    </ScrollView>

                    <View style={[s.formRow, {alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5}]}>
                        <Text style={s.lbl}>¿ES UN COMBO CON OTROS PRODUCTOS?</Text>
                        <Switch
                            value={form.type === 'combo'}
                            onValueChange={(v) => setForm(f => ({...f, type: v ? 'combo' : 'snack'}))}
                            trackColor={{ false: C.cardHi, true: C.purple }}
                            thumbColor={'#fff'}
                        />
                    </View>

                    {form.type === 'combo' && (
                        <View style={{ gap: 12 }}>
                            <Text style={s.lbl}>Contenido del Combo</Text>
                            
                            {/* Selected snacks */}
                            {form.comboItems.length > 0 && (
                                <View style={{ gap: 6 }}>
                                    <Text style={{ color: C.textMut, fontSize: 10, fontWeight: '700' }}>SELECCIONADOS</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                        {form.comboItems.map(name => (
                                            <TouchableOpacity 
                                                key={name} 
                                                onPress={() => setForm(f => ({ ...f, comboItems: f.comboItems.filter(i => i !== name) }))}
                                                style={[s.catChip, { backgroundColor: C.purpleDim, borderColor: C.purple }]}
                                            >
                                                <MaterialIcons name="remove-circle-outline" size={14} color={C.purple} />
                                                <Text style={[s.catChipTxt, { color: C.purple }]}>{name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Search and Available */}
                            <View style={{ gap: 8 }}>
                                <View style={s.searchWrap}>
                                    <MaterialIcons name="search" size={18} color={C.textMut} />
                                    <TextInput 
                                        style={s.searchInp} 
                                        placeholder="Buscar snack..." 
                                        placeholderTextColor={C.textMut}
                                        value={comboSearch}
                                        onChangeText={setComboSearch}
                                    />
                                    {comboSearch.length > 0 && (
                                        <TouchableOpacity onPress={() => setComboSearch('')}>
                                            <MaterialIcons name="close" size={18} color={C.textMut} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={{ height: 180, borderRadius: 14, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
                                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                        {products
                                            .filter(p => p.type === 'snack' && p.name.toLowerCase().includes(comboSearch.toLowerCase()))
                                            .map(snack => {
                                                const isSelected = form.comboItems.includes(snack.name);
                                                return (
                                                    <TouchableOpacity 
                                                        key={snack._id} 
                                                        onPress={() => {
                                                            setForm(f => ({
                                                                ...f,
                                                                comboItems: isSelected 
                                                                    ? f.comboItems.filter(i => i !== snack.name)
                                                                    : [...f.comboItems, snack.name]
                                                            }));
                                                        }}
                                                        style={[s.compactRow, isSelected && { backgroundColor: C.purpleDim }]}
                                                    >
                                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>
                                                            <MaterialIcons name={isSelected ? "check-box" : "check-box-outline-blank"} size={20} color={isSelected ? C.purple : C.textMut} />
                                                            <Text style={{ color: isSelected ? C.textPri : C.textSec, fontSize: 14, fontWeight: isSelected ? '700' : '500' }}>{snack.name}</Text>
                                                        </View>
                                                        <Text style={{ color: C.textMut, fontSize: 12 }}>${snack.price}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                    </ScrollView>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View style={[s.sheetActions, { paddingBottom: Platform.OS === 'ios' ? 20 : 10 }]}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setModalOpen(false)} disabled={uploadingImage}>
                    <Text style={s.cancelTxt}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={save} style={{ flex: 2 }} activeOpacity={0.85} disabled={uploadingImage}>
                    <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtn}>
                      {uploadingImage ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="check" size={16} color="#fff" />}
                      <Text style={s.saveTxt}>{uploadingImage ? 'Subiendo y Guardando...' : 'Guardar Cambios'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
            </View>
      </SwipeableSheet>

      {/* ── MODAL DE OPCIONES (TRES PUNTOS) ── */}
      <SwipeableSheet visible={optionsModalOpen} onClose={() => setOptionsModalOpen(false)}>
            <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
                <Text style={s.optionsTitle}>{selectedProductForOptions?.name}</Text>
                
                <View style={[s.optionsGrid, { marginTop: 10 }]}>
                  <TouchableOpacity style={s.optionItem} onPress={() => {
                      setOptionsModalOpen(false);
                      if (selectedProductForOptions) openEdit(selectedProductForOptions);
                  }}>
                    <View style={[s.optionIcon, { backgroundColor: C.purpleDim }]}>
                      <MaterialIcons name="edit" size={24} color={C.purple} />
                    </View>
                    <Text style={s.optionLabel}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={s.optionItem} onPress={() => {
                      setOptionsModalOpen(false);
                      if (selectedProductForOptions) toggle(selectedProductForOptions._id, selectedProductForOptions.available);
                  }}>
                    <View style={[s.optionIcon, { backgroundColor: selectedProductForOptions?.available ? C.roseDim : C.tealDim }]}>
                      <MaterialIcons name={selectedProductForOptions?.available ? 'visibility-off' : 'visibility'} size={24} color={selectedProductForOptions?.available ? C.rose : C.teal} />
                    </View>
                    <Text style={s.optionLabel}>{selectedProductForOptions?.available ? 'Ocultar' : 'Reactivar'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={s.optionItem} onPress={() => {
                      setOptionsModalOpen(false);
                      if (selectedProductForOptions) del(selectedProductForOptions._id);
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
              {selectedProductForPreview?.image ? (
                <Image source={{ uri: selectedProductForPreview.image }} style={s.previewImg} resizeMode="cover" />
              ) : (
                <View style={[s.previewImgPlaceholder, { backgroundColor: C.purpleDim }]}>
                  <MaterialIcons name={getMaterialIcon(selectedProductForPreview?.categoryId?.icon || '')} size={80} color={C.purple} />
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
                    <Text style={s.previewName}>{selectedProductForPreview?.name}</Text>
                    <Text style={s.previewType}>{selectedProductForPreview?.type === 'combo' ? 'Combo Especial' : (selectedProductForPreview?.categoryId?.name || 'Snack')}</Text>
                  </View>
                  <Text style={[s.previewPrice, { color: C.purple }]}>${selectedProductForPreview?.price.toLocaleString()}</Text>
                </View>

                <View style={s.previewStatusRow}>
                  <View style={[s.statusPill, { backgroundColor: selectedProductForPreview?.available ? 'rgba(0,210,163,0.1)' : 'rgba(255,107,138,0.1)', borderColor: selectedProductForPreview?.available ? C.teal : C.rose }]}>
                    <View style={[s.statusDot, { backgroundColor: selectedProductForPreview?.available ? C.teal : C.rose }]} />
                    <Text style={[s.statusPillTxt, { color: selectedProductForPreview?.available ? C.teal : C.rose }]}>
                      {selectedProductForPreview?.available ? 'DISPONIBLE' : 'SIN STOCK / OCULTO'}
                    </Text>
                  </View>
                  {selectedProductForPreview?.popular && (
                    <View style={[s.statusPill, { backgroundColor: C.amberDim, borderColor: C.amber }]}>
                      <MaterialIcons name="star" size={12} color={C.amber} />
                      <Text style={[s.statusPillTxt, { color: C.amber }]}>POPULAR</Text>
                    </View>
                  )}
                </View>

                <Text style={s.previewLabel}>Descripción</Text>
                <Text style={[s.previewContent, { marginBottom: 24 }]}>{selectedProductForPreview?.description || 'Sin descripción detallada.'}</Text>

                {selectedProductForPreview?.type === 'combo' && selectedProductForPreview.comboItems?.length > 0 && (
                    <>
                      <Text style={s.previewLabel}>Contenido del Combo</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                          {selectedProductForPreview.comboItems.map((item, idx) => (
                              <View key={idx} style={s.previewComboItem}>
                                  <MaterialIcons name="fastfood" size={14} color={C.purple} />
                                  <Text style={s.previewComboItemTxt}>{item.name}</Text>
                              </View>
                          ))}
                      </View>
                    </>
                )}

                <View style={s.previewActions}>
                  <TouchableOpacity 
                    style={s.editProductBtn} 
                    onPress={() => {
                      setPreviewModalOpen(false);
                      if (selectedProductForPreview) openEdit(selectedProductForPreview);
                    }}
                  >
                    <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.editProductGradient}>
                      <MaterialIcons name="edit" size={20} color="#fff" />
                      <Text style={s.editProductTxt}>Editar Producto</Text>
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
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 20 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPri, letterSpacing: 0.5 },
  menuBtn: { gap: 4 },
  menuLine: { width: 20, height: 2, backgroundColor: C.textPri, borderRadius: 1 },
  headerSub: { fontSize: 12, color: C.textSec },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingVertical: 14 },
  summaryChip: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 12, borderWidth: 1, alignItems: 'center', gap: 4 },
  summaryN: { fontSize: 20, fontWeight: '800' },
  summaryL: { fontSize: 11, color: C.textSec },

  tabsScroll: { maxHeight: 46 },
  tabsContent: { gap: 8, paddingHorizontal: 22, paddingBottom: 4 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabTxt: { color: C.textSec, fontSize: 13, fontWeight: '500' },
  tabOn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabOnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  list: { flex: 1 },
  listInner: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 28, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  rowIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: C.textPri },
  rowSub: { fontSize: 12, color: C.textSec, marginTop: 3 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  rowPrice: { fontSize: 15, fontWeight: '700' },
  rowActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 7, borderRadius: 9 },

  empty: { alignItems: 'center', paddingVertical: 64, gap: 10 },
  emptyT: { fontSize: 15, color: C.textSec, fontWeight: '500' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,2,18,0.82)' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, borderTopWidth: 1, borderColor: C.border, gap: 14 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.textMut, alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.textPri },
  lbl: { fontSize: 11, color: C.textSec, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  inp: { backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 13, color: C.textPri, fontSize: 15 },
  formRow: { flexDirection: 'row', gap: 12 },
  catRow: { flexDirection: 'row', gap: 8 },
  catChip: { paddingHorizontal:14, paddingVertical: 11, borderRadius: 14, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  catChipTxt: { fontSize: 12, color: C.textMut, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontWeight: '600', fontSize: 14 },
  saveBtn: { paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  moreBtn: { padding: 4, marginLeft: 4 },
  optionsSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 20 },
  optionsTitle: { color: C.textPri, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  optionsGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  optionItem: { alignItems: 'center', gap: 8 },
  optionIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { color: C.textPri, fontSize: 13, fontWeight: '600' },

  imgPicker: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  imgPreview: { width: '100%', height: '100%' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInp: { flex: 1, color: C.textPri, fontSize: 14 },
  compactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },

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
  previewActions: { marginTop: 10 },
  editProductBtn: { borderRadius: 18, overflow: 'hidden' },
  editProductGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  editProductTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  previewComboItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.cardHi, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  previewComboItemTxt: { color: C.textPri, fontSize: 14, fontWeight: '500' },
});
