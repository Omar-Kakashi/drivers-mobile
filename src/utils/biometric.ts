/**
 * Biometric Authentication Utility
 * Provides Face ID / Fingerprint authentication for quick login
 */

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_USER_KEY = 'biometric_user_id';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

/**
 * Check if device supports biometric authentication
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  } catch (error) {
    console.warn('Biometric check failed:', error);
    return false;
  }
}

/**
 * Get supported biometric types
 */
export async function getSupportedBiometricTypes(): Promise<string[]> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris Scan';
        default:
          return 'Biometric';
      }
    });
  } catch (error) {
    return [];
  }
}

/**
 * Get the primary biometric type name for display
 */
export async function getBiometricTypeName(): Promise<string> {
  const types = await getSupportedBiometricTypes();
  if (types.length === 0) return 'Biometrics';
  return types[0]; // Return primary type
}

/**
 * Authenticate using biometrics
 */
export async function authenticateBiometric(promptMessage?: string): Promise<BiometricResult> {
  try {
    const biometricName = await getBiometricTypeName();
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || `Login with ${biometricName}`,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // Allow PIN fallback
      fallbackLabel: 'Use Password',
    });
    
    if (result.success) {
      return { success: true };
    } else {
      // Handle different error types
      let errorMessage = 'Authentication failed';
      // Result is unsuccessful, so it has error property
      const errorResult = result as { success: false; error: string; warning?: string };
      if (errorResult.error === 'user_cancel') {
        errorMessage = 'Cancelled';
      } else if (errorResult.error === 'lockout') {
        errorMessage = 'Too many attempts. Try again later.';
      } else if (errorResult.error === 'not_enrolled') {
        errorMessage = 'No biometrics enrolled on device.';
      }
      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error('Biometric auth error:', error);
    return { success: false, error: error.message || 'Authentication failed' };
  }
}

/**
 * Check if biometric login is enabled for this user
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Enable biometric login for a user
 */
export async function enableBiometric(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    await AsyncStorage.setItem(BIOMETRIC_USER_KEY, userId);
  } catch (error) {
    console.error('Failed to enable biometric:', error);
    throw error;
  }
}

/**
 * Disable biometric login
 */
export async function disableBiometric(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    await AsyncStorage.removeItem(BIOMETRIC_USER_KEY);
  } catch (error) {
    console.error('Failed to disable biometric:', error);
  }
}

/**
 * Get the user ID associated with biometric login
 */
export async function getBiometricUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(BIOMETRIC_USER_KEY);
  } catch (error) {
    return null;
  }
}
