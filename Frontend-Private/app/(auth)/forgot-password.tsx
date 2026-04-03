import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { apiPost } from '@/utils/api';

const C = {
  bg:         '#0E0B24',
  card:       '#1A1640',
  border:     '#2E2A62',
  purple:     '#7B5CF5',
  purpleLight:'#9B7BFF',
  orange:     '#FF8A65',
  textPri:    '#FFFFFF',
  textSec:    '#9B96C8',
  textMut:    '#4A4580',
  rose:       '#FF6B8A',
};

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();

  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert('Falta Correo', 'Ingresa tu correo electrónico para buscar tu cuenta.');
      return;
    }
    
    try {
      setLoading(true);
      await apiPost('/auth/forgot-password', { email: email.toLowerCase().trim() });
      Alert.alert('Solicitud Enviada', 'Se ha notificado al Administrador. Por favor, solicita el código de recuperación para continuar.');
      setStep(2);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      Alert.alert('Datos Incompletos', 'Por favor llena todos los campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Contraseña Débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    try {
      setLoading(true);
      await apiPost('/auth/reset-password', { 
        email: email.toLowerCase().trim(), 
        code, 
        newPassword 
      });
      
      Alert.alert('¡Éxito!', 'Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.', [
        { text: 'Aceptar', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'El código es inválido o ha expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.wrap}>
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={s.backBtn} onPress={() => step === 2 ? setStep(1) : router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={C.textPri} />
          </TouchableOpacity>

          <View style={s.header}>
            <MaterialIcons name="lock-reset" size={60} color={C.orange} style={{ marginBottom: 20 }} />
            <Text style={s.title}>Recuperación</Text>
            <Text style={s.subtitle}>
              {step === 1 ? 'Enviaremos una solicitud al administrador.' : 'Ingresa el código y tu nueva contraseña.'}
            </Text>
          </View>

          {step === 1 ? (
            <View style={s.form}>
              <Text style={s.label}>Correo Electrónico</Text>
              <View style={s.inputBox}>
                <MaterialIcons name="email" size={20} color={C.textSec} style={s.icon} />
                <TextInput 
                  style={s.input} 
                  placeholder="tu-correo@antares.com" 
                  placeholderTextColor={C.textMut} 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                  value={email} 
                  onChangeText={setEmail} 
                />
              </View>

              <TouchableOpacity style={s.primaryBtn} onPress={handleRequestCode} disabled={loading} activeOpacity={0.8}>
                <LinearGradient colors={[C.orange, '#FF7043']} start={{x:0, y:0}} end={{x:1, y:0}} style={s.btnGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Solicitar Código al Admin</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
             <View style={s.form}>
                <View style={s.infoNotice}>
                  <MaterialIcons name="info-outline" size={24} color={C.orange} />
                  <Text style={s.infoTxt}>Pide el código de 6 dígitos al administrador del sistema.</Text>
                </View>

                <Text style={s.label}>Código de Seguridad</Text>
                <View style={[s.inputBox, { height: 70, justifyContent: 'center' }]}>
                  <TextInput 
                    style={[s.input, { fontSize: 28, textAlign: 'center', letterSpacing: 8, fontWeight: '800', color: C.orange }]} 
                    placeholder="000000" 
                    placeholderTextColor={C.textMut} 
                    keyboardType="number-pad" 
                    maxLength={6}
                    value={code} 
                    onChangeText={setCode} 
                  />
                </View>

                <Text style={s.label}>Nueva Contraseña</Text>
                <View style={s.inputBox}>
                  <MaterialIcons name="lock" size={20} color={C.textSec} style={s.icon} />
                  <TextInput 
                    style={s.input} 
                    placeholder="••••••••" 
                    placeholderTextColor={C.textMut} 
                    secureTextEntry={!showPassword} 
                    value={newPassword} 
                    onChangeText={setNewPassword} 
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={C.textSec} />
                  </TouchableOpacity>
                </View>

                <Text style={s.label}>Confirmar Contraseña</Text>
                <View style={s.inputBox}>
                  <MaterialIcons name="lock-outline" size={20} color={C.textSec} style={s.icon} />
                  <TextInput 
                    style={s.input} 
                    placeholder="••••••••" 
                    placeholderTextColor={C.textMut} 
                    secureTextEntry={!showPassword} 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                  />
                </View>

                <TouchableOpacity style={s.primaryBtn} onPress={handleResetPassword} disabled={loading} activeOpacity={0.8}>
                  <LinearGradient colors={[C.purple, C.purpleLight]} start={{x:0, y:0}} end={{x:1, y:0}} style={s.btnGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Restablecer Contraseña</Text>}
                  </LinearGradient>
                </TouchableOpacity>
             </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  wrap: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: C.border },
  
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: C.textPri, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: C.textSec, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
  
  form: { width: '100%' },
  label: { color: C.textSec, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 16, marginBottom: 20, height: 56,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, color: C.textPri, fontSize: 16 },
  
  primaryBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
  btnGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  
  infoNotice: { flexDirection: 'row', backgroundColor: 'rgba(255,138,101,0.1)', padding: 16, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: C.orange, alignItems: 'center', gap: 12, marginBottom: 30 },
  infoTxt: { color: C.orange, flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },
});
