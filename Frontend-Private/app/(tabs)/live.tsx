import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '@/contexts/DrawerContext';
import { apiGet, apiPatch } from '@/utils/api';

const { width } = Dimensions.get('window');
const isTablet = width > 700; // Determinar si es pantalla ancha para mostrar 2 o 3 columnas

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

type OrderStatus = 'Pendiente de pago' | 'En Preparación' | 'Listo' | 'Entregado' | 'Cancelado';

interface OrderItem { productId?: string; name: string; quantity: number; price: number; }
interface Order { 
    _id: string; 
    orderNumber: string; 
    items: OrderItem[]; 
    source: string;
    status: OrderStatus; 
    createdAt: string; 
}

const FLOW_CONFIG: Record<string, { label: string; actionTxt: string; nextStatus: OrderStatus; color: string; colorLight: string; icon: string }> = {
  'Pendiente de pago': { label: 'Nuevo', actionTxt: 'Preparar', nextStatus: 'En Preparación', color: C.amber, colorLight: '#FFC86B', icon: 'local-fire-department' },
  'En Preparación':    { label: 'Cocinando', actionTxt: 'Marcar Listo', nextStatus: 'Listo', color: C.purple, colorLight: C.purpleLight, icon: 'restaurant' },
  'Listo':             { label: 'Para Entrega', actionTxt: 'Entregar Cliente', nextStatus: 'Entregado', color: C.teal, colorLight: '#33E0BF', icon: 'done-all' }
};

