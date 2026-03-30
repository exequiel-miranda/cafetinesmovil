import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { DrawerProvider } from '@/contexts/DrawerContext';
import AppDrawer from '@/components/ui/AppDrawer';

const AdminTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background:   '#0E0B24',  // deep violet base
    card:         '#1A1640',
    border:       '#2E2A62',
    primary:      '#7B5CF5',  // vivid purple
    text:         '#FFFFFF',
    notification: '#FF6B8A',
  },
};

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  return (
    <ThemeProvider value={AdminTheme}>
      <DrawerProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <AppDrawer />
        <StatusBar style="light" />
      </DrawerProvider>
    </ThemeProvider>
  );
}
