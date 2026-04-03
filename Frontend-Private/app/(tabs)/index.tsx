import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, ActivityIndicator, Dimensions,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from "react-native-gifted-charts";
import { useDrawer } from '@/contexts/DrawerContext';
import { apiGet } from '@/utils/api';

const { width } = Dimensions.get('window');

// ── Palette: Deep Violet (Fintech Premium) ─────────────────────
const C = {
  bg:         '#0E0B24',   // Ultra deep violet
  card:       '#1A1640',   // Card background
  cardHi:     '#231F52',   // Elevated card
  border:     '#2E2A62',
  purple:     '#7B5CF5',   // Primary purple
  purpleLight:'#9B7BFF',   
  purpleDim:  'rgba(123,92,245,0.18)',
  gold:       '#D4AF37',
  goldDim:    'rgba(212,175,55,0.15)',
  rose:       '#FF6B8A',
  roseDim:    'rgba(255,107,138,0.15)',
  teal:       '#00D2A3',
  textPri:    '#FFFFFF',
  textSec:    '#9B96C8',
  textMut:    '#4A4580',
};

const STATS_PILLS = [
  { label: 'D', key: 'D' },
  { label: 'S', key: 'S' },
  { label: 'M', key: 'M' },
  { label: 'A', key: 'A' },
];

