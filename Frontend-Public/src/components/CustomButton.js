import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';

export const CustomButton = ({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    loading = false,
    disabled = false,
    icon
}) => {
    const isPrimary = variant === 'primary';
    const isOutline = variant === 'outline';

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.container,
                isPrimary && styles.primaryBg,
                isOutline && styles.outlineBg,
                disabled && styles.disabledBg,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? theme.colors.surface : theme.colors.primary} />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            isPrimary && styles.primaryText,
                            isOutline && styles.outlineText,
                            disabled && styles.disabledText,
                            icon && { marginLeft: theme.spacing.sm },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 56,
        borderRadius: theme.radius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
        ...theme.shadows.small,
    },
    primaryBg: {
        backgroundColor: theme.colors.primary,
    },
    outlineBg: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    disabledBg: {
        backgroundColor: theme.colors.border,
        elevation: 0,
        shadowOpacity: 0,
    },
    text: {
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.semibold,
    },
    primaryText: {
        color: theme.colors.surface,
    },
    outlineText: {
        color: theme.colors.primary,
    },
    disabledText: {
        color: theme.colors.textMuted,
    },
});
