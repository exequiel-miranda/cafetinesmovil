import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/utils/api';
import { AppModal, AppModalAction } from '@/components/ui/AppModal';

const C = {
  bg: '#0E0B24',
  card: '#1A1640',
  cardHi: '#231F52',
  border: '#2E2A62',
  purple: '#7B5CF5',
  purpleLight: '#9B7BFF',
  textPri: '#FFFFFF',
  textSec: '#9B96C8',
  textMut: '#4A4580',
  rose: '#FF6B8A',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'confirm';
    actions: AppModalAction[];
    icon?: keyof typeof MaterialIcons.glyphMap;
    centered?: boolean;
  }>({
    visible: false, title: '', message: '', type: 'info', actions: [], centered: true
  });

  const showAlert = (cfg: Omit<typeof alert, 'visible'>) => setAlert({ ...cfg, visible: true });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert({
        title: 'Datos Incompletos',
        message: 'Por favor ingresa tu correo y contraseña para continuar.',
        type: 'confirm',
        icon: 'info-outline',
        centered: true,
        actions: [{ label: 'Revisar', onPress: hideAlert }]
      });
      return;
    }

    try {
      console.log('Attempting login for:', email.toLowerCase().trim());
      setLoading(true);
      const res = await apiPost('/auth/login', { email: email.toLowerCase().trim(), password });

      console.log('Login Response successfully received:', res);

      if (res.token) {
        signIn(res, res.token);
      } else {
        console.warn('Login response missing token');
        showAlert({
          title: 'Error de Acceso',
          message: 'Credenciales inválidas o falla en la respuesta del servidor.',
          type: 'error',
          icon: 'error-outline',
          centered: true,
          actions: [{ label: 'Cerrar', onPress: hideAlert }]
        });
      }
    } catch (e: any) {
      console.error('Login error caught in UI:', e);
      showAlert({
        title: 'Error de Autenticación',
        message: e.message || 'Correo o contraseña incorrectos.',
        type: 'error',
        icon: 'lock-outline',
        centered: true,
        actions: [{ label: 'Cerrar', onPress: hideAlert }]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.wrap}>

        <View style={s.header}>
          <MaterialIcons name="admin-panel-settings" size={60} color={C.purple} style={{ marginBottom: 20 }} />
          <Text style={s.title}>Antares VIP</Text>
          <Text style={s.subtitle}>Ingresa a tu cuenta de administración.</Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>Correo Electrónico</Text>
          <View style={s.inputBox}>
            <MaterialIcons name="email" size={20} color={C.textSec} style={s.icon} />
            <TextInput
              style={s.input}
              placeholder="admin@antares-vip.com"
              placeholderTextColor={C.textMut}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={s.label}>Contraseña</Text>
          <View style={s.inputBox}>
            <MaterialIcons name="lock" size={20} color={C.textSec} style={s.icon} />
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={C.textMut}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn} activeOpacity={0.7}>
              <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={showPassword ? C.purple : C.textMut} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={[C.purple, C.purpleLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Iniciar Sesión</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.forgotBtn} 
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={s.forgotTxt}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerTxt}>¿No tienes acceso? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity><Text style={s.footerLink}>Crea una cuenta</Text></TouchableOpacity>
            </Link>
          </View>
        </View>

      </KeyboardAvoidingView>

      <AppModal {...alert} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  wrap: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: C.textPri, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: C.textSec, marginTop: 10 },

  form: { width: '100%' },
  label: { color: C.textSec, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, color: C.textPri, fontSize: 16 },
  eyeBtn: { padding: 4, marginLeft: 8 },

  loginBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
  btnGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerTxt: { color: C.textSec, fontSize: 14 },
  footerLink: { color: C.purpleLight, fontSize: 14, fontWeight: '700' },

  forgotBtn: { marginTop: 15, alignSelf: 'center' },
  forgotTxt: { color: C.textMut, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});
