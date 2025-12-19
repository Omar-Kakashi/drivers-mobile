import React from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerStyle?: object;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    style,
    ...props
}) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.focusedInput,
                    error ? styles.errorInput : null,
                    props.editable === false && styles.disabledInput,
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={error ? theme.colors.error : isFocused ? theme.colors.primary : theme.colors.text.secondary}
                        style={styles.leftIcon}
                    />
                )}

                <TextInput
                    style={[
                        styles.input,
                        leftIcon ? { paddingLeft: 40 } : null,
                        rightIcon ? { paddingRight: 40 } : null,
                        style,
                    ]}
                    placeholderTextColor={theme.colors.text.disabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {rightIcon && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                        style={styles.rightIcon}
                    >
                        <Ionicons
                            name={rightIcon}
                            size={20}
                            color={error ? theme.colors.error : theme.colors.text.secondary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
    },
    label: {
        ...theme.typography.label,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
        marginLeft: 2,
    },
    inputContainer: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        height: 54, // Comfortable touch target
        justifyContent: 'center',
        ...theme.shadows.small,
    },
    input: {
        flex: 1,
        ...theme.typography.body1,
        color: theme.colors.text.primary,
        paddingHorizontal: theme.spacing.md,
        height: '100%',
    },
    focusedInput: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surface, // Ensure surface color on focus
    },
    errorInput: {
        borderColor: theme.colors.error,
    },
    disabledInput: {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.border,
    },
    leftIcon: {
        position: 'absolute',
        left: theme.spacing.md,
        zIndex: 1,
    },
    rightIcon: {
        position: 'absolute',
        right: theme.spacing.md,
        height: '100%',
        justifyContent: 'center',
        zIndex: 1,
    },
    errorText: {
        ...theme.typography.caption,
        color: theme.colors.error,
        marginTop: 4,
        marginLeft: 2,
    },
});