export default function LiveOrdersScreen() {
  const { openDrawer } = useDrawer();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const fetchOrders = async (isBackground = false) => {
    try {
      if (!isBackground && !refreshing) setLoading(true);
      const data = await apiGet('/orders');
      
      // Filtrar solo las ordenes activas
      const activeOrders = data.filter((o: Order) => 
        ['Pendiente de pago', 'En Preparación', 'Listo'].includes(o.status)
      );

      // Ordenar: Más antiguas primero (FIFO - First In First Out)
      activeOrders.sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setOrders(activeOrders);
    } catch (err) {
      console.error('Error fetching live orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto Refresh del grid cada 5 segundos
    const interval = setInterval(() => fetchOrders(true), 5000);
    // Reloj interno para actualizar los minutos transcurridos cada 30 segundos
    const timeInterval = setInterval(() => setCurrentTime(Date.now()), 30000);
    
    return () => { clearInterval(interval); clearInterval(timeInterval); };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, nextStatus: OrderStatus) => {
    try {
      setProcessingId(id);
      await apiPatch(`/orders/${id}/status`, { status: nextStatus });
      // Eliminamos el parpadeo releyendo instantáneamente la memoria local:
      setOrders(prev => {
        if (nextStatus === 'Entregado') return prev.filter(o => o._id !== id);
        return prev.map(o => o._id === id ? { ...o, status: nextStatus } : o);
      });
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setProcessingId(null);
    }
  };

  const getElapsedMinutes = (isoString: string) => {
    const start = new Date(isoString).getTime();
    const diff = currentTime - start;
    const mins = Math.floor(diff / 60000);
    return mins;
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.wrap}>
        
        {/* Header Específico de KDS */}
        <View style={s.header}>
          <TouchableOpacity style={s.menuBtn} onPress={openDrawer}>
             <View style={s.menuLine} />
             <View style={[s.menuLine, { width: 14 }]} />
             <View style={s.menuLine} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.headerTitle}>Pantalla de Cocina (KDS)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={s.blinkingDot} />
                <Text style={s.headerSub}>{orders.length} pedidos activos</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => fetchOrders(false)} style={s.refreshBtn}>
             <MaterialIcons name="refresh" size={24} color={C.textPri} />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
             <View style={s.empty}><ActivityIndicator color={C.teal} size="large" /></View>
        ) : (
          <ScrollView 
            style={s.list} 
            contentContainerStyle={s.listInner} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.teal} />}
          >
            {orders.length === 0 ? (
              <View style={s.empty}>
                <MaterialIcons name="done-all" size={64} color={C.textMut} />
                <Text style={s.emptyTitle}>¡Todo bajo control!</Text>
                <Text style={s.emptySub}>No hay comandas pendientes por atender.</Text>
              </View>
            ) : (
              <View style={s.grid}>
                {orders.map((order) => {
                  const cfg = FLOW_CONFIG[order.status];
                  if (!cfg) return null;
                  
                  const isProcessing = processingId === order._id;
                  const elapsed = getElapsedMinutes(order.createdAt);
                  const isUrgent = elapsed > 15; // Más de 15 minutos marca en rojo el tiempo

                  return (
                    <View key={order._id} style={[s.ticketCard, isTablet && s.ticketCardTablet, { borderColor: isUrgent ? C.rose : C.border }]}>
                      
                      {/* Ticket Header */}
                      <View style={[s.ticketHeader, { backgroundColor: cfg.color }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <MaterialIcons name={cfg.icon as any} size={20} color="#fff" />
                          <Text style={s.ticketNumber}>#{order.orderNumber}</Text>
                        </View>
                        <View style={s.timeBadge}>
                          <MaterialIcons name="timer" size={14} color={isUrgent ? C.rose : C.textPri} />
                          <Text style={[s.timeTxt, isUrgent && { color: C.rose }]}>{elapsed}m</Text>
                        </View>
                      </View>

                      {/* Ticket Body - Items */}
                      <View style={s.ticketBody}>
                        <Text style={s.ticketSource}>Para: {order.source || 'Cliente'}</Text>
                        <View style={s.divider} />
                        
                        {order.items.map((item, idx) => (
                           <View key={idx} style={s.itemRow}>
                             <Text style={s.itemQty}>{item.quantity || 1}x</Text>
                             <Text style={s.itemName}>{item.name}</Text>
                           </View>
                        ))}
                      </View>

                      {/* Ticket CTA */}
                      <TouchableOpacity 
                        style={s.ctaWrap}
                        activeOpacity={0.85}
                        disabled={isProcessing}
                        onPress={() => updateStatus(order._id, cfg.nextStatus)}
                      >
                         <LinearGradient 
                           colors={[cfg.color, cfg.colorLight]} 
                           start={{ x: 0, y: 0 }} 
                           end={{ x: 1, y: 0 }} 
                           style={s.ctaBtn}
                         >
                           {isProcessing ? (
                             <ActivityIndicator color="#fff" size="small" />
                           ) : (
                             <>
                               <Text style={s.ctaTxt}>{cfg.actionTxt}</Text>
                               <MaterialIcons name="chevron-right" size={24} color="#fff" />
                             </>
                           )}
                         </LinearGradient>
                      </TouchableOpacity>

                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  wrap: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.textPri, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: C.textSec, fontWeight: '600' },
  menuBtn: { gap: 4, width: 40, height: 40, justifyContent: 'center' },
  menuLine: { width: 20, height: 2, backgroundColor: C.textPri, borderRadius: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.cardHi, alignItems: 'center', justifyContent: 'center' },
  
  blinkingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.teal },
  
  empty: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: 100, gap: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.textPri },
  emptySub: { fontSize: 15, color: C.textSec },
  
  list: { flex: 1 },
  listInner: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  
  ticketCard: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  ticketCardTablet: {
    width: '48%', // Dos columnas si es tablet/pantalla horizontal
  },
  
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ticketNumber: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timeTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  
  ticketBody: {
    padding: 16,
    minHeight: 100,
  },
  ticketSource: { fontSize: 15, color: C.textSec, fontWeight: '700' },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  itemQty: { fontSize: 18, color: C.purpleLight, fontWeight: '900', width: 34 },
  itemName: { fontSize: 18, color: C.textPri, fontWeight: '700', flex: 1 },
  
  ctaWrap: { padding: 8, paddingTop: 0 },
  ctaBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 12,
    gap: 8 
  },
  ctaTxt: { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

});
