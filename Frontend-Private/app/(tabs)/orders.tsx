import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, ActivityIndicator, Alert
} from 'react-native';
import { AppModal, AppModalAction } from '@/components/ui/AppModal';
import { SwipeableSheet } from '@/components/ui/SwipeableSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '@/contexts/DrawerContext';
import { apiGet, apiPatch } from '@/utils/api';

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
    total: number; 
    status: OrderStatus; 
    paymentMethod: string | null;
    source: string;
    createdAt: string; 
}
  
const STATUS_CFG: Record<OrderStatus, { label: string; icon: string; color: string; bg: string; action?: string }> = {
  'Pendiente de pago': { label: 'Por Pagar', icon: 'schedule', color: C.amber, bg: C.amberDim, action: 'Confirmar' },
  'En Preparación':    { label: 'Cocina', icon: 'restaurant', color: C.purple, bg: C.purpleDim, action: 'Marcar Listo' },
  'Listo':             { label: 'Listo', icon: 'check-circle', color: C.teal, bg: C.tealDim, action: 'Entregar' },
  'Entregado':         { label: 'Entregado', icon: 'done-all', color: C.textMut, bg: 'rgba(74,69,128,0.2)' },
  'Cancelado':         { label: 'Anulado', icon: 'cancel', color: C.rose, bg: C.roseDim },
};
const FLOW: OrderStatus[] = ['Pendiente de pago', 'En Preparación', 'Listo', 'Entregado', 'Cancelado'];

