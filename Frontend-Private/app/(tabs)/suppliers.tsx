import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, StatusBar, ActivityIndicator, Image,
  RefreshControl, TouchableWithoutFeedback
} from 'react-native';
import { AppModal, AppModalAction } from '@/components/ui/AppModal';
import { SwipeableSheet } from '@/components/ui/SwipeableSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '@/contexts/DrawerContext';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { pickImageFromGallery, takePhoto, uploadImageToCloudinary } from '@/utils/cloudinary';
import { CalendarPicker } from '@/components/ui/CalendarPicker';

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

interface Supplier {
  _id: string;
  name: string;
  category: string;
  contact: string;
  image: string;
  active: boolean;
  description: string;
  lastPurchase: string;
  nextVisit: string;
  lastAmount?: number;
  lastNote?: string;
}


export default function SuppliersScreen() {
  const { openDrawer } = useDrawer();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', contact: '', image: '', description: '', lastPurchase: '', nextVisit: '' });

  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [selectedSupplierForOptions, setSelectedSupplierForOptions] = useState<Supplier | null>(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedSupplierForPreview, setSelectedSupplierForPreview] = useState<Supplier | null>(null);

  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [supplierForPurchase, setSupplierForPurchase] = useState<Supplier | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseNote, setPurchaseNote] = useState('');

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

  const onRefresh = useCallback(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/suppliers');
      setSuppliers(res || []);
    } catch (error: any) {
      showAlert({
        title: 'Error de Red',
        message: 'No se pudieron cargar los proveedores. Revisa tu conexión.',
        type: 'error',
        actions: [{ label: 'Reintentar', onPress: () => { hideAlert(); loadData(); } }]
      });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', contact: '', image: '', description: '', lastPurchase: '', nextVisit: '' });
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contact: s.contact,
      image: s.image,
      description: s.description,
      lastPurchase: s.lastPurchase || '',
      nextVisit: s.nextVisit || ''
    });
    setModalOpen(true);
  };

  const handlePickImage = async () => {
    showAlert({
      title: 'Imagen del Proveedor',
      message: '¿De dónde quieres obtener la imagen del logo?',
      type: 'info',
      icon: 'add-a-photo',
      actions: [
        {
          label: 'Cámara',
          onPress: async () => {
            hideAlert();
            const uri = await takePhoto();
            if (uri) setForm(f => ({ ...f, image: uri }));
          }
        },
        {
          label: 'Galería',
          onPress: async () => {
            hideAlert();
            const uri = await pickImageFromGallery();
            if (uri) setForm(f => ({ ...f, image: uri }));
          }
        },
        { label: 'Cancelar', type: 'secondary', onPress: hideAlert }
      ]
    });
  };

  const save = async () => {
    if (!form.name.trim() || !form.contact) {
      showAlert({
        title: 'Datos Incompletos',
        message: 'Por favor, completa el nombre y el contacto del proveedor para continuar.',
        type: 'confirm',
        icon: 'error-outline',
        actions: [{ label: 'Revisar', onPress: hideAlert }]
      });
      return;
    }

    try {
      setUploadingImage(true);
      let imageUrl = form.image;
      if (imageUrl && imageUrl.startsWith('file://')) {
        imageUrl = await uploadImageToCloudinary(imageUrl);
      }

      const payload = { ...form, image: imageUrl };

      if (editing) {
        await apiPut(`/suppliers/${editing._id}`, payload);
      } else {
        await apiPost('/suppliers', payload);
      }
      setModalOpen(false);
      // Delayed load data to ensure DB persistence and avoid UI flicker
      setTimeout(() => loadData(), 500);
    } catch (error: any) {
      showAlert({
        title: 'Error al Guardar',
        message: 'No se pudo procesar la solicitud del proveedor.',
        type: 'error',
        actions: [{ label: 'Entendido', onPress: hideAlert }]
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const quickRegisterPurchase = (sup: Supplier) => {
    setSupplierForPurchase(sup);
    setPurchaseAmount('');
    setPurchaseNote('');
    setCalendarModalOpen(true);
  };

  const processQuickPurchase = async (sup: Supplier, lastDate: string, nextDate: string) => {
    try {
      setLoading(true);
      const payload = {
        ...sup,
        lastPurchase: lastDate,
        nextVisit: nextDate,
        lastAmount: parseFloat(purchaseAmount) || 0,
        lastNote: purchaseNote
      };
      await apiPut(`/suppliers/${sup._id}`, payload);
      loadData();
      if (selectedSupplierForPreview?._id === sup._id) {
        setSelectedSupplierForPreview(prev => prev ? { 
            ...prev, 
            lastPurchase: lastDate, 
            nextVisit: nextDate,
            lastAmount: parseFloat(purchaseAmount) || 0,
            lastNote: purchaseNote
        } : null);
      }
      // Success feedback
      showAlert({
        title: '¡Compra Registrada!',
        message: `Se ha actualizado la fecha para ${sup.name} correctamente.`,
        type: 'success',
        actions: [{ label: 'Excelente', onPress: hideAlert }]
      });
    } catch (e: any) {
      showAlert({
        title: 'Error',
        message: 'No se pudo registrar la compra en el servidor.',
        type: 'error',
        actions: [{ label: 'Cerrar', onPress: hideAlert }]
      });
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (id: string, currentVal: boolean) => {
    try {
      await apiPut(`/suppliers/${id}`, { active: !currentVal });
      setSuppliers(prev => prev.map(s => s._id === id ? { ...s, active: !currentVal } : s));
      if (selectedSupplierForPreview?._id === id) {
        setSelectedSupplierForPreview(prev => prev ? { ...prev, active: !currentVal } : null);
      }
    } catch (e) {
      showAlert({
        title: 'Estado',
        message: 'No se pudo actualizar el estado del proveedor.',
        type: 'error',
        actions: [{ label: 'OK', onPress: hideAlert }]
      });
    }
  };

  const del = (id: string) => showAlert({
    title: 'Eliminar Proveedor',
    message: '¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.',
    type: 'error',
    icon: 'delete-sweep',
    actions: [
      { label: 'Cancelar', type: 'secondary', onPress: hideAlert },
      {
        label: 'Eliminar Ahora',
        type: 'danger',
        onPress: async () => {
          try {
            await apiDelete(`/suppliers/${id}`);
            setSuppliers(prev => prev.filter(s => s._id !== id));
            setPreviewModalOpen(false);
            hideAlert();
          } catch (e) {
            showAlert({ title: 'Error', message: 'No se pudo eliminar', type: 'error', actions: [{ label: 'Cerrar', onPress: hideAlert }] });
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
          <Text style={s.headerTitle}>Gestión de Proveedores</Text>
          <TouchableOpacity onPress={openAdd} activeOpacity={0.8}>
            <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.addBtn}>
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={s.addTxt}>Nuevo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading ? (
          <View style={s.empty}><ActivityIndicator color={C.purple} size="large" /></View>
        ) : (
          <ScrollView
            style={s.list}
            contentContainerStyle={s.listInner}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={C.purple} />
            }
          >
            {suppliers.length === 0 && !loading ? (
              <View style={s.empty}>
                <MaterialIcons name="local-shipping" size={44} color={C.textMut} />
                <Text style={s.emptyT}>Sin proveedores registrados</Text>
              </View>
            ) : suppliers.map(sup => (
              <TouchableOpacity
                key={sup._id}
                style={[s.supCard, !sup.active && { opacity: 0.7 }]}
                onPress={() => {
                  setSelectedSupplierForPreview(sup);
                  setPreviewModalOpen(true);
                }}
                activeOpacity={0.8}
              >
                <View style={[s.supLogo, { backgroundColor: C.purpleDim }]}>
                  {sup.image ? (
                    <Image source={{ uri: sup.image }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <MaterialIcons name="business" size={26} color={C.purple} />
                  )}
                </View>

                <View style={s.supInfo}>
                  <Text style={s.supName} numberOfLines={1}>{sup.name}</Text>
                  <View style={[s.statusBadgeList, { borderColor: sup.active ? C.teal : C.rose }]}>
                    <View style={[s.statusDotSmall, { backgroundColor: sup.active ? C.teal : C.rose }]} />
                    <Text style={[s.statusTxtSmall, { color: sup.active ? C.teal : C.rose }]}>
                      {sup.active ? 'ACTIVO' : 'PAUSADO'}
                    </Text>
                  </View>
                </View>

                {sup.nextVisit ? (
                  <View style={s.supVisitBox}>
                    <MaterialIcons name="event" size={14} color={C.purple} />
                    <View>
                      <Text style={s.supVisitLbl}>VISITA</Text>
                      <Text style={s.supVisitVal}>{sup.nextVisit}</Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={s.supAddVisit}
                    onPress={() => quickRegisterPurchase(sup)}
                  >
                    <MaterialIcons name="add-circle-outline" size={20} color={C.textMut} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={s.supMore}
                  onPress={() => {
                    setSelectedSupplierForOptions(sup);
                    setOptionsModalOpen(true);
                  }}
                >
                  <MaterialIcons name="more-vert" size={20} color={C.textMut} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Form Modal */}
      <SwipeableSheet visible={modalOpen} onClose={() => setModalOpen(false)} fullHeight maxHeight="90%">
        <View style={{ paddingHorizontal: 24, paddingBottom: 20, flex: 1 }}>
          <Text style={s.sheetTitle}>{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</Text>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <TouchableOpacity style={s.imgPicker} onPress={handlePickImage} activeOpacity={0.8}>
                {form.image ? (
                  <Image source={{ uri: form.image }} style={s.imgPreview} />
                ) : (
                  <View style={s.imgPlaceholder}>
                    <MaterialIcons name="add-a-photo" size={28} color={C.textSec} />
                    <Text style={{ color: C.textSec, fontSize: 12, marginTop: 4 }}>Logo Proveedor</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text style={s.lbl}>Nombre</Text>
            <TextInput style={s.inp} placeholder="Nombre de la empresa..." placeholderTextColor={C.textMut} value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))} />

            <Text style={s.lbl}>Contacto (Teléfono / Email)</Text>
            <TextInput style={s.inp} placeholder="+56 9..." placeholderTextColor={C.textMut} value={form.contact} onChangeText={t => setForm(f => ({ ...f, contact: t }))} />


            <Text style={s.lbl}>Nota / Descripción</Text>
            <TextInput style={[s.inp, { height: 60, textAlignVertical: 'top' }]} multiline placeholder="Referencia o notas extras..." placeholderTextColor={C.textMut} value={form.description} onChangeText={t => setForm(f => ({ ...f, description: t }))} />

            <View style={s.visitFormRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.lbl}>Última Compra</Text>
                <TextInput style={s.inp} placeholder="DD/MM/YYYY" placeholderTextColor={C.textMut} value={form.lastPurchase} onChangeText={t => setForm(f => ({ ...f, lastPurchase: t }))} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.lbl}>Próxima Visita</Text>
                <TextInput style={s.inp} placeholder="DD/MM/YYYY" placeholderTextColor={C.textMut} value={form.nextVisit} onChangeText={t => setForm(f => ({ ...f, nextVisit: t }))} />
              </View>
            </View>
          </ScrollView>

          <View style={s.sheetActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setModalOpen(false)}>
              <Text style={s.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} style={{ flex: 2 }} activeOpacity={0.85} disabled={uploadingImage}>
              <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtn}>
                {uploadingImage ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="check" size={16} color="#fff" />}
                <Text style={s.saveTxt}>{uploadingImage ? 'Guardando...' : 'Guardar Proveedor'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SwipeableSheet>

      {/* Options Modal */}
      <SwipeableSheet visible={optionsModalOpen} onClose={() => setOptionsModalOpen(false)}>
        <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
          <Text style={s.optionsTitle}>{selectedSupplierForOptions?.name}</Text>
          <View style={[s.optionsGrid, { marginTop: 10 }]}>
            <TouchableOpacity style={s.optionItem} onPress={() => { setOptionsModalOpen(false); if (selectedSupplierForOptions) openEdit(selectedSupplierForOptions); }}>
              <View style={[s.optionIcon, { backgroundColor: C.purpleDim }]}><MaterialIcons name="edit" size={24} color={C.purple} /></View>
              <Text style={s.optionLabel}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.optionItem} onPress={() => { setOptionsModalOpen(false); if (selectedSupplierForOptions) quickRegisterPurchase(selectedSupplierForOptions); }}>
              <View style={[s.optionIcon, { backgroundColor: C.amberDim }]}><MaterialIcons name="shopping-cart-checkout" size={24} color={C.amber} /></View>
              <Text style={s.optionLabel}>Compra</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.optionItem} onPress={() => { setOptionsModalOpen(false); if (selectedSupplierForOptions) toggle(selectedSupplierForOptions._id, selectedSupplierForOptions.active); }}>
              <View style={[s.optionIcon, { backgroundColor: selectedSupplierForOptions?.active ? C.roseDim : C.tealDim }]}><MaterialIcons name={selectedSupplierForOptions?.active ? 'visibility-off' : 'visibility'} size={24} color={selectedSupplierForOptions?.active ? C.rose : C.teal} /></View>
              <Text style={s.optionLabel}>{selectedSupplierForOptions?.active ? 'Pausar' : 'Reactivar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.optionItem} onPress={() => { setOptionsModalOpen(false); if (selectedSupplierForOptions) del(selectedSupplierForOptions._id); }}>
              <View style={[s.optionIcon, { backgroundColor: C.roseDim }]}><MaterialIcons name="delete-outline" size={24} color={C.rose} /></View>
              <Text style={[s.optionLabel, { color: C.rose }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SwipeableSheet>

      <SwipeableSheet
        visible={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        maxHeight="90%"
        fullHeight
        backgroundColor={C.card}
      >
        <View style={s.previewImgWrap}>
          {selectedSupplierForPreview?.image ? (
            <Image source={{ uri: selectedSupplierForPreview.image }} style={s.previewImg} resizeMode="cover" />
          ) : (
            <View style={[s.previewImgPlaceholder, { backgroundColor: C.purpleDim }]}>
              <MaterialIcons name="business" size={80} color={C.purple} />
            </View>
          )}
          <LinearGradient colors={['transparent', 'rgba(14,11,36,0.9)']} style={s.previewImgOverlay} />
          <TouchableOpacity style={s.closePreviewBtn} onPress={() => setPreviewModalOpen(false)}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={s.previewBody}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={s.previewHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.previewName}>{selectedSupplierForPreview?.name}</Text>
                <Text style={s.previewType}>Empresa Proveedora</Text>
              </View>
              <MaterialIcons name="local-shipping" size={28} color={C.purple} />
            </View>

            <View style={s.previewStatusRow}>
              <View style={[s.statusPill, { backgroundColor: selectedSupplierForPreview?.active ? 'rgba(0,210,163,0.1)' : 'rgba(255,107,138,0.1)', borderColor: selectedSupplierForPreview?.active ? C.teal : C.rose }]}>
                <View style={[s.statusDot, { backgroundColor: selectedSupplierForPreview?.active ? C.teal : C.rose }]} />
                <Text style={[s.statusPillTxt, { color: selectedSupplierForPreview?.active ? C.teal : C.rose }]}>
                  {selectedSupplierForPreview?.active ? 'PROVEEDOR ACTIVO' : 'PAUSADO'}
                </Text>
              </View>
            </View>

            <Text style={s.previewLabel}>Información de Contacto</Text>
            <View style={s.contactCard}>
              <MaterialIcons name="phone" size={22} color={C.teal} />
              <Text style={s.contactText}>{selectedSupplierForPreview?.contact}</Text>
            </View>

            <Text style={s.previewLabel}>Historial de Última Compra</Text>
            <View style={[s.contactCard, { backgroundColor: 'rgba(0,210,163,0.05)', borderColor: C.teal }]}>
                <MaterialIcons name="shopping-cart-checkout" size={22} color={C.teal} />
                <View style={{ flex: 1 }}>
                    <Text style={[s.contactText, { color: C.teal }]}>${selectedSupplierForPreview?.lastAmount?.toLocaleString() || '0'}</Text>
                    <Text style={[s.previewContent, { fontSize: 13, marginTop: 4 }]}>{selectedSupplierForPreview?.lastNote || 'Sin notas en esta visita.'}</Text>
                </View>
            </View>

            <Text style={s.previewLabel}>Gestión de Visitas</Text>
            <View style={s.visitCardsRow}>
              <View style={s.visitCard}>
                <MaterialIcons name="shopping-bag" size={20} color={C.amber} />
                <View>
                  <Text style={s.visitCardLbl}>ÚLTIMA COMPRA</Text>
                  <Text style={s.visitCardVal}>{selectedSupplierForPreview?.lastPurchase || 'Sin registro'}</Text>
                </View>
              </View>
              <View style={[s.visitCard, { borderColor: C.purple }]}>
                <MaterialIcons name="event" size={20} color={C.purple} />
                <View>
                  <Text style={s.visitCardLbl}>PRÓXIMA VISITA</Text>
                  <Text style={[s.visitCardVal, { color: C.purple }]}>{selectedSupplierForPreview?.nextVisit || 'No programada'}</Text>
                </View>
              </View>
            </View>

            <Text style={s.previewLabel}>Notas Extras</Text>
            <Text style={s.previewContent}>{selectedSupplierForPreview?.description || 'Sin descripción detallada.'}</Text>

            <View style={s.previewActions}>
              <TouchableOpacity
                style={[s.editProductBtn, { marginBottom: 12 }]}
                onPress={() => { if (selectedSupplierForPreview) quickRegisterPurchase(selectedSupplierForPreview); }}
              >
                <LinearGradient colors={[C.teal, '#00BFA5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.editProductGradient}>
                  <MaterialIcons name="add-shopping-cart" size={20} color="#fff" />
                  <Text style={s.editProductTxt}>Registrar Compra Hoy</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={s.editProductBtn} onPress={() => { setPreviewModalOpen(false); if (selectedSupplierForPreview) openEdit(selectedSupplierForPreview); }}>
                <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.editProductGradient}>
                  <MaterialIcons name="edit" size={20} color="#fff" />
                  <Text style={s.editProductTxt}>Editar Datos</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SwipeableSheet>

      {/* Visit Calendar Modal */}
      <SwipeableSheet visible={calendarModalOpen} onClose={() => setCalendarModalOpen(false)} maxHeight="90%" fullHeight>
        {supplierForPurchase && (
          <View style={{ flex: 1 }}>
            <View style={[s.sheetHead, { paddingHorizontal: 24, paddingTop: 24 }]}>
              <View>
                <Text style={s.sheetTitle}>Registrar Compra</Text>
                <Text style={s.sheetSub}>{supplierForPurchase.name} · Hoy: {formatDate(new Date())}</Text>
              </View>
              <MaterialIcons name="event-note" size={28} color={C.purple} />
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            <View style={{ marginBottom: 20, marginTop: 10 }}>
                <Text style={s.lbl}>Monto Gastado Hoy ($)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name="attach-money" size={24} color={C.teal} />
                    <TextInput 
                        style={[s.inp, { flex: 1 }]} 
                        placeholder="0.00" 
                        placeholderTextColor={C.textMut}
                        keyboardType="numeric"
                        value={purchaseAmount}
                        onChangeText={setPurchaseAmount}
                    />
                </View>

                <Text style={[s.lbl, { marginTop: 16 }]}>Notas de esta Compra</Text>
                <TextInput 
                    style={[s.inp, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]} 
                    multiline 
                    placeholder="¿Qué compraste hoy?..." 
                    placeholderTextColor={C.textMut}
                    value={purchaseNote}
                    onChangeText={setPurchaseNote}
                />
            </View>

            <Text style={[s.lbl, { marginTop: 10, marginBottom: 12 }]}>Selecciona fecha de próxima visita:</Text>

            <View style={[s.visitCardsRow, { marginBottom: 16 }]}>
              <TouchableOpacity
                style={[s.visitCard, { borderColor: C.teal, backgroundColor: C.tealDim }]}
                onPress={() => {
                  const date = formatDate(new Date(Date.now() + 86400000));
                  processQuickPurchase(supplierForPurchase, formatDate(new Date()), date);
                  setCalendarModalOpen(false);
                }}
              >
                <MaterialIcons name="fast-forward" size={16} color={C.teal} />
                <View>
                  <Text style={[s.visitCardLbl, { color: C.teal }]}>MAÑANA</Text>
                  <Text style={s.visitCardVal}>{formatDate(new Date(Date.now() + 86400000))}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.visitCard, { borderColor: C.amber, backgroundColor: C.amberDim }]}
                onPress={() => {
                  const date = formatDate(new Date(Date.now() + 7 * 86400000));
                  processQuickPurchase(supplierForPurchase, formatDate(new Date()), date);
                  setCalendarModalOpen(false);
                }}
              >
                <MaterialIcons name="next-week" size={16} color={C.amber} />
                <View>
                  <Text style={[s.visitCardLbl, { color: C.amber }]}>7 DÍAS</Text>
                  <Text style={s.visitCardVal}>{formatDate(new Date(Date.now() + 7 * 86400000))}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.visitCard, { borderColor: C.textMut, backgroundColor: C.cardHi }]}
                onPress={() => {
                  processQuickPurchase(supplierForPurchase, formatDate(new Date()), '');
                  setCalendarModalOpen(false);
                }}
              >
                <MaterialIcons name="event-busy" size={20} color={C.textMut} />
                <View>
                  <Text style={s.visitCardLbl}>SIN FECHA</Text>
                  <Text style={s.visitCardVal}>No registrar próxima visita</Text>
                </View>
              </TouchableOpacity>
            </View>

            <CalendarPicker
              onSelect={(date) => {
                showAlert({
                  title: 'Confirmar Registro',
                  message: `¿Registrar compra de hoy y programar próxima visita para el ${date}?`,
                  type: 'confirm',
                  icon: 'shopping-cart',
                  actions: [
                    { label: 'Cancelar', type: 'secondary', onPress: hideAlert },
                    {
                      label: 'Confirmar',
                      type: 'primary',
                      onPress: () => {
                        setCalendarModalOpen(false);
                        hideAlert();
                        processQuickPurchase(supplierForPurchase, formatDate(new Date()), date);
                      }
                    }
                  ]
                });
              }}
            />

            <TouchableOpacity style={[s.closeBtn, { marginTop: 20 }]} onPress={() => setCalendarModalOpen(false)}>
              <Text style={s.closeTxt}>Cancelar</Text>
            </TouchableOpacity>
            </ScrollView>
          </View>
        )}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPri, letterSpacing: 0.5 },
  menuBtn: { gap: 4 },
  menuLine: { width: 20, height: 2, backgroundColor: C.textPri, borderRadius: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { flex: 1 },
  listInner: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 12 },
  supCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  supLogo: { width: 60, height: 60, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  supInfo: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  supName: { fontSize: 17, fontWeight: '800', color: C.textPri, letterSpacing: -0.3 },
  statusBadgeList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  statusDotSmall: { width: 5, height: 5, borderRadius: 2.5 },
  statusTxtSmall: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  supVisitBox: {
    backgroundColor: C.cardHi,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: C.border
  },
  supVisitLbl: { fontSize: 8, color: C.textMut, fontWeight: '900', letterSpacing: 0.5 },
  supVisitVal: { fontSize: 12, color: C.textPri, fontWeight: '700', marginTop: 1 },
  supAddVisit: { padding: 8 },
  supMore: { paddingLeft: 8, paddingRight: 4 },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyT: { fontSize: 15, color: C.textSec, fontWeight: '500' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,2,18,0.85)' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, borderTopWidth: 1, borderColor: C.border },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.textMut, alignSelf: 'center', marginBottom: 12 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.textPri },
  sheetSub: { fontSize: 12, color: C.textSec, marginTop: 2 },
  lbl: { fontSize: 11, color: C.textSec, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  inp: { backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, color: C.textPri, fontSize: 15 },
  catRow: { flexDirection: 'row', gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border },
  catChipTxt: { fontSize: 12, color: C.textMut, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelTxt: { color: C.textSec, fontWeight: '600', fontSize: 14 },
  saveBtn: { paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  imgPicker: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  imgPreview: { width: '100%', height: '100%' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  optionsSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 20 },
  optionsTitle: { color: C.textPri, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
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
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  previewName: { fontSize: 26, fontWeight: '800', color: C.textPri, flex: 1, marginRight: 10 },
  previewType: { fontSize: 14, color: C.textSec, fontWeight: '600', marginTop: 4 },
  previewStatusRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusPillTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  previewLabel: { fontSize: 13, color: C.textMut, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, marginTop: 16 },
  previewContent: { fontSize: 17, color: C.textSec, lineHeight: 26 },
  previewActions: { marginTop: 32 },
  editProductBtn: { borderRadius: 20, overflow: 'hidden' },
  editProductGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20 },
  editProductTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.cardHi, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  contactText: { color: C.textPri, fontSize: 18, fontWeight: '700' },
  visitBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  visitBadgeTxt: { color: C.purple, fontSize: 10, fontWeight: '800' },
  visitFormRow: { flexDirection: 'row', gap: 14, marginTop: 6 },
  visitCardsRow: { flexDirection: 'column', gap: 12, marginTop: 6 },
  visitCard: { backgroundColor: C.cardHi, borderRadius: 20, borderLeftWidth: 5, borderColor: C.amber, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  visitCardLbl: { fontSize: 10, color: C.textMut, fontWeight: '800', letterSpacing: 1 },
  visitCardVal: { fontSize: 15, color: C.textPri, fontWeight: '800', marginTop: 4 },
  closeBtn: { flex: 1, paddingVertical: 16, borderRadius: 18, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  closeTxt: { color: C.textPri, fontWeight: '800', fontSize: 15 },
});
