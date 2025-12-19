import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface CardProps extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'flat';
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
    variant = 'elevated',
    noPadding = false,
    style,
    children,
    ...props
}) => {
    const getStyle = () => {
        switch (variant) {
            case 'elevated':
                return styles.elevated;
            case 'outlined':
                return styles.outlined;
            case 'flat':
                return styles.flat;
            default:
                return styles.elevated;
        }
    };

    return (
        <View
            style={[
                styles.card,
                getStyle(),
                noPadding && { padding: 0 },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    elevated: {
        ...theme.shadows.medium,
    },
    outlined: {
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    flat: {
        backgroundColor: theme.colors.background,
    },
});