export default function OrdersScreen() {
  const { openDrawer } = useDrawer();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isFoodOrder = (order: Order) => {
    return order.source === 'Almuerzos' || order.source === 'Desayunos';
  };

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
      fetchOrders();
      // Optional: Set up an interval to poll for new orders every 10 seconds
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
      try {
          const data = await apiGet('/orders');
          // sort orders by date descending by default
          setOrders(data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err: any) {
          showAlert({
            title: 'Error de Red',
            message: 'No pudimos sincronizar los pedidos en tiempo real.',
            type: 'error',
            actions: [{ label: 'Reintentar', onPress: () => { hideAlert(); fetchOrders(); } }]
          });
      } finally {
          setLoading(false);
      }
  };

  const list = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const countOf = (s: OrderStatus) => orders.filter(o => o.status === s).length;

  const formatTime = (isoString: string) => {
      const d = new Date(isoString);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const updateStatus = async (id: string, nextStatus: OrderStatus) => {
    try {
        await apiPatch(`/orders/${id}/status`, { status: nextStatus });
        // Optimistic UI update
        setOrders(prev => prev.map(o => o._id === id ? { ...o, status: nextStatus } : o));
        setSelected(prev => prev?._id === id ? { ...prev, status: nextStatus } : prev);
    } catch (e: any) {
        showAlert({
            title: 'Error de Estado',
            message: 'No se pudo actualizar el progreso del pedido. Intenta de nuevo.',
            type: 'error',
            actions: [{ label: 'Cerrar', onPress: hideAlert }]
        });
    }
  };

  const FILTER_OPTS = [
    { key: 'all' as const, label: 'Todos', count: orders.length },
    ...FLOW.map(s => ({ key: s as OrderStatus, label: STATUS_CFG[s].label, count: countOf(s) })),
  ];

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
          <Text style={s.headerTitle}>Monitor de Pedidos</Text>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.liveLabel}>En vivo</Text>
          </View>
        </View>

        {/* Status summary row - Now also the main filters */}
        <View style={{ height: 105 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={s.statusRow}
          >
            {/* "Todas" card */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setFilter('all')}
              style={[
                s.statusCard, 
                filter === 'all' && s.statusCardOn
              ]}
            >
              <LinearGradient 
                colors={filter === 'all' ? [C.purple, C.purpleLight] : [C.card, C.card]} 
                style={StyleSheet.absoluteFill} 
                start={{x:0, y:0}} end={{x:1, y:1}} 
              />
              <MaterialIcons 
                name="apps" 
                size={18} 
                color={filter === 'all' ? '#fff' : C.textSec} 
              />
              <Text style={[s.statusN, { color: filter === 'all' ? '#fff' : C.textPri }]}>
                {orders.length}
              </Text>
              <Text style={[s.statusL, { color: filter === 'all' ? 'rgba(255,255,255,0.8)' : C.textSec }]}>
                Todas
              </Text>
            </TouchableOpacity>

            {FLOW.map(status => {
              const cfg = STATUS_CFG[status];
              const n = countOf(status);
              const isActive = filter === status;
              
              return (
                <TouchableOpacity 
                  key={status} 
                  activeOpacity={0.8}
                  onPress={() => setFilter(status as OrderStatus)}
                  style={[
                    s.statusCard, 
                    { borderColor: isActive ? cfg.color : cfg.color + '40' },
                    isActive && { backgroundColor: cfg.color }
                  ]}
                >
                  {isActive && (
                    <LinearGradient 
                      colors={[cfg.color, cfg.color + 'CC']} 
                      style={StyleSheet.absoluteFill} 
                    />
                  )}
                  <MaterialIcons 
                    name={cfg.icon as any} 
                    size={18} 
                    color={isActive ? '#fff' : cfg.color} 
                  />
                  <Text style={[s.statusN, { color: isActive ? '#fff' : cfg.color }]}>
                    {n}
                  </Text>
                  <Text style={[s.statusL, { color: isActive ? 'rgba(255,255,255,0.8)' : C.textSec }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>


        {/* Orders list */}
        {loading ? (
             <View style={s.empty}><ActivityIndicator color={C.teal} size="large" /></View>
        ) : (
        <ScrollView style={s.list} contentContainerStyle={s.listInner} showsVerticalScrollIndicator={false}>
          {list.length === 0 ? (
            <View style={s.empty}>
              <MaterialIcons name="receipt-long" size={44} color={C.textMut} />
              <Text style={s.emptyT}>Sin pedidos con este estado</Text>
            </View>
          ) : list.map(order => {
            const cfg = STATUS_CFG[order.status] || { label: order.status || '?', icon: 'info', color: C.textMut, bg: 'rgba(255,255,255,0.1)', action: '...' };
            return (
              <TouchableOpacity key={order._id} style={s.orderCard} onPress={() => setSelected(order)} activeOpacity={0.75}>
                {/* Left Side: Order Number (Prominent) */}
                <View style={[s.orderSide, { backgroundColor: cfg.bg }]}>
                  <Text style={[s.orderSideHash, { color: cfg.color }]}>#</Text>
                  <Text style={[s.orderSideNum, { color: cfg.color }]}>{order.orderNumber}</Text>
                </View>

                {/* Right Side: Details */}
                <View style={s.orderInner}>
                  {/* Row 1: Status & Time */}
                  <View style={s.orderRow1}>
                    <View style={[s.chip, { backgroundColor: cfg.bg }]}>
                      <MaterialIcons name={cfg.icon as any} size={11} color={cfg.color} />
                      <Text style={[s.chipTxt, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={s.orderTime}>{formatTime(order.createdAt)}</Text>
                  </View>

                  {/* Row 2: Source & Total */}
                  <View style={s.orderRow2}>
                    <View style={s.nameBlock}>
                      <Text style={s.studentN}>{order.source}</Text>
                      <Text style={s.gradeT}>{order.items.length} ítem{order.items.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <Text style={s.orderTotal}>${order.total.toLocaleString()}</Text>
                  </View>

                  {/* CTA */}
                  {order.status !== 'Entregado' && order.status !== 'Cancelado' && (
                    <TouchableOpacity 
                      onPress={() => {
                        const isFood = isFoodOrder(order);
                        const nextMap: Record<string, OrderStatus> = {
                          'Pendiente de pago': isFood ? 'En Preparación' : 'Entregado',
                          'En Preparación': 'Listo',
                          'Listo': 'Entregado',
                        };
                        const next = nextMap[order.status];
                        if (next) updateStatus(order._id, next);
                      }} 
                      activeOpacity={0.8} 
                      style={{ borderRadius: 12, overflow: 'hidden' }}
                    >
                      <LinearGradient colors={[cfg.color + 'CC', cfg.color + '88']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaBtn}>
                        <MaterialIcons name="arrow-forward" size={13} color="#fff" />
                        <Text style={s.ctaTxt}>
                          {(!isFoodOrder(order) && order.status === 'Pendiente de pago') 
                            ? 'Pagado y Entregado' 
                            : cfg.action}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        )}
      </View>

      {/* Detail Modal */}
      <SwipeableSheet 
        visible={!!selected} 
        onClose={() => setSelected(null)}
        maxHeight="90%"
        fullHeight
      >
          {selected && (() => {
            const cfg = STATUS_CFG[selected.status] || { label: selected.status || '?', icon: 'info', color: C.textMut, bg: 'rgba(255,255,255,0.1)', action: '...' };
            return (
              <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
                <View style={s.sheetHead}>
                  <View>
                    <Text style={s.sheetTitle}>Detalle del Pedido</Text>
                    <Text style={s.sheetSub}>#{selected.orderNumber} · {formatTime(selected.createdAt)}</Text>
                  </View>
                  <View style={[s.chip, { backgroundColor: cfg.bg }]}>
                    <MaterialIcons name={cfg.icon as any} size={12} color={cfg.color} />
                    <Text style={[s.chipTxt, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                <View style={[s.stuRow, { marginTop: 14 }]}>
                  <View style={[s.avatarLg, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.avatarLgL, { color: cfg.color }]}>#</Text>
                  </View>
                  <View>
                    <Text style={s.stuName}>Orden {selected.orderNumber}</Text>
                    <Text style={s.stuGrade}>Origen: {selected.source}</Text>
                  </View>
                </View>

                <View style={[s.divider, { marginVertical: 14 }]} />
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                    {selected.items.map((item, i) => (
                    <View key={i} style={s.itemRow}>
                        <View style={[s.qtyBox, { backgroundColor: C.purpleDim }]}><Text style={[s.qtyTxt, { color: C.purple }]}>{item.quantity || 1}</Text></View>
                        <Text style={s.itemName}>{item.name}</Text>
                        <Text style={s.itemPrice}>${((item.quantity || 1) * item.price).toLocaleString()}</Text>
                    </View>
                    ))}
                </ScrollView>

                <View style={[s.divider, { marginVertical: 14 }]} />
                <View style={s.totalRow}>
                  <Text style={s.totalLbl}>Total a Cobrar</Text>
                  <Text style={s.totalVal}>${selected.total.toLocaleString()}</Text>
                </View>
                <Text style={[s.stuGrade, { marginBottom: 14 }]}>Pago: {selected.paymentMethod || 'Pendiente'}</Text>

                <Text style={[s.sheetTitle, { fontSize: 15, marginTop: 20, marginBottom: 10, color: C.textSec }]}>Cambiar Estado del Pedido</Text>
                <View style={s.statusPicker}>
                  {FLOW.map(sKey => {
                    const sCfg = STATUS_CFG[sKey];
                    const isNow = selected.status === sKey;
                    const isFood = isFoodOrder(selected);

                    // Si es SNACK, ocultamos los estados de cocina
                    if (!isFood && (sKey === 'En Preparación' || sKey === 'Listo')) return null;

                    return (
                      <TouchableOpacity 
                        key={sKey}
                        onPress={() => updateStatus(selected._id, sKey)}
                        activeOpacity={0.7}
                        style={[
                          s.statusOption, 
                          { borderColor: isNow ? sCfg.color : C.border },
                          isNow && { backgroundColor: sCfg.bg }
                        ]}
                      >
                        <MaterialIcons name={sCfg.icon as any} size={20} color={isNow ? sCfg.color : C.textSec} />
                        <Text style={[s.statusOptionTxt, { color: isNow ? sCfg.color : C.textSec }]}>
                             {(!isFood && sKey === 'Entregado') ? 'Pagado y Entregado' : sCfg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={s.sheetActions}>
                  <TouchableOpacity style={s.closeBtn} onPress={() => setSelected(null)}>
                    <Text style={s.closeTxt}>Finalizar Gestión</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
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
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.tealDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.teal + '30' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal },
  liveLabel: { fontSize: 11, color: C.teal, fontWeight: '600' },

  statusRow: { gap: 10, paddingHorizontal: 22, paddingVertical: 12 },
  statusCard: { 
    width: 88, 
    height: 80, 
    borderRadius: 18, 
    backgroundColor: C.card, 
    borderWidth: 1.5, 
    borderColor: C.border, 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden'
  },
  statusCardOn: {
    borderColor: 'transparent',
  },
  statusN: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  statusL: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  list: { flex: 1 },
  listInner: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 28, gap: 10 },

  orderCard: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, flexDirection: 'row', overflow: 'hidden' },
  orderSide: { width: 70, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: C.border },
  orderSideHash: { fontSize: 12, fontWeight: '700', marginBottom: -4, opacity: 0.6 },
  orderSideNum: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  orderInner: { flex: 1, padding: 14, gap: 8 },
  orderRow1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  chipTxt: { fontSize: 11, fontWeight: '600' },
  orderTime: { fontSize: 11, color: C.textMut, fontWeight: '600' },
  orderRow2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  nameBlock: { flex: 1 },
  studentN: { fontSize: 14, fontWeight: '700', color: C.textPri },
  gradeT: { fontSize: 11, color: C.textSec },
  orderTotal: { fontSize: 18, fontWeight: '900', color: C.textPri },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, marginTop: 4 },
  ctaTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },

  empty: { alignItems: 'center', paddingVertical: 64, gap: 10 },
  emptyT: { fontSize: 15, color: C.textSec, fontWeight: '500' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,2,18,0.85)' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, borderTopWidth: 1, borderColor: C.border, gap: 14 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.textMut, alignSelf: 'center', marginBottom: 4 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.textPri },
  sheetSub: { fontSize: 12, color: C.textSec, marginTop: 2 },
  stuRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarLg: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarLgL: { fontWeight: '700', fontSize: 20 },
  stuName: { fontSize: 16, fontWeight: '700', color: C.textPri },
  stuGrade: { fontSize: 13, color: C.textSec, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  qtyBox: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qtyTxt: { fontWeight: '700', fontSize: 12 },
  itemName: { flex: 1, color: C.textPri, fontSize: 14 },
  itemPrice: { color: C.textSec, fontSize: 14, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLbl: { fontSize: 13, color: C.textSec },
  totalVal: { fontSize: 24, fontWeight: '800', color: C.textPri, letterSpacing: -0.5 },
  statusPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statusOption: { width: '31%', paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.border, gap: 4 },
  statusOptionTxt: { fontSize: 10, fontWeight: '700' },
  statusOptionActive: { borderColor: 'transparent' },
  sheetActions: { flexDirection: 'row', gap: 10 },
  closeBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.cardHi, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  closeTxt: { color: C.textPri, fontWeight: '700', fontSize: 14 },
  nextBtn: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  nextTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
