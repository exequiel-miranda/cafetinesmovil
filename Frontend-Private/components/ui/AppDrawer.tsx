import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const C = {
  bg: '#0E0B24',
  card: '#1A1640',
  border: '#2E2A62',
  purple: '#7B5CF5',
  purpleLight: '#9B7BFF',
  purpleDim: 'rgba(123,92,245,0.15)',
  textPri: '#FFFFFF',
  textSec: '#9B96C8',
  textMut: '#4A4580',
  gold: '#D4AF37',
  teal: '#00D2A3',
  amber: '#FFB038',
  rose: '#FF6B8A',
};

const MENU_SECTIONS = [
  {
    section: 'Operaciones', items: [
      { label: 'Dashboard', icon: 'dashboard', color: C.purple },
      { label: 'Pedidos en Vivo', icon: 'room-service', color: C.teal, href: '/live' },
      { label: 'Menú de Comidas', icon: 'restaurant-menu', color: C.amber },
      { label: 'Gestión de Menú', icon: 'menu-book', color: C.amber, href: '/menu-management' },
    ]
  },
  {
    section: 'Administración VIP', items: [
      { label: 'Gestión de Categorías', icon: 'category', color: C.teal, href: '/categories' },
      { label: 'Saldos de Apoderados', icon: 'account-balance-wallet', color: C.gold },
      { label: 'Reportes Financieros', icon: 'insert-chart', color: C.textPri, href: '/reports' },
      { label: 'Proveedores', icon: 'local-shipping', color: C.textPri, href: '/suppliers' },
      { label: 'Staff', icon: 'badge', color: C.textPri, href: '/staff' },
    ]
  },
  {
    section: 'Sistema', items: [
      { label: 'Ajustes VIP', icon: 'settings', color: C.textSec, href: '/settings' },
      { label: 'Cerrar Sesión', icon: 'logout', color: C.rose, action: 'LOGOUT' }
    ]
  }
];

export default function AppDrawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const { signOut } = useAuth();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets(); // Get dynamic top padding for different phones

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isOpen ? 0 : -DRAWER_WIDTH,
        useNativeDriver: true,
        bounciness: 0,     // No bounce, just snappy slide
        speed: 24,         // Ultra fast response to feel instantaneous
      }),
      Animated.timing(fadeAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 200,     // Quick fade
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  return (
    <View style={s.overlayContainer} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeDrawer} />
      </Animated.View>

      {/* Drawer Panel */}
      <Animated.View style={[s.drawerPanel, { transform: [{ translateX: slideAnim }] }]}>

        {/* Dynamic Safe Area Padding */}
        <View style={{ flex: 1, paddingTop: Math.max(insets.top + 10, 40) }}>

          {/* Header */}
          <View style={s.drawerHeader}>
            <TouchableOpacity
              style={s.closeIconBtn}
              onPress={closeDrawer}
              activeOpacity={0.7}
            >
              <MaterialIcons name="keyboard-arrow-left" size={28} color={C.textPri} />
            </TouchableOpacity>
            <View>
              <Text style={s.brandTitle}>Antares VIP</Text>
              <Text style={s.brandSubtitle}>Admin Dashboard</Text>
            </View>
          </View>

          {/* Sectioned Scrollable List */}
          <ScrollView style={s.menuScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
            {MENU_SECTIONS.map((section, idx) => (
              <View key={idx} style={s.section}>
                <Text style={s.sectionTitle}>{section.section}</Text>

                {section.items.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.menuItem}
                    onPress={() => {
                      closeDrawer();
                      if ((item as any).action === 'LOGOUT') {
                        signOut();
                      } else if ((item as any).href) {
                        router.push((item as any).href);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={s.iconBox}>
                      <MaterialIcons name={item.icon as any} size={22} color={item.color} />
                    </View>
                    <Text style={s.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={s.drawerFooter}>
            <Text style={s.versionText}>Antares Management v1.2</Text>
            <Text style={s.schoolText}>Colegio Internacional</Text>
          </View>

        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawerPanel: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: C.bg, // Solid color here
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    // Removed bottom border
  },
  closeIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginLeft: -8, // Offset slightly to align the chevron visually with the layout
  },
  brandTitle: {
    color: C.textPri,
    fontSize: 20, // slightly bigger header text
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: C.textSec,
    fontSize: 13,
  },
  menuScroll: {
    flex: 1,
  },
  section: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMut,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14, // more vertical padding
    paddingHorizontal: 24,
  },
  iconBox: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    color: C.textPri,
    fontSize: 17, // Larger text as requested
    fontWeight: '600',
    flex: 1,
  },
  drawerFooter: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  versionText: {
    color: C.textMut,
    fontSize: 12,
    fontWeight: '600',
  },
  schoolText: {
    color: 'rgba(255,255,255,0.1)',
    fontSize: 11,
    marginTop: 4,
  },
});
