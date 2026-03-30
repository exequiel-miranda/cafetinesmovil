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
        tabBarActiveTintColor: '#7B5CF5',   // vivid purple
        tabBarInactiveTintColor: '#4A4580', // muted
        tabBarStyle: {
          backgroundColor: '#1A1640',       // card surface
          borderTopColor: '#2E2A62',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 70, // Adjust for iOS safe area
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 8,                    // Add top padding
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
    top: -8,                // Sit correctly above the icon based on padding
    width: 32,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  iconWrapper: {
    marginTop: 0,          
  },
});
