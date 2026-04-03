import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '@/contexts/DrawerContext';
import { apiGet } from '@/utils/api';

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

interface Supplier {
  _id: string;
  name: string;
  active: boolean;
  lastAmount?: number;
}

export default function ReportsScreen() {
  const { openDrawer } = useDrawer();
  const [loading, setLoading] = useState(true);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, suppliersRes] = await Promise.all([
        apiGet('/orders'),
        apiGet('/suppliers')
      ]);
      setOrders(ordersRes || []);
      setSuppliers(suppliersRes || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchData();
  }, []);

  // -- Cálculos Financieros --
  
  // Ingresos Brutos (Órdenes pagadas/confirmadas)
  const grossRevenue = orders.reduce((acc, order) => {
    if (order.status !== 'Cancelado' && order.status !== 'Pendiente de pago') {
      return acc + order.total;
    }
    return acc;
  }, 0);

  // Cuentas por Cobrar (Órdenes pendientes de pago)
  const accountsReceivable = orders.reduce((acc, order) => {
    if (order.status === 'Pendiente de pago') {
      return acc + order.total;
    }
    return acc;
  }, 0);

  // Egresos (Suma de los últimos montos gastados en proveedores)
  const expenses = suppliers.reduce((acc, sup) => acc + (sup.lastAmount || 0), 0);

  // Balance Neto
  const netBalance = grossRevenue - expenses;

  // -- Cálculos Operativos --
  const totalOrders = orders.length;
  const canceledOrders = orders.filter(o => o.status === 'Cancelado').length;
  const activeSuppliers = suppliers.filter(s => s.active).length;

  const maxBarValue = Math.max(grossRevenue, accountsReceivable, expenses, 1); // Evitar división por 0

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
          <Text style={s.headerTitle}>Reportes Financieros</Text>
          <MaterialIcons name="insert-chart" size={24} color={C.textSec} />
        </View>

        {loading ? (
             <View style={s.empty}><ActivityIndicator color={C.purple} size="large" /></View>
        ) : (
        <ScrollView 
          style={s.list} 
          contentContainerStyle={s.listInner} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={C.purple} />}
        >

          {/* Balance Neto Principal Card */}
          <View style={s.netBalanceCard}>
            <LinearGradient colors={[C.card, C.cardHi]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={s.netBalanceHeader}>
              <View style={[s.iconBox, { backgroundColor: netBalance >= 0 ? C.tealDim : C.roseDim }]}>
                <MaterialIcons name={netBalance >= 0 ? 'trending-up' : 'trending-down'} size={24} color={netBalance >= 0 ? C.teal : C.rose} />
              </View>
              <Text style={s.netBalanceTitle}>Balance Neto Actual</Text>
            </View>
            <Text style={[s.netBalanceAmount, { color: netBalance >= 0 ? C.teal : C.rose }]}>
              {netBalance >= 0 ? '+' : '-'}${Math.abs(netBalance).toLocaleString()}
            </Text>
            <View style={s.divider} />
            <Text style={s.netBalanceSub}>Basado en los registros históricos del sistema.</Text>
          </View>

          <Text style={s.sectionHeader}>Métricas Financieras</Text>

          {/* Tarjetas de Resumen (Grid 2 columnas) */}
          <View style={s.grid}>
            {/* Ingresos Brutos */}
            <View style={s.metricCard}>
              <View style={[s.metricIcon, { backgroundColor: C.tealDim }]}>
                <MaterialIcons name="attach-money" size={20} color={C.teal} />
              </View>
              <Text style={s.metricLabel}>Ingresos Brutos</Text>
              <Text style={s.metricValue}>${grossRevenue.toLocaleString()}</Text>
              <View style={[s.progressBarBg, { backgroundColor: C.tealDim }]}>
                <View style={[s.progressBarFill, { width: `${(grossRevenue / maxBarValue) * 100}%`, backgroundColor: C.teal }]} />
              </View>
            </View>

            {/* Egresos */}
            <View style={s.metricCard}>
              <View style={[s.metricIcon, { backgroundColor: C.roseDim }]}>
                <MaterialIcons name="local-shipping" size={20} color={C.rose} />
              </View>
              <Text style={s.metricLabel}>Egresos Proveedores</Text>
              <Text style={s.metricValue}>${expenses.toLocaleString()}</Text>
              <View style={[s.progressBarBg, { backgroundColor: C.roseDim }]}>
                <View style={[s.progressBarFill, { width: `${(expenses / maxBarValue) * 100}%`, backgroundColor: C.rose }]} />
              </View>
            </View>
            
            {/* Cuentas por Cobrar */}
            <View style={s.metricCardFull}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={s.metricLabel}>Cuentas por Cobrar (Pendientes)</Text>
                  <Text style={[s.metricValue, { color: C.amber, marginTop: 4 }]}>${accountsReceivable.toLocaleString()}</Text>
                </View>
                <View style={[s.metricIcon, { backgroundColor: C.amberDim }]}>
                  <MaterialIcons name="schedule" size={22} color={C.amber} />
                </View>
              </View>
              <View style={[s.progressBarBg, { backgroundColor: C.amberDim, marginTop: 16 }]}>
                <View style={[s.progressBarFill, { width: `${(accountsReceivable / maxBarValue) * 100}%`, backgroundColor: C.amber }]} />
              </View>
            </View>
          </View>


          <Text style={s.sectionHeader}>Rendimiento Operativo</Text>

          {/* Lista de Estadísticas Operativas */}
          <View style={s.statsListCard}>
            
            <View style={s.statRow}>
              <View style={s.statInfo}>
                <MaterialIcons name="receipt-long" size={20} color={C.purple} />
                <Text style={s.statLabel}>Total de Órdenes Procesadas</Text>
              </View>
              <Text style={s.statNumber}>{totalOrders}</Text>
            </View>
            <View style={s.statDivider} />

            <View style={s.statRow}>
              <View style={s.statInfo}>
                <MaterialIcons name="cancel" size={20} color={C.rose} />
                <Text style={s.statLabel}>Órdenes Canceladas</Text>
              </View>
              <Text style={[s.statNumber, { color: C.rose }]}>{canceledOrders}</Text>
            </View>
            <View style={s.statDivider} />

            <View style={s.statRow}>
              <View style={s.statInfo}>
                <MaterialIcons name="business" size={20} color={C.teal} />
                <Text style={s.statLabel}>Proveedores Activos</Text>
              </View>
              <Text style={s.statNumber}>{activeSuppliers} <Text style={{ color: C.textMut, fontSize: 13 }}>/ {suppliers.length}</Text></Text>
            </View>

          </View>

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
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 20 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPri, letterSpacing: 0.5 },
  menuBtn: { gap: 4, width: 40, height: 40, justifyContent: 'center' },
  menuLine: { width: 20, height: 2, backgroundColor: C.textPri, borderRadius: 1 },
  
  empty: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: 100 },
  
  list: { flex: 1 },
  listInner: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 20 },

  netBalanceCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  netBalanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  netBalanceTitle: { fontSize: 13, color: C.textSec, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  netBalanceAmount: { fontSize: 38, fontWeight: '900', letterSpacing: -1.5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  netBalanceSub: { fontSize: 12, color: C.textMut, fontWeight: '500' },

  sectionHeader: { fontSize: 15, fontWeight: '800', color: C.textPri, letterSpacing: 0.5, marginTop: 10, marginLeft: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  metricCard: {
    width: '48%',
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  metricCardFull: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  metricIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricLabel: { fontSize: 12, color: C.textSec, fontWeight: '600' },
  metricValue: { fontSize: 24, fontWeight: '800', color: C.textPri, letterSpacing: -0.5, marginTop: 6 },
  
  progressBarBg: { height: 6, width: '100%', borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  statsListCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statLabel: { fontSize: 14, color: C.textPri, fontWeight: '600' },
  statNumber: { fontSize: 18, fontWeight: '800', color: C.textPri },
  statDivider: { height: 1, backgroundColor: C.border, marginVertical: 16 },

});
