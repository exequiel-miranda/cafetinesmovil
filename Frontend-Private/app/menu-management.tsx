import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar, Switch, Platform, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { apiGet, apiPatch } from '@/utils/api';
import { AppModal, AppModalAction } from '@/components/ui/AppModal';

const C = {
  bg:         '#0E0B24',
  card:       '#1A1640',
  cardHi:     '#231F52',
  border:     '#2E2A62',
  purple:     '#7B5CF5',
  purpleLight:'#9B7BFF',
  purpleDim:  'rgba(123,92,245,0.15)',
  teal:       '#00D2A3',
  tealDim:    'rgba(0,210,163,0.12)',
  rose:       '#FF6B8A',
  amber:      '#FFB038',
  textPri:    '#FFFFFF',
  textSec:    '#9B96C8',
  textMut:    '#4A4580',
};

interface LunchItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  type: string;
  image?: string;
}

export default function MenuManagementScreen() {
  const router = useRouter();
  const [lunches, setLunches] = useState<LunchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'confirm';
    actions: AppModalAction[];
  }>({ visible: false, title: '', message: '', type: 'info', actions: [] });

  const showAlert = (cfg: Omit<typeof alert, 'visible'>) => setAlert({ ...cfg, visible: true });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const loadLunches = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await apiGet('/products');
      // Filtrar solo almuerzos
      const filtered = data.filter((item: any) => item.type === 'lunch');
      setLunches(filtered);
    } catch (error: any) {
      showAlert({
        title: 'Error de Carga',
        message: 'No pudimos obtener la lista de almuerzos.',
        type: 'error',
        actions: [{ label: 'Reintentar', onPress: () => { hideAlert(); loadLunches(); } }]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLunches();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLunches(true);
  }, []);

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      setUpdatingId(id);
      // Optimistic Update
      setLunches(prev => prev.map(item => item._id === id ? { ...item, available: !currentStatus } : item));
      
      await apiPatch(`/products/${id}`, { available: !currentStatus });
    } catch (error: any) {
      // Revert if failed
      setLunches(prev => prev.map(item => item._id === id ? { ...item, available: currentStatus } : item));
      showAlert({
        title: 'Fallo al Actualizar',
        message: 'No se pudo cambiar el estado del plato en el servidor.',
        type: 'error',
        actions: [{ label: 'Entendido', onPress: hideAlert }]
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredLunches = useMemo(() => {
    return lunches.filter(l => 
      l.name.toLowerCase().includes(search.toLowerCase()) || 
      l.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [lunches, search]);

  const activeCount = lunches.filter(l => l.available).length;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      
      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={C.textPri} />
          </TouchableOpacity>
          <Text style={s.title}>Gestión de Menú</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={s.statsCard}>
          <View>
            <Text style={s.statsLabel}>Almuerzos en Menú</Text>
            <Text style={s.statsValue}>{activeCount} <Text style={{ fontSize: 14, color: C.textMut }}>/ {lunches.length}</Text></Text>
          </View>
          <View style={s.statsIcon}>
            <MaterialIcons name="restaurant" size={28} color={C.amber} />
          </View>
        </View>

        <View style={s.searchContainer}>
          <MaterialIcons name="search" size={20} color={C.textSec} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar plato..."
            placeholderTextColor={C.textMut}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={20} color={C.textSec} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.amber} />
          <Text style={s.loadingText}>Cargando Almuerzos...</Text>
        </View>
      ) : (
        <ScrollView 
          style={s.scroll} 
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.amber} />}
        >
          {filteredLunches.length === 0 ? (
            <View style={s.empty}>
              <MaterialIcons name="search-off" size={60} color={C.textMut} />
              <Text style={s.emptyTitle}>No se encontró el plato</Text>
              <Text style={s.emptySub}>Prueba con otro nombre o verifica la sección de Comida.</Text>
            </View>
          ) : (
            filteredLunches.map((item) => (
              <View 
                key={item._id} 
                style={[s.itemCard, !item.available && s.itemCardInactive]}
              >
                <View style={s.itemInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[s.itemName, !item.available && s.textInactive]} numberOfLines={1}>{item.name}</Text>
                    {item.available && (
                      <View style={s.activeBadge}>
                        <Text style={s.activeBadgeText}>MENÚ</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.itemPrice, !item.available && s.textInactive]}>${item.price.toLocaleString()}</Text>
                </View>

                <View style={s.itemAction}>
                  {updatingId === item._id ? (
                    <ActivityIndicator size="small" color={C.amber} style={{ marginRight: 10 }} />
                  ) : (
                    <Switch
                      value={item.available}
                      onValueChange={() => toggleAvailability(item._id, item.available)}
                      trackColor={{ false: C.cardHi, true: C.amber }}
                      thumbColor={Platform.OS === 'ios' ? '#fff' : (item.available ? C.textPri : C.textMut)}
                      style={Platform.OS === 'ios' ? { transform: [{ scale: 0.8 }] } : {}}
                    />
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <AppModal {...alert} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: C.bg },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  title: { fontSize: 20, fontWeight: '800', color: C.textPri },
  
  statsCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: C.card, 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  statsLabel: { fontSize: 13, color: C.textSec, fontWeight: '600', marginBottom: 4 },
  statsValue: { fontSize: 32, fontWeight: '800', color: C.textPri },
  statsIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,176,56,0.1)', alignItems: 'center', justifyContent: 'center' },

  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.card, 
    borderRadius: 14, 
    paddingHorizontal: 14, 
    height: 50,
    borderWidth: 1,
    borderColor: C.border
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: C.textPri, fontSize: 15 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: C.textSec, marginTop: 12, fontWeight: '600' },

  itemCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: C.card, 
    paddingVertical: 18, 
    paddingHorizontal: 20, 
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: C.border,
  },
  itemCardInactive: { opacity: 0.6, backgroundColor: 'transparent', borderColor: 'transparent' },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 17, fontWeight: '700', color: C.textPri },
  textInactive: { color: C.textMut },
  itemPrice: { fontSize: 15, fontWeight: '800', color: C.amber },
  
  activeBadge: { backgroundColor: 'rgba(0,210,163,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  activeBadgeText: { color: C.teal, fontSize: 9, fontWeight: '900' },

  itemAction: { paddingLeft: 10 },

  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { color: C.textPri, fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { color: C.textMut, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
