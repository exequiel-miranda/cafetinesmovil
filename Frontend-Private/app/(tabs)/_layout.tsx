import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

// ── Custom Tab Bar Icon with Line Above ────────────────────────
function TabIcon({ name, color, focused }: { name: string, color: string, focused: boolean }) {
  return (
    <View style={s.iconContainer}>
      {/* Active Line (only shows when focused) */}
      {focused && <View style={[s.activeLine, { backgroundColor: color }]} />}
      
      <View style={s.iconWrapper}>
        <IconSymbol size={24} name={name as any} color={color} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#FFFFFF',   // Pure white
        tabBarInactiveTintColor: '#8B7AE0', // Soft purple for inactivity
        tabBarStyle: {
          backgroundColor: '#1A1640',       // card surface
          borderTopWidth: 0,                // Remove physical border
          elevation: 0,                     // Remove Android shadow
          shadowOpacity: 0,                 // Remove iOS shadow
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',                // Slightly bolder for contrast
          letterSpacing: 0.2,
          marginTop: 2,                     // Positive margin so it doesn't overlap with icons
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chart.bar.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cube.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Comida',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="fork.knife" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="list.bullet.clipboard.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  activeLine: {
    position: 'absolute',
    top: -8,                
    width: 32,
    height: 2,              // Made it thinner
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconWrapper: {
    marginTop: 0,          
  },
});
