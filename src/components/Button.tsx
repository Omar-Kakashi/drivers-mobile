import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'small' | 'medium' | 'large';
    isLoading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    disabled,
    ...props
}) => {
    const getBackgroundColor = () => {
        if (disabled) return theme.colors.text.disabled;
        switch (variant) {
            case 'primary':
                return theme.colors.primary;
            case 'secondary':
                return theme.colors.secondary;
            case 'danger':
                return theme.colors.error;
            case 'outline':
            case 'ghost':
                return 'transparent';
            default:
                return theme.colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.colors.surface;
        switch (variant) {
            case 'primary':
            case 'secondary':
            case 'danger':
                return theme.colors.text.white;
            case 'outline':
                return theme.colors.primary;
            case 'ghost':
                return theme.colors.text.secondary;
            default:
                return theme.colors.text.white;
        }
    };

    const getBorder = () => {
        if (variant === 'outline') {
            return {
                borderWidth: 1.5,
                borderColor: disabled ? theme.colors.text.disabled : theme.colors.primary,
            };
        }
        return {};
    };

    const getHeight = () => {
        switch (size) {
            case 'small':
                return 36;
            case 'large':
                return 56;
            default: // medium
                return 48;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    height: getHeight(),
                    width: fullWidth ? '100%' : undefined,
                    ...getBorder(),
                },
                style,
            ]}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : 'white'}
                />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <Ionicons
                            name={icon}
                            size={size === 'small' ? 16 : 20}
                            color={getTextColor()}
                            style={{ marginRight: 8 }}
                        />
                    )}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: getTextColor(),
                                fontSize: size === 'small' ? 14 : 16,
                            },
                        ]}
                    >
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <Ionicons
                            name={icon}
                            size={size === 'small' ? 16 : 20}
                            color={getTextColor()}
                            style={{ marginLeft: 8 }}
                        />
                    )}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.lg,
        ...theme.shadows.small,
    },
    text: {
        ...theme.typography.button,
        textAlign: 'center',
    },
});
