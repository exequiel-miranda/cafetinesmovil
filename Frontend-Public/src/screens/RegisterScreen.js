import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export const RegisterScreen = ({ navigation }) => {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            setErrorMsg('Por favor llena todos los campos');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMsg('Las contraseñas no coinciden');
            return;
        }
        if (password.length < 6) {
            setErrorMsg('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        setLoading(true);
        setErrorMsg('');
        try {
            const success = await register(name, email, password);
            if (!success) {
                setErrorMsg('Error al registrar, posiblemente el correo ya existe');
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
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Crea tu cuenta</Text>
                        <Text style={styles.subtitle}>Empieza a disfrutar sin filas largas</Text>
                    </View>

                    <View style={styles.form}>
                        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre completo"
                                placeholderTextColor={theme.colors.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

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

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmar contraseña"
                                placeholderTextColor={theme.colors.textMuted}
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </View>

                        <TouchableOpacity 
                            style={styles.registerBtn}
                            activeOpacity={0.8}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.registerBtnText}>Registrarse</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.loginBtnText}>Inicia Sesión</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
    },
    backButton: {
        marginBottom: theme.spacing.lg,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    header: {
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.sizes.xxxl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
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
    registerBtn: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: theme.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.md,
        ...theme.shadows.medium,
    },
    registerBtnText: {
        color: theme.colors.surface,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.bold,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
    },
    loginText: {
        color: theme.colors.textMuted,
    },
    loginBtnText: {
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
