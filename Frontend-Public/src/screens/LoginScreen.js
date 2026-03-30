import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorMsg('Por favor llena todos los campos');
            return;
        }
        setLoading(true);
        setErrorMsg('');
        try {
            const success = await login(email, password);
            if (!success) {
                setErrorMsg('Credenciales incorrectas');
            }
        } catch (error) {
            setErrorMsg(error.message || 'Error al conectar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="cafe" size={60} color={theme.colors.surface} />
                        </View>
                        <Text style={styles.title}>¡Bienvenido de nuevo!</Text>
                        <Text style={styles.subtitle}>Inicia sesión para ordenar tus alimentos</Text>
                    </View>

                    <View style={styles.form}>
                        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Correo institucional"
                                placeholderTextColor={theme.colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Contraseña"
                                placeholderTextColor={theme.colors.textMuted}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity 
                            style={styles.forgotBtn}
                            onPress={() => navigation.navigate('ForgotPassword')}
                        >
                            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.loginBtn}
                            activeOpacity={0.8}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.registerBtnText}>Regístrate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxl,
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: theme.colors.primary,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
    form: {
        gap: theme.spacing.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        height: 56,
        ...theme.shadows.small,
    },
    inputIcon: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        color: theme.colors.primary,
        fontWeight: theme.typography.weights.medium,
    },
    loginBtn: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: theme.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        ...theme.shadows.medium,
    },
    loginBtnText: {
        color: theme.colors.surface,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.bold,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
    },
    registerText: {
        color: theme.colors.textMuted,
    },
    registerBtnText: {
        color: theme.colors.primary,
        fontWeight: theme.typography.weights.bold,
    },
    errorText: {
        color: theme.colors.error,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
        fontWeight: theme.typography.weights.medium,
    }
});