export default function DashboardScreen() {
  const { openDrawer } = useDrawer();
  const [loadingChart, setLoadingChart] = useState(true);
  
  const [chartData, setChartData] = useState({
    ingresos: [] as any[],
    egresos: [] as any[],
  });
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'D' | 'S' | 'M' | 'A'>('D');
  const [debug, setDebug] = useState({ orders: 0, suppliers: 0, showing: false, lastOrderDate: '', lastSupPurchase: '' });

  useFocusEffect(
    useCallback(() => {
      fetchChartData();
    }, [selectedRange])
  );

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getLocalDateString = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const parseDMY = (s: string) => {
    if (!s) return null;
    const parts = s.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  };

  const fetchChartData = async () => {
    try {
      if (!refreshing) setLoadingChart(true);
      const [ordersRes, suppliersRes] = await Promise.all([
        apiGet('/orders').catch(() => []),
        apiGet('/suppliers').catch(() => [])
      ]);
      
      const orders = (ordersRes || []).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const suppliers = suppliersRes || [];
      const today = new Date();
      
      let ingresosData: any[] = [];
      let egresosData: any[] = [];
      let sumVentas = 0;
      let sumGastos = 0;

      if (selectedRange === 'D') {
        const hours = ['6am', '10am', '2pm', '6pm', '10pm'];
        ingresosData = hours.map(h => ({ value: 0, label: h }));
        egresosData = hours.map(h => ({ value: 0, label: h }));
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        orders.forEach((o: any) => {
          const d = new Date(o.createdAt);
          if (o.status !== 'Cancelado' && d >= oneDayAgo) {
            const hour = d.getHours();
            let idx = 0;
            if (hour < 10) idx = 0; else if (hour < 14) idx = 1; else if (hour < 18) idx = 2; else if (hour < 22) idx = 3; else idx = 4;
            const total = Number(o.total) || 0;
            ingresosData[idx].value += total;
            sumVentas += total;
          }
        });

        suppliers.forEach((s: any) => {
          if (s.lastPurchase === getLocalDateString(today) && s.lastAmount) {
            const amount = Number(s.lastAmount) || 0;
            let idx = 1; 
            if (s.updatedAt) {
              const hour = new Date(s.updatedAt).getHours();
              if (hour < 10) idx = 0; else if (hour < 14) idx = 1; else if (hour < 18) idx = 2; else if (hour < 22) idx = 3; else idx = 4;
            }
            egresosData[idx].value += amount;
            sumGastos += amount;
          }
        });

      } else if (selectedRange === 'S') {
        const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
        ingresosData = days.map(d => ({ value: 0, label: d }));
        egresosData = days.map(d => ({ value: 0, label: d }));

        // Get Monday of current week
        const monday = new Date(today);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
        monday.setDate(diff);
        monday.setHours(0,0,0,0);

        orders.forEach((o: any) => {
          const d = new Date(o.createdAt);
          if (o.status !== 'Cancelado' && d >= monday) {
             let dayIdx = d.getDay(); // 0 is Sun, 1 is Mon
             let idx = dayIdx === 0 ? 6 : dayIdx - 1; 
             const total = Number(o.total) || 0;
             ingresosData[idx].value += total;
             sumVentas += total;
          }
        });

        suppliers.forEach((s: any) => {
            const d = parseDMY(s.lastPurchase);
            if (d && d >= monday && s.lastAmount) {
               let dayIdx = d.getDay();
               let idx = dayIdx === 0 ? 6 : dayIdx - 1;
               const amount = Number(s.lastAmount) || 0;
               egresosData[idx].value += amount;
               sumGastos += amount;
            }
        });

      } else if (selectedRange === 'M') {
        const blocks = ['1-5', '6-10', '11-15', '16-20', '21-25', '26+'];
        ingresosData = blocks.map(b => ({ value: 0, label: b }));
        egresosData = blocks.map(b => ({ value: 0, label: b }));

        orders.forEach((o: any) => {
          const d = new Date(o.createdAt);
          if (o.status !== 'Cancelado' && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
             let dayNum = d.getDate();
             let idx = Math.min(5, Math.floor((dayNum - 1) / 5));
             const total = Number(o.total) || 0;
             ingresosData[idx].value += total;
             sumVentas += total;
          }
        });

        suppliers.forEach((s: any) => {
            const d = parseDMY(s.lastPurchase);
            if (d && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && s.lastAmount) {
               let dayNum = d.getDate();
               let idx = Math.min(5, Math.floor((dayNum - 1) / 5));
               const amount = Number(s.lastAmount) || 0;
               egresosData[idx].value += amount;
               sumGastos += amount;
            }
        });
      } else if (selectedRange === 'A') {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        ingresosData = months.map(m => ({ value: 0, label: m }));
        egresosData = months.map(m => ({ value: 0, label: m }));

        orders.forEach((o: any) => {
          const d = new Date(o.createdAt);
          if (o.status !== 'Cancelado' && d.getFullYear() === today.getFullYear()) {
             let idx = d.getMonth();
             const total = Number(o.total) || 0;
             ingresosData[idx].value += total;
             sumVentas += total;
          }
        });

        suppliers.forEach((s: any) => {
            const d = parseDMY(s.lastPurchase);
            if (d && d.getFullYear() === today.getFullYear() && s.lastAmount) {
               let idx = d.getMonth();
               const amount = Number(s.lastAmount) || 0;
               egresosData[idx].value += amount;
               sumGastos += amount;
            }
        });
      }

      setChartData({ ingresos: [...ingresosData], egresos: [...egresosData] });
      setTotalVentas(sumVentas);
      setTotalGastos(sumGastos);
      setDebug(prev => ({ 
        ...prev, 
        orders: orders.length, 
        suppliers: suppliers.length,
        lastOrderDate: orders[0] ? getLocalDateString(new Date(orders[0].createdAt)) : 'None',
        lastSupPurchase: suppliers.find((sp: any) => sp.lastPurchase)?.lastPurchase || 'None'
      }));
      
      const last5 = orders
        .filter((o: any) => o.status !== 'Cancelado')
        .slice(0, 5)
        .map((o: any) => ({
          name: `Orden #${o.orderNumber || o._id.slice(-4)}`,
          category: o.source || 'Pedido',
          amount: `$${o.total.toLocaleString()}`,
          icon: o.source === 'Almuerzos' ? 'restaurant' : 'shopping-cart',
          color: o.source === 'Almuerzos' ? C.teal : C.purple,
          date: o.createdAt
        }));
      setRecentTransactions(last5);

    } catch (e) {
      console.log('Error fetching chart data', e);
    } finally {
      setLoadingChart(false);
      setRefreshing(false);
    }
  };

  const currentMax = Math.max(
    ...chartData.ingresos.map(d => d.value),
    ...chartData.egresos.map(d => d.value),
    10 // Minimum 10 to avoid flat lines if 0
  );
  const paddedMax = currentMax * 1.25;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChartData();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.menuBtn} onPress={openDrawer}>
             <View style={s.menuLine} />
             <View style={[s.menuLine, { width: 14 }]} />
             <View style={s.menuLine} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDebug(p => ({ ...p, showing: !p.showing }))} activeOpacity={1}>
            <Text style={s.headerTitle}>Antares</Text>
          </TouchableOpacity>
          <View style={s.avatarContainer}>
             <View style={s.avatar} />
          </View>
        </View>

        {/* ── Balance Section ── */}
        <View style={s.balanceSection}>
           <Text style={s.balanceLabel}>
             {selectedRange === 'D' ? 'Ventas Hoy' :
              selectedRange === 'S' ? 'Ventas Semana' :
              selectedRange === 'M' ? 'Ventas Mes' : 'Ventas Año'}
           </Text>
           <Text style={s.balanceAmount}>${totalVentas.toLocaleString()}</Text>
        </View>

        {/* ── Action Buttons ── */}
        <View style={s.actionGrid}>
           {[
             { name: 'Transfer', icon: 'swap-horiz' },
             { name: 'Deposit', icon: 'account-balance-wallet' },
             { name: 'Send', icon: 'send' },
             { name: 'Request', icon: 'call-received' }
           ].map((action, i) => (
             <TouchableOpacity key={i} style={s.actionItem}>
               <View style={s.actionCircle}>
                  <MaterialIcons name={action.icon as any} size={22} color={C.textPri} />
               </View>
               <Text style={s.actionText}>{action.name}</Text>
             </TouchableOpacity>
           ))}
        </View>

        {/* ── Transactions Section ── */}
        <View style={s.transactionsHeader}>
          <Text style={s.sectionTitle}>Transacciones</Text>
          <View style={s.pillSelector}>
            {STATS_PILLS.map((p, i) => (
              <TouchableOpacity 
                key={i} 
                style={[s.pill, selectedRange === p.key && s.pillActive]}
                onPress={() => setSelectedRange(p.key as any)}
              >
                <Text style={[s.pillText, selectedRange === p.key && s.pillTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.transactionList}>
           <Text style={s.dateLabel}>Recientes <MaterialIcons name="keyboard-arrow-down" size={14} /></Text>
           
           {recentTransactions.length === 0 ? (
             <Text style={{ color: C.textMut, textAlign: 'center', marginVertical: 20 }}>Sin movimientos hoy</Text>
           ) : recentTransactions.map((tx, i) => (
             <TouchableOpacity key={i} style={s.txItem}>
               <View style={[s.txIcon, { backgroundColor: C.cardHi }]}>
                  <MaterialIcons name={tx.icon as any} size={18} color={tx.color} />
               </View>
               <View style={s.txInfo}>
                  <Text style={s.txName}>{tx.name}</Text>
                  <Text style={s.txCat}>{tx.category}</Text>
               </View>
               <Text style={s.txAmount}>{tx.amount}</Text>
             </TouchableOpacity>
           ))}
        </View>

        {/* ── Real Trend Chart Section (GOLD) ── */}
        <View style={s.chartHeader}>
           <Text style={s.chartSectionTitle}>Tendencia Real (VIP)</Text>
           <MaterialIcons name="auto-graph" size={20} color={C.gold} />
        </View>
        
        <View style={s.chartContainer}>
           {loadingChart ? (
             <View style={s.chartLoader}><ActivityIndicator size="small" color={C.gold} /></View>
           ) : (
              <View style={{ paddingRight: 20 }}>
                <LineChart
                  data={chartData.ingresos}
                  data2={chartData.egresos}
                  height={160}
                  width={width - 80}
                  maxValue={paddedMax}
                  initialSpacing={20}
                  spacing={ (width - 120) / (chartData.ingresos.length - 1) }
                  color1={C.gold}
                  color2={C.rose}
                  thickness1={3}
                  thickness2={3}
                  hideDataPoints={false}
                  dataPointsColor1={C.gold}
                  dataPointsColor2={C.rose}
                  dataPointsRadius={3}
                  curved
                  curvature={0.2}
                  isAnimated
                  animationDuration={1500}
                  areaChart
                  hideRules
                  yAxisThickness={0}
                  xAxisThickness={0}
                  
                  // Fill Ingresos (Gold)
                  startFillColor1={C.gold}
                  startOpacity1={0.2}
                  endOpacity1={0.01}
                  
                  // Fill Egresos (Rose)
                  startFillColor2={C.rose}
                  startOpacity2={0.15}
                  endOpacity2={0.01}
                  
                  pointerConfig={{
                    autoAdjustPointerLabelPosition: true,
                    pointerStripUptoDataPoint: true,
                    pointerStripColor: C.gold + '40',
                    pointerStripWidth: 2,
                    strokeDashArray: [2, 5],
                    pointerColor: C.textPri,
                    radius: 4,
                    pointerLabelWidth: 100,
                    pointerLabelHeight: 50,
                    shiftPointerLabelX: -40,
                    shiftPointerLabelY: -50,
                    pointerLabelComponent: (items: any) => {
                      return (
                        <View style={{
                          backgroundColor: C.cardHi,
                          padding: 10,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: C.border,
                          width: 100,
                          elevation: 10,
                          shadowColor: '#000',
                          shadowOpacity: 0.3,
                          shadowRadius: 5,
                        }}>
                          <Text style={{ color: C.gold, fontSize: 10, fontWeight: '900' }}>
                             ${Number(items[0].value).toLocaleString()}
                          </Text>
                          {items[1] && (
                            <Text style={{ color: C.rose, fontSize: 10, fontWeight: '900', marginTop: 2 }}>
                               ${Number(items[1].value).toLocaleString()}
                            </Text>
                          )}
                        </View>
                      );
                    },
                  }}

                  yAxisTextStyle={{ color: C.textMut, fontSize: 8 }}
                  yAxisLabelWidth={30}
                  xAxisLabelTextStyle={{ color: C.textMut, fontSize: 9 }}
                  noOfSections={3}
                  rulesColor="rgba(255,255,255,0.03)"
                />
               <View style={s.legendRow}>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, {backgroundColor: C.gold}]} />
                    <Text style={s.legendText}>Ingresos</Text>
                  </View>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, {backgroundColor: C.rose}]} />
                    <Text style={s.legendText}>Egresos</Text>
                  </View>
               </View>
             </View>
           )}
        </View>

        {/* ── Summary Footer ── */}
        <View style={s.summaryContainer}>
           <Text style={s.summaryText}>
              Gasto Total Periodo: <Text style={s.summaryVal}>${totalGastos.toLocaleString()}</Text>
           </Text>
           <View style={s.summaryButtons}>
              <TouchableOpacity style={[s.summaryBtn, s.summaryBtnActive]}>
                 <Text style={s.summaryBtnText}>Ventas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.summaryBtn}>
                 <Text style={s.summaryBtnText}>Gastos</Text>
              </TouchableOpacity>
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

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
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 2,
  },
  avatar: { flex: 1, borderRadius: 18, backgroundColor: C.cardHi },

  balanceSection: { alignItems: 'center', marginVertical: 20 },
  balanceLabel: { fontSize: 12, color: C.textSec, marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: C.textPri, letterSpacing: -1 },

  actionGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 28, 
    marginVertical: 20 
  },
  actionItem: { alignItems: 'center', gap: 10 },
  actionCircle: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  actionText: { fontSize: 11, color: C.textSec, fontWeight: '500' },

  transactionsHeader: { 
    paddingHorizontal: 24, 
    marginVertical: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: C.textPri },
  pillSelector: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 12 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  pillActive: { backgroundColor: C.purple },
  pillText: { fontSize: 12, color: C.textSec, fontWeight: '600' },
  pillTextActive: { color: C.textPri },

  transactionList: { paddingHorizontal: 24 },
  dateLabel: { fontSize: 13, color: C.textSec, marginBottom: 16, fontWeight: '600' },
  txItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    padding: 12, 
    borderRadius: 16, 
    marginBottom: 12 
  },
  txIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, marginLeft: 16 },
  txName: { fontSize: 15, fontWeight: '700', color: C.textPri },
  txCat: { fontSize: 11, color: C.textSec, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', color: C.textPri },

  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, marginTop: 30, marginBottom: 16 },
  chartSectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPri },
  chartContainer: { marginHorizontal: 24, paddingTop: 40, paddingBottom: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, borderWidth: 1, borderColor: C.border },
  chartLoader: { height: 160, justifyContent: 'center', alignItems: 'center' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: C.textSec, fontSize: 11, fontWeight: '600' },

  summaryContainer: { paddingHorizontal: 24, paddingVertical: 24, alignItems: 'center' },
  summaryText: { fontSize: 14, color: C.textSec, marginBottom: 20 },
  summaryVal: { color: C.textPri, fontWeight: '700' },
  summaryButtons: { 
    flexDirection: 'row', 
    gap: 12, 
    width: '100%', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 6, 
    borderRadius: 16 
  },
  summaryBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  summaryBtnActive: { backgroundColor: C.purple },
  summaryBtnText: { color: C.textPri, fontWeight: '700', fontSize: 14 },
});
