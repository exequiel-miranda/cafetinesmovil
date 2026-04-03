import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPatch, apiDelete } from '@/utils/api';

const C = {
  bg:         '#0E0B24',
  card:       '#1A1640',
  cardHi:     '#231F52',
  border:     '#2E2A62',
  purple:     '#7B5CF5',
  purpleLight:'#9B7BFF',
  purpleDim:  'rgba(123,92,245,0.18)',
  teal:       '#00D2A3',
  tealDim:    'rgba(0,210,163,0.15)',
  gold:       '#D4AF37',
  goldDim:    'rgba(212,175,55,0.15)',
  rose:       '#FF6B8A',
  roseDim:    'rgba(255,107,138,0.15)',
  textPri:    '#FFFFFF',
  textSec:    '#9B96C8',
  textMut:    '#4A4580',
};

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'user';
  department?: 'kitchen' | 'sales';
  createdAt: string;
}

export default function StaffScreen() {
  const { openDrawer } = useDrawer();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await apiGet('/users');
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);



  const handleToggleDepartment = async (userId: string, currentDept: string | undefined) => {
    try {
      setProcessingId(userId);
      const newDept = (currentDept === 'kitchen') ? 'sales' : 'kitchen';
      await apiPatch(`/users/${userId}/department`, { department: newDept });
      
      // Update local state smoothly
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, department: newDept } : u));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar el área laboral');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (currentUser?._id === userId) {
      Alert.alert('Acción Denegada', 'No puedes eliminar tu propia cuenta.');
      return;
    }

    Alert.alert(
      'Remover Miembro',
      `¿Estás seguro de que deseas eliminar permanentemente a ${userName} del sistema? No podrá volver a iniciar sesión.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(userId);
              await apiDelete(`/users/${userId}`);
              setUsers(prev => prev.filter(u => u._id !== userId));
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo eliminar al usuario');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.wrap}>
        
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.menuBtn} onPress={openDrawer}>
             <View style={s.menuLine} />
             <View style={[s.menuLine, { width: 14 }]} />
             <View style={s.menuLine} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Gestión de Staff</Text>
          <View style={s.headerCountBox}>
             <Text style={s.headerCount}>{users.length}</Text>
          </View>
        </View>

        {loading && !refreshing ? (
             <View style={s.empty}><ActivityIndicator color={C.purple} size="large" /></View>
        ) : (
        <ScrollView 
          style={s.list} 
          contentContainerStyle={s.listInner} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} />}
        >
           {users.map((item) => {
             const isAdmin = item.role === 'admin';
             const isMe = currentUser?._id === item._id;

             return (
               <View key={item._id} style={[s.userCard, isMe && { borderColor: C.purple }]}>
                 
                 <View style={s.cardTop}>
                    <View style={s.avatarBox}>
                       <MaterialIcons name="person" size={26} color={C.textSec} />
                    </View>
                    <View style={s.infoBox}>
                       <Text style={s.nameTxt} numberOfLines={1}>{item.name}</Text>
                       <Text style={s.emailTxt}>{item.email}</Text>
                    </View>
                    
                    {/* Badges */}
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {/* Department Badge */}
                      <View style={[s.badgeBox, item.department === 'kitchen' ? { backgroundColor: C.roseDim } : { backgroundColor: C.tealDim }]}>
                         <MaterialIcons name={item.department === 'kitchen' ? "outdoor-grill" : "point-of-sale"} size={14} color={item.department === 'kitchen' ? C.rose : C.teal} />
                         <Text style={[s.badgeTxt, { color: item.department === 'kitchen' ? C.rose : C.teal }]}>
                           {item.department === 'kitchen' ? 'COCINA' : 'VENTAS'}
                         </Text>
                      </View>
                      
                      {/* Admin Badge (Solo si es jefa/admin) */}
                      {isAdmin && (
                        <View style={[s.badgeBox, { backgroundColor: C.goldDim }]}>
                           <MaterialIcons name="admin-panel-settings" size={14} color={C.gold} />
                           <Text style={[s.badgeTxt, { color: C.gold }]}>ADMIN</Text>
                        </View>
                      )}
                    </View>
                 </View>

                 <View style={s.divider} />

                 {/* Acciones */}
                 <View style={s.actionRow}>
                    <Text style={s.dateTxt}>Desde: {new Date(item.createdAt).toLocaleDateString()}</Text>

                    {processingId === item._id ? (
                      <ActivityIndicator size="small" color={C.purple} />
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                         
                         {/* Toggle Department */}
                         {!isMe && (
                           <TouchableOpacity 
                              style={[s.actionBtn, { backgroundColor: C.cardHi }]}
                              onPress={() => handleToggleDepartment(item._id, item.department)}
                           >
                              <MaterialIcons 
                                name="swap-horiz" 
                                size={18} 
                                color={C.purpleLight} 
                              />
                              <Text style={[s.actionBtnTxt, { color: C.purpleLight }]}>
                                {item.department === 'kitchen' ? 'MOVER A VENTAS' : 'MOVER A COCINA'}
                              </Text>
                           </TouchableOpacity>
                         )}

                         {/* Delete */}
                         {!isMe && (
                           <TouchableOpacity 
                             style={[s.actionBtn, { backgroundColor: 'rgba(255,107,138,0.1)' }]}
                             onPress={() => handleDeleteUser(item._id, item.name)}
                           >
                              <MaterialIcons name="person-remove" size={18} color={C.rose} />
                           </TouchableOpacity>
                         )}

                         {isMe && <Text style={s.meBadge}>Mi Cuenta</Text>}

                      </View>
                    )}
                 </View>

               </View>
             );
           })}
        </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  wrap: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 20 
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: C.textPri, letterSpacing: -0.5, marginLeft: 16 },
  headerCountBox: { backgroundColor: C.cardHi, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  headerCount: { color: C.textPri, fontWeight: '700', fontSize: 14 },
  
  menuBtn: { gap: 4, width: 40, height: 40, justifyContent: 'center' },
  menuLine: { width: 20, height: 2, backgroundColor: C.textPri, borderRadius: 1 },
  
  empty: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  
  list: { flex: 1 },
  listInner: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 16 },

  userCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.cardHi, alignItems: 'center', justifyContent: 'center' },
  infoBox: { flex: 1 },
  nameTxt: { color: C.textPri, fontSize: 17, fontWeight: '700', marginBottom: 2 },
  emailTxt: { color: C.textMut, fontSize: 13, fontWeight: '500' },
  
  badgeBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  badgeTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginVertical: 14 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateTxt: { color: C.textMut, fontSize: 12, fontWeight: '500' },
  
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
  actionBtnTxt: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  
  meBadge: { color: C.purple, fontSize: 13, fontWeight: '800', backgroundColor: C.purpleDim, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
});
