import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ScreenHeader = ({ title, showBack = false, rightIcon, onRightPress }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + theme.spacing.sm }]}>
            <View style={styles.left}>
                {showBack && (
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.iconButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.title}>{title}</Text>

            <View style={styles.right}>
                {rightIcon && (
                    <TouchableOpacity
                        onPress={onRightPress}
                        style={styles.iconButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name={rightIcon} size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
        backgroundColor: theme.colors.background,
    },
    left: {
        width: 40,
        alignItems: 'flex-start',
    },
    right: {
        width: 40,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
});
