import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, StatusBar, ActivityIndicator, Image, Switch
} from 'react-native';
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

interface Category { _id: string; name: string; icon: string; }
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
  calories: string;
  popular: boolean;
  comboItems: {name: string, icon: string}[];
  rating: number;
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
      image: '', calories: '', popular: false, comboItems: '', rating: '0'
  });

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
      Alert.alert('Error de API', error.message || 'No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const list = filter === 'Todos' ? products : products.filter(p => p.categoryId?._id === filter);

  const openAdd = () => { 
    setEditing(null); 
    setForm({ name: '', description: '', price: '', type: 'snack', categoryId: categories[0]?._id || '', image: '', calories: '', popular: false, comboItems: '', rating: '0' }); 
    setModalOpen(true); 
  };
  
  const openEdit = (p: Product) => { 
    setEditing(p); 
    const comboStr = p.comboItems && p.comboItems.length > 0 ? p.comboItems.map(c => c.name).join(', ') : '';
    setForm({ 
        name: p.name, 
        description: p.description, 
        price: String(p.price), 
        type: p.type, 
        categoryId: p.categoryId?._id || '', 
        image: p.image || '', 
        calories: p.calories || '', 
        popular: p.popular || false, 
        comboItems: comboStr,
        rating: String(p.rating || 0)
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
    if (!form.name.trim() || !form.price || !form.categoryId) { 
        Alert.alert('Incompleto', 'Completa el nombre, precio y asigna una categoría.'); return; 
    }
    const priceNum = Number(form.price);
    if (priceNum <= 0) { Alert.alert('Precio inválido', 'El precio debe ser mayor a 0.'); return; }
    
    try {
      setUploadingImage(true);
      let imageUrl = form.image;
      if (imageUrl && imageUrl.startsWith('file://')) {
          imageUrl = await uploadImageToCloudinary(imageUrl);
      }

      const comboItemsArray = form.type === 'combo' && form.comboItems.trim() ? 
          form.comboItems.split(',').map(item => ({ name: item.trim(), icon: 'fastfood' })) : [];

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || 'Sin descripción',
        price: priceNum,
        type: form.type,
        categoryId: form.categoryId,
        image: imageUrl,
        calories: form.calories.trim(),
        popular: form.popular,
        comboItems: comboItemsArray,
        rating: Number(form.rating) || 0
      };

      if (editing) {
        await apiPatch(`/products/${editing._id}`, payload);
      } else {
        await apiPost('/products', payload);
      }
      setModalOpen(false);
      loadData(); // Refrescar lista
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error guardando producto');
    } finally {
        setUploadingImage(false);
    }
  };

  const toggle = async (id: string, currentVal: boolean) => {
    try {
      await apiPatch(`/products/${id}`, { available: !currentVal });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, available: !currentVal } : p));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar estado');
    }
  };

  const del = (id: string) => Alert.alert('Eliminar', '¿Eliminar este producto?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
            await apiDelete(`/products/${id}`);
            setProducts(prev => prev.filter(p => p._id !== id));
        } catch(e:any) {
            Alert.alert('Error', 'No se pudo eliminar: ' + e.message);
        }
    }},
  ]);

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
            <Text style={s.summaryL}>Pausados</Text>
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

          {categories.map(cat => {
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
              <TouchableOpacity key={p._id} style={[s.row, !p.available && { opacity: 0.45 }]} onPress={() => openEdit(p)} activeOpacity={0.7}>
                <View style={[s.rowIcon, { backgroundColor: C.purpleDim, overflow: 'hidden' }]}>
                  {p.image ? (
                    <Image source={{ uri: p.image }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <MaterialIcons name={getMaterialIcon(p.categoryId?.icon)} size={20} color={C.purple} />
                  )}
                </View>
                <View style={s.rowInfo}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Text style={s.rowName}>{p.name}</Text>
                    {p.popular && (
                      <View style={{backgroundColor: C.amberDim, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>
                        <Text style={{color: C.amber, fontSize: 10, fontWeight: '800'}}>POPULAR</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.rowSub}>{p.categoryId?.name || 'Snack'} {!p.available ? '· Pausado' : ''}</Text>
                </View>
                <View style={s.rowRight}>
                  <Text style={[s.rowPrice, { color: C.purple }]}>${p.price.toLocaleString()}</Text>
                  <View style={s.rowActions}>
                    <TouchableOpacity style={[s.iconBtn, { backgroundColor: p.available ? C.tealDim : C.roseDim }]} onPress={() => toggle(p._id, p.available)}>
                      <MaterialIcons name={p.available ? 'visibility' : 'visibility-off'} size={14} color={p.available ? C.teal : C.rose} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.iconBtn, { backgroundColor: C.roseDim }]} onPress={() => del(p._id)}>
                      <MaterialIcons name="delete-outline" size={14} color={C.rose} />
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
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={s.overlay}>
          <TouchableOpacity style={s.overlayBg} onPress={() => setModalOpen(false)} />
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{editing ? 'Editar Producto' : 'Nuevo Producto'}</Text>

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

                <View style={s.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.lbl}>Calorías</Text>
                    <TextInput style={s.inp} placeholder="Ej: 200 kcal" placeholderTextColor={C.textMut} value={form.calories} onChangeText={t => setForm(f => ({ ...f, calories: t }))} />
                  </View>
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}>
                    <Text style={[s.lbl, {marginBottom: 8}]}>¿ES POPULAR?</Text>
                    <Switch
                        value={form.popular}
                        onValueChange={(v) => setForm(f => ({...f, popular: v}))}
                        trackColor={{ false: C.cardHi, true: C.purple }}
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
                        <TouchableOpacity key={cat._id} style={[s.catChip, on && { backgroundColor: C.purpleDim, borderColor: C.purple }]} onPress={() => setForm(f => ({ ...f, categoryId: cat._id }))}>
                            <MaterialIcons name={getMaterialIcon(cat.icon)} size={16} color={on ? C.purple : C.textMut} />
                            <Text style={[s.catChipTxt, on && { color: C.purple }]}>{cat.name}</Text>
                        </TouchableOpacity>
                        );
                    })}
                  </View>
                </ScrollView>

                <Text style={s.lbl}>Clasificación Lógica</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {['snack', 'combo'].map((t) => (
                        <TouchableOpacity key={t} onPress={()=>setForm(f=>({...f, type: t as any}))} style={[s.catChip, form.type === t && {backgroundColor: C.textPri, borderColor: C.textPri}]}>
                            <Text style={[s.catChipTxt, form.type === t && {color: C.bg}]}>{t.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {form.type === 'combo' && (
                    <View>
                        <Text style={s.lbl}>Ítems del Combo (separados por coma)</Text>
                        <TextInput style={s.inp} placeholder="Ej: Papas fritas, Bebida, Hamburguesa" placeholderTextColor={C.textMut} value={form.comboItems} onChangeText={t => setForm(f => ({ ...f, comboItems: t }))} />
                    </View>
                )}
            </ScrollView>

            <View style={s.sheetActions}>
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
        </View>
      </Modal>
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

  imgPicker: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  imgPreview: { width: '100%', height: '100%' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
});
