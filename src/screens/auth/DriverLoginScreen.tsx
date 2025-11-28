/**
 * Driver Login Screen - Login with driver_id OR phone
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { toastValidationError, toastError } from '../../utils/toastHelpers';

export default function DriverLoginScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      toastValidationError('driver ID/phone and password');
      return;
    }

    setLoading(true);
    try {
      // Normalize identifier: if phone-like, convert to +971 format for UAE mobile
      const normalizeIdentifier = (id: string) => {
        if (!id) return id;
        const cleaned = id.replace(/[^0-9+]/g, '');
        // If it already has +, assume valid international format
        if (cleaned.startsWith('+')) return cleaned;
        // UAE mobile numbers are typically 9 digits starting with 5, or 8 digits after 0
        const digits = cleaned.replace(/^0+/, '');
        if (/^5[0-9]{7,8}$/.test(digits)) {
          // if 8 digits, it's probably 5xxxxxxx; add +971
          return `+971${digits}`;
        }
        // If numeric but not starting 5, send as-is (may be driver ID)
        if (/^[0-9]+$/.test(cleaned)) return cleaned;
        return id;
      };

      const processedIdentifier = String(normalizeIdentifier(identifier.trim()));
      console.log('Attempting login with identifier:', processedIdentifier);
      await login(processedIdentifier, password, 'driver');
      // Navigation handled by RootNavigator after auth state changes
    } catch (error: any) {
      // Provide clearer error messages for validation or authentication failures
      const serverMessage = error?.response?.data?.detail || error?.response?.data || error?.message;
      console.error('Driver login error:', serverMessage);
      toastError(serverMessage || error, 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Driver Login</Text>
          <Text style={styles.subtitle}>Enter your credentials</Text>
        </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Driver ID or Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter driver ID or phone"
            placeholderTextColor={theme.colors.text.secondary}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              placeholderTextColor={theme.colors.text.secondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={24} 
                color={theme.colors.text.secondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text.white} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to login options</Text>
        </TouchableOpacity>
      </View>

        <Text style={styles.hint}>
          Default password: 123456789{'\n'}
          You will be asked to change it on first login
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  form: {
    gap: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  input: {
    ...theme.typography.body1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text.primary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordInput: {
    ...theme.typography.body1,
    flex: 1,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
  },
  eyeButton: {
    padding: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.text.white,
  },
  backButton: {
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  backButtonText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
