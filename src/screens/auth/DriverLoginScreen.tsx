import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { toastValidationError, toastError } from '../../utils/toastHelpers';
import { Screen } from '../../components/Screen';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { Ionicons } from '@expo/vector-icons';

export default function DriverLoginScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    // ... logic remains same ...
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
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>

            <Logo size={60} style={styles.logo} />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to access your driver dashboard</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Driver ID or Phone Number"
              placeholder="e.g. 501234567"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="person-outline"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Button
              title="Login"
              onPress={handleLogin}
              isLoading={loading}
              style={styles.loginButton}
              fullWidth
            />

            <Text style={styles.hint}>
              Default password: 123456789{'\n'}
              You will be asked to change it on first login
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.layout.containerPadding,
  },
  header: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  logo: {
    marginBottom: theme.spacing.md,
  },
  backIcon: {
    marginBottom: theme.spacing.lg,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: -12,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  form: {
    marginTop: theme.spacing.md,
  },
  loginButton: {
    marginTop: theme.spacing.lg,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.text.disabled,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    lineHeight: 20,
  },
});
