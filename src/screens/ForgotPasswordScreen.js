import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { apiService } from '../api/apiService';

export const ForgotPasswordScreen = ({ navigation }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestCode = async () => {
        if (!email) {
            Alert.alert('Error', 'Por favor ingresa tu correo');
            return;
        }
        setLoading(true);
        try {
            await apiService.forgotPassword(email);
            setStep(2);
            Alert.alert('Éxito', 'Hemos enviado un código a tu correo');
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo enviar el código');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = () => {
        if (code.length !== 6) {
            Alert.alert('Error', 'El código debe tener 6 dígitos');
            return;
        }
        setStep(3);
    };

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            await apiService.resetPassword({ email, code, newPassword: password });
            Alert.alert('Éxito', 'Tu contraseña ha sido actualizada', [
                { text: 'Ir al Login', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.formContainer}>
                        <Ionicons name="mail-unread-outline" size={80} color={theme.colors.primary} style={styles.mainIcon} />
                        <Text style={styles.stepTitle}>Recuperar Contraseña</Text>
                        <Text style={styles.stepSubtitle}>Ingresa tu correo para recibir un código de verificación.</Text>
                        
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Correo electrónico"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity style={styles.actionBtn} onPress={handleRequestCode} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Enviar Código</Text>}
                        </TouchableOpacity>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.formContainer}>
                        <Ionicons name="shield-checkmark-outline" size={80} color={theme.colors.primary} style={styles.mainIcon} />
                        <Text style={styles.stepTitle}>Verificar Código</Text>
                        <Text style={styles.stepSubtitle}>Ingresa el código de 6 dígitos que enviamos a tu correo.</Text>
                        
                        <View style={styles.inputContainer}>
                            <Ionicons name="keypad-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Código de 6 dígitos"
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>

                        <TouchableOpacity style={styles.actionBtn} onPress={handleVerifyCode} disabled={loading}>
                            <Text style={styles.actionBtnText}>Verificar Código</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                            <Text style={styles.backBtnText}>Volver a ingresar correo</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 3:
                return (
                    <View style={styles.formContainer}>
                        <Ionicons name="lock-open-outline" size={80} color={theme.colors.primary} style={styles.mainIcon} />
                        <Text style={styles.stepTitle}>Nueva Contraseña</Text>
                        <Text style={styles.stepSubtitle}>Crea una nueva contraseña segura para tu cuenta.</Text>
                        
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nueva contraseña"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="checkmark-done-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmar contraseña"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity style={styles.actionBtn} onPress={handleResetPassword} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Cambiar Contraseña</Text>}
                        </TouchableOpacity>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backAction}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {renderStep()}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
    },
    backAction: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    formContainer: {
        alignItems: 'center',
        gap: theme.spacing.lg,
    },
    mainIcon: {
        marginBottom: theme.spacing.md,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: 16,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        paddingHorizontal: theme.spacing.md,
        height: 60,
        width: '100%',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        ...theme.shadows.small,
    },
    inputIcon: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
    },
    actionBtn: {
        backgroundColor: theme.colors.primary,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginTop: theme.spacing.md,
        ...theme.shadows.medium,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backBtn: {
        marginTop: theme.spacing.sm,
    },
    backBtnText: {
        color: theme.colors.primary,
        fontWeight: '600',
    }
});
