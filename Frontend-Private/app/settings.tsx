import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, StatusBar, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPatch } from '@/utils/api';
import { AppModal, AppModalAction } from '@/components/ui/AppModal';

const C = {
  bg:         '#0E0B24',
  card:       '#1A1640',
  cardHi:     '#231F52',
  border:     '#2E2A62',
  purple:     '#7B5CF5',
  purpleLight:'#9B7BFF',
  purpleDim:  'rgba(123,92,245,0.15)',
  textPri:    '#FFFFFF',
  textSec:    '#9B96C8',
  textMut:    '#4A4580',
  teal:       '#00D2A3',
  rose:       '#FF6B8A',
  amber:      '#FFB038',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateUserData } = useAuth();
  
  // Local User State
  const [name, setName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // System Config State
  const [config, setConfig] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    adminContactEmail: '',
    orderNotifications: true,
    appVersion: '1.2.0',
    schoolName: 'Antares VIP'
  });

  // App Preferences (Local only for now)
  const [language, setLanguage] = useState('Español');
  const [compactMode, setCompactMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'confirm';
    actions: AppModalAction[];
    icon?: keyof typeof MaterialIcons.glyphMap;
  }>({ visible: false, title: '', message: '', type: 'info', actions: [] });

  const showAlert = (cfg: Omit<typeof alert, 'visible'>) => setAlert({ ...cfg, visible: true });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/config');
      if (res.data) setConfig(res.data);
    } catch (e) {
      console.error('Error fetching config:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) return;
    try {
      setSaving(true);
      const res = await apiPatch('/auth/profile', { userId: user?._id, name: name.trim() });
      if (res.ok) {
        updateUserData(res.data);
        showAlert({ title: 'Éxito', message: 'Perfil actualizado correctamente.', type: 'success', icon: 'check-circle', actions: [{label: 'Aceptar', onPress: hideAlert}] });
      }
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message || 'No se pudo actualizar el perfil.', type: 'error', actions: [{label: 'Cerrar', onPress: hideAlert}] });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      showAlert({ title: 'Error', message: 'Las contraseñas no coinciden.', type: 'error', actions: [{label: 'Revisar', onPress: hideAlert}] });
      return;
    }
    if (newPassword.length < 6) {
      showAlert({ title: 'Seguridad', message: 'La contraseña debe tener al menos 6 caracteres.', type: 'info', actions: [{label: 'Entendido', onPress: hideAlert}] });
      return;
    }
    try {
      setSaving(true);
      await apiPatch('/auth/profile', { userId: user?._id, password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      showAlert({ title: 'Seguridad Actualizada', message: 'Tu contraseña ha sido cambiada.', type: 'success', icon: 'lock-outline', actions: [{label: 'Aceptar', onPress: hideAlert}] });
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message || 'No se pudo cambiar la contraseña.', type: 'error', actions: [{label: 'Cerrar', onPress: hideAlert}] });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfig = async (key: string, value: any) => {
    try {
      const newConfig = { ...config, [key]: value };
      setConfig(newConfig);
      await apiPatch('/config', { [key]: value });
    } catch (e) {
       console.error('Error updating config', e);
    }
  };

  const clearCache = () => {
    showAlert({
      title: 'Limpiar Memoria',
      message: '¿Deseas eliminar los datos temporales de la aplicación?',
      type: 'confirm',
      icon: 'cleaning-services',
      actions: [
        { label: 'Cancelar', type: 'secondary', onPress: hideAlert },
        { label: 'Limpiar', onPress: () => { hideAlert(); Alert.alert('Éxito', 'Caché liberada.'); } }
      ]
    });
  };

  const SettingRow = ({ label, description, children, icon, color }: any) => (
    <View style={s.settingRow}>
      <View style={[s.iconBox, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <View style={s.settingInfo}>
        <Text style={s.settingLabel}>{label}</Text>
        {description && <Text style={s.settingDesc}>{description}</Text>}
      </View>
      <View>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color={C.textPri} />
        </TouchableOpacity>
        <Text style={s.title}>Ajustes VIP</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollInner} showsVerticalScrollIndicator={false}>
        
        {/* --- MI CUENTA --- */}
        <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Mi Cuenta</Text>
        </View>
        <View style={s.card}>
            <Text style={s.label}>Nombre de Administrador</Text>
            <View style={s.inputContainer}>
                <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Tu nombre" placeholderTextColor={C.textMut} />
                <TouchableOpacity onPress={handleUpdateProfile} disabled={saving || name === user?.name}>
                    <Text style={[s.saveSmallLink, name === user?.name && { color: C.textMut }]}>Guardar</Text>
                </TouchableOpacity>
            </View>
            
            <View style={s.infoRow}>
                <Text style={s.infoLabel}>Email asociado</Text>
                <Text style={s.infoValue}>{user?.email}</Text>
            </View>
            <View style={s.infoRow}>
                <Text style={s.infoLabel}>Rol del sistema</Text>
                <View style={s.roleBadge}><Text style={s.roleText}>{user?.role?.toUpperCase()}</Text></View>
            </View>
        </View>

        {/* --- SEGURIDAD --- */}
        <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Seguridad</Text>
        </View>
        <View style={s.card}>
            <Text style={s.label}>Actualizar Contraseña</Text>
            <View style={s.inputContainer}>
                <MaterialIcons name="lock-outline" size={18} color={C.textMut} style={{ marginRight: 10 }} />
                <TextInput 
                    style={s.input} 
                    secureTextEntry 
                    placeholder="Nueva contraseña" 
                    placeholderTextColor={C.textMut} 
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
            </View>
            <View style={s.inputContainer}>
                <MaterialIcons name="verified-user" size={18} color={C.textMut} style={{ marginRight: 10 }} />
                <TextInput 
                    style={s.input} 
                    secureTextEntry 
                    placeholder="Confirmar nueva contraseña" 
                    placeholderTextColor={C.textMut} 
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
            </View>
            <TouchableOpacity style={s.btnPrimary} onPress={handleChangePassword} disabled={saving}>
                <LinearGradient colors={[C.purple, C.purpleLight]} start={{x:0, y:0}} end={{x:1, y:0}} style={s.btnGradient}>
                    <Text style={s.btnText}>Cambiar Contraseña</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>

        {/* --- CONFIGURACIÓN GLOBAL --- */}
        <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Control del Sistema (Global)</Text>
        </View>
        <View style={s.card}>
            <SettingRow 
                label="Modo Mantenimiento" 
                description="Restringe el acceso público al sistema." 
                icon="engineering" 
                color={C.rose}
            >
                <Switch 
                    value={config.maintenanceMode} 
                    onValueChange={(v) => handleUpdateConfig('maintenanceMode', v)}
                    trackColor={{ false: C.cardHi, true: C.rose }}
                    thumbColor="#fff"
                />
            </SettingRow>

            <View style={s.divider} />

            <SettingRow 
                label="Registro de Staff" 
                description="Permitir que nuevos usuarios se registren." 
                icon="person-add" 
                color={C.teal}
            >
                <Switch 
                    value={config.allowNewRegistrations} 
                    onValueChange={(v) => handleUpdateConfig('allowNewRegistrations', v)}
                    trackColor={{ false: C.cardHi, true: C.teal }}
                    thumbColor="#fff"
                />
            </SettingRow>

            <View style={s.divider} />

            <Text style={s.label}>Email de Contacto Administrativo</Text>
            <View style={s.inputContainer}>
                <TextInput 
                    style={s.input} 
                    value={config.adminContactEmail} 
                    onChangeText={(t) => setConfig({...config, adminContactEmail: t})} 
                    onBlur={() => handleUpdateConfig('adminContactEmail', config.adminContactEmail)}
                    placeholder="admin@colegio.com" 
                    placeholderTextColor={C.textMut} 
                />
            </View>
        </View>

        {/* --- NOTIFICACIONES --- */}
        <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Notificaciones & Alertas</Text>
        </View>
        <View style={s.card}>
            <SettingRow 
                label="Alertas de Pedido" 
                description="Sonido y vibración para nuevas órdenes." 
                icon="notifications-active" 
                color={C.amber}
            >
                <Switch 
                    value={config.orderNotifications} 
                    onValueChange={(v) => handleUpdateConfig('orderNotifications', v)}
                    trackColor={{ false: C.cardHi, true: C.amber }}
                    thumbColor="#fff"
                />
            </SettingRow>
        </View>

        {/* --- PREFERENCIAS --- */}
        <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>App & Interfaz</Text>
        </View>
        <View style={s.card}>
            <SettingRow label="Idioma" description={language} icon="language" color={C.purpleLight}>
                <MaterialIcons name="keyboard-arrow-right" size={24} color={C.textMut} />
            </SettingRow>
            
            <View style={s.divider} />

            <SettingRow label="Modo Compacto" description="Optimiza el espacio en el Dashboard." icon="grid-view" color={C.textSec}>
                <Switch 
                    value={compactMode} 
                    onValueChange={setCompactMode}
                    trackColor={{ false: C.cardHi, true: C.purple }}
                    thumbColor="#fff"
                />
            </SettingRow>
        </View>

        {/* --- AVANZADO --- */}
        <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Soporte Avanzado</Text>
        </View>
        <TouchableOpacity style={s.cardAction} onPress={clearCache}>
            <MaterialIcons name="cleaning-services" size={22} color={C.textSec} />
            <Text style={s.cardActionText}>Limpiar Caché de la Aplicación</Text>
        </TouchableOpacity>

        <View style={s.footer}>
            <Text style={s.version}>Antares VIP Management v{config.appVersion}</Text>
            <Text style={s.school}>{config.schoolName}</Text>
        </View>

      </ScrollView>

      <AppModal {...alert} onClose={hideAlert} />
      
      {saving && (
        <View style={s.savingOverlay}>
             <ActivityIndicator color={C.purple} size="large" />
             <Text style={s.savingText}>Guardando cambios...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: C.textPri },
  
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingBottom: 60 },

  sectionHeader: { marginTop: 24, marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.textMut, textTransform: 'uppercase', letterSpacing: 1.5 },

  card: { backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border },
  label: { fontSize: 12, fontWeight: '700', color: C.textMut, marginBottom: 8, textTransform: 'uppercase' },
  
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.cardHi, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    height: 50, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border
  },
  input: { flex: 1, color: C.textPri, fontSize: 15 },
  saveSmallLink: { color: C.purpleLight, fontWeight: '700', fontSize: 13 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  infoLabel: { color: C.textSec, fontSize: 14 },
  infoValue: { color: C.textPri, fontSize: 14, fontWeight: '600' },
  roleBadge: { backgroundColor: C.purpleDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleText: { color: C.purpleLight, fontSize: 10, fontWeight: '900' },

  btnPrimary: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
  btnGradient: { height: 50, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  settingRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  settingInfo: { flex: 1 },
  settingLabel: { color: C.textPri, fontSize: 16, fontWeight: '600' },
  settingDesc: { color: C.textMut, fontSize: 12, marginTop: 2 },

  divider: { height: 1.2, backgroundColor: C.border, marginVertical: 18 },

  cardAction: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.card, 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: C.border,
    gap: 12
  },
  cardActionText: { color: C.textPri, fontSize: 15, fontWeight: '600' },

  footer: { marginTop: 40, alignItems: 'center' },
  version: { color: C.textMut, fontSize: 12, fontWeight: '600' },
  school: { color: 'rgba(255,255,255,0.1)', fontSize: 11, marginTop: 4 },

  savingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,11,36,0.8)', alignItems: 'center', justifyContent: 'center', zIndex: 99 },
  savingText: { color: C.textPri, marginTop: 16, fontWeight: '600' },
});
