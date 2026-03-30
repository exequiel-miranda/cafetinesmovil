import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '@/contexts/DrawerContext';

// ── Palette: Deep Violet (Fintech Premium) ─────────────────────
const C = {
  bg:         '#0E0B24',   // Ultra deep violet
  card:       '#1A1640',   // Card background
  cardHi:     '#231F52',   // Elevated card
  border:     '#2E2A62',
  purple:     '#7B5CF5',   // Primary purple
  purpleLight:'#9B7BFF',   
  purpleDim:  'rgba(123,92,245,0.18)',
  textPri:    '#FFFFFF',
  textSec:    '#9B96C8',
  textMut:    '#4A4580',
};

const STATS_PILLS = [
  { label: 'D', active: true },
  { label: 'W', active: false },
  { label: 'M', active: false },
  { label: 'Y', active: false },
];

export default function DashboardScreen() {
  const { openDrawer } = useDrawer();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.menuBtn} onPress={openDrawer}>
             <View style={s.menuLine} />
             <View style={[s.menuLine, { width: 14 }]} />
             <View style={s.menuLine} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Antares</Text>
          <View style={s.avatarContainer}>
             <View style={s.avatar} />
          </View>
        </View>

        {/* ── Balance Section ── */}
        <View style={s.balanceSection}>
           <Text style={s.balanceLabel}>Ventas del Día</Text>
           <Text style={s.balanceAmount}>$48.200,74</Text>
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
              <TouchableOpacity key={i} style={[s.pill, p.active && s.pillActive]}>
                <Text style={[s.pillText, p.active && s.pillTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.transactionList}>
           <Text style={s.dateLabel}>Hoy <MaterialIcons name="keyboard-arrow-down" size={14} /></Text>
           
           {[
             { name: 'Amazon Prime', category: 'Suscripción', amount: '-$9.99', icon: 'shopping-cart', color: '#FF9900' },
             { name: 'Apple Store', category: 'Apps & Music', amount: '-$142.82', icon: 'laptop', color: '#FFFFFF' },
             { name: 'Restaurante', category: 'Comida', amount: '-$32.16', icon: 'restaurant', color: '#00D2A3' },
             { name: 'Eventbrite', category: 'Eventos', amount: '-$82.49', icon: 'event', color: '#FF6B8A' },
           ].map((tx, i) => (
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

        {/* ── Summary Footer ── */}
        <View style={s.summaryContainer}>
           <Text style={s.summaryText}>Gasto Total: <Text style={s.summaryVal}>$324.19</Text></Text>
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

  summaryContainer: { paddingHorizontal: 24, paddingVertical: 20, alignItems: 'center' },
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
