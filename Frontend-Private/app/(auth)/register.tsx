import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/utils/api';

const C = {
  bg:         '#0E0B24',
  card:       '#1A1640',
  border:     '#2E2A62',
  purple:     '#7B5CF5',
  purpleLight:'#9B7BFF',
  teal:       '#00D2A3',
  textPri:    '#FFFFFF',
  textSec:    '#9B96C8',
  textMut:    '#4A4580',
  rose:       '#FF6B8A',
};

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();
  const router = useRouter();

  const handleRequestCode = async () => {
    if (!name || !email || !password) {
      Alert.alert('Faltan Datos', 'Por favor llena todos los campos iniciales.');
      return;
    }
    
    try {
      setLoading(true);
      await apiPost('/auth/request-admin-code', { email: email.toLowerCase().trim() });
      Alert.alert('Código Solicitado', 'Se ha enviado un correo al Administrador para aprobar esta cuenta.');
      setStep(2); // Avanzar a validación de código
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo contactar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!code) {
      Alert.alert('Falta Código', 'Ingresa el código proporcionado por el Administrador.');
      return;
    }
    
    try {
      setLoading(true);
      const res = await apiPost('/auth/register', { 
        name, 
        email: email.toLowerCase().trim(), 
        password, 
        code 
      });
      
      if (res.token) {
        Alert.alert('¡Éxito!', 'Tu cuenta ha sido creada y verificada.');
        signIn(res, res.token);
      }
    } catch (e: any) {
      Alert.alert('Error de Registro', e.message || 'Código inválido o error en la red.');
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
            <MaterialIcons name="security" size={60} color={C.teal} style={{ marginBottom: 20 }} />
            <Text style={s.title}>Acceso Seguro</Text>
            <Text style={s.subtitle}>
              {step === 1 ? 'Solicita tu cuenta administrativa.' : 'Introduce la clave enviada al Administrador.'}
            </Text>
          </View>

          {step === 1 ? (
            <View style={s.form}>
              <Text style={s.label}>Nombre Fiel</Text>
              <View style={s.inputBox}>
                <MaterialIcons name="person" size={20} color={C.textSec} style={s.icon} />
                <TextInput style={s.input} placeholder="Juan Pérez" placeholderTextColor={C.textMut} value={name} onChangeText={setName} />
              </View>

              <Text style={s.label}>Correo Electrónico</Text>
              <View style={s.inputBox}>
                <MaterialIcons name="email" size={20} color={C.textSec} style={s.icon} />
                <TextInput style={s.input} placeholder="correo@antares.com" placeholderTextColor={C.textMut} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              </View>

              <Text style={s.label}>Contraseña a Guardar</Text>
              <View style={s.inputBox}>
                <MaterialIcons name="lock" size={20} color={C.textSec} style={s.icon} />
                <TextInput style={s.input} placeholder="Crea una contraseña segura" placeholderTextColor={C.textMut} secureTextEntry value={password} onChangeText={setPassword} />
              </View>

              <TouchableOpacity style={s.primaryBtn} onPress={handleRequestCode} disabled={loading} activeOpacity={0.8}>
                <LinearGradient colors={[C.teal, '#00BFA5']} start={{x:0, y:0}} end={{x:1, y:0}} style={s.btnGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Peticionar Acceso al Admin</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
             <View style={s.form}>
                <View style={s.codeNotice}>
                  <MaterialIcons name="info-outline" size={24} color={C.teal} />
                  <Text style={s.codeTxt}>El código se envió al correo privado del Administrador para su validación.</Text>
                </View>

                <Text style={s.label}>Código de Fichaje (OTP)</Text>
                <View style={[s.inputBox, { height: 70, justifyContent: 'center' }]}>
                  <TextInput 
                    style={[s.input, { fontSize: 28, textAlign: 'center', letterSpacing: 8, fontWeight: '800', color: C.teal }]} 
                    placeholder="000000" 
                    placeholderTextColor={C.textMut} 
                    keyboardType="number-pad" 
                    maxLength={6}
                    value={code} 
                    onChangeText={setCode} 
                  />
                </View>

                <TouchableOpacity style={s.primaryBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
                  <LinearGradient colors={[C.purple, C.purpleLight]} start={{x:0, y:0}} end={{x:1, y:0}} style={s.btnGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Validar y Entrar</Text>}
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
  subtitle: { fontSize: 15, color: C.textSec, marginTop: 10, textAlign: 'center' },
  
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
  
  codeNotice: { flexDirection: 'row', backgroundColor: 'rgba(0,210,163,0.1)', padding: 16, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: C.teal, alignItems: 'center', gap: 12, marginBottom: 30 },
  codeTxt: { color: C.teal, flex: 1, fontSize: 13, lineHeight: 20 },
});
