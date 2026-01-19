/**
 * Authentication Store - Driver Mobile App
 * Manages driver user authentication state and tokens
 * Features: Device binding, auto-logout on cancelled status
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { backendAPI, getCurrentBackendUrl } from '../api';
import { Driver } from '../types';
import { registerPushTokenAfterLogin } from '../utils/pushNotificationHelper';

// Remote debug logger - sends logs to backend for debugging
const remoteLog = async (message: string, data?: any) => {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      message,
      data: data ? JSON.stringify(data) : undefined,
      backendUrl: getCurrentBackendUrl(),
    };
    console.log('📱 REMOTE LOG:', logData);
    
    // Send to backend (fire and forget)
    fetch('http://13.205.49.11/api/mobile-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    }).catch(() => {}); // Ignore errors
  } catch (e) {
    // Ignore logging errors
  }
};

/**
 * Get unique device identifier for one-device-per-driver feature
 */
const getDeviceId = async (): Promise<string> => {
  try {
    // Use Android ID on Android, or generate a persistent ID on iOS
    let deviceId: string | null = null;
    
    if (Device.osName === 'Android') {
      deviceId = Application.getAndroidId();
    } else if (Device.osName === 'iOS') {
      // On iOS, use a combination of device info (persisted in AsyncStorage)
      deviceId = await AsyncStorage.getItem('device_unique_id');
      if (!deviceId) {
        deviceId = `ios_${Device.modelId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await AsyncStorage.setItem('device_unique_id', deviceId);
      }
    }
    
    // Fallback: use a persisted random ID
    if (!deviceId) {
      deviceId = await AsyncStorage.getItem('device_unique_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await AsyncStorage.setItem('device_unique_id', deviceId);
      }
    }
    
    return deviceId;
  } catch (error) {
    console.warn('Failed to get device ID:', error);
    return `fallback_${Date.now()}`;
  }
};

interface AuthState {
  user: Driver | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  checkStatus: () => Promise<boolean>;  // Returns true if should logout
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (identifier: string, password: string) => {
    try {
      await remoteLog('DRIVER_LOGIN_ATTEMPT', { identifier });
      
      // Clear any corrupted old data first
      await AsyncStorage.multiRemove(['authToken', 'user', 'userType']).catch(() => {});
      
      // Get device ID for one-device-per-driver binding
      const deviceId = await getDeviceId();
      await remoteLog('CALLING_DRIVER_LOGIN', { identifier: String(identifier), deviceId });
      
      // Ensure identifier is always sent as string (avoid 422 from pydantic if numeric)
      const response = await backendAPI.driverLogin(String(identifier), password, deviceId);
      await remoteLog('DRIVER_LOGIN_SUCCESS', { userId: response.user?.id });

      // Store in AsyncStorage
      await AsyncStorage.setItem('authToken', String(response.token));
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('userType', 'driver');

      // Update state
      set({
        user: response.user as Driver,
        token: response.token,
        isAuthenticated: true,
      });

      // 🔔 Register FCM token with driver user_id after login
      registerPushTokenAfterLogin(response.user.id, 'driver').catch(err => {
        console.warn('Failed to register push token:', err);
      });
    } catch (error: any) {
      await remoteLog('DRIVER_LOGIN_ERROR', {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });
      console.error('Driver login failed:', error);
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Login failed');
    }
  },

  logout: async () => {
    const { user } = get();
    try {
      // Notify backend to clear device binding
      if (user?.id) {
        await backendAPI.driverLogout(user.id).catch(() => {});
      }
      
      await AsyncStorage.multiRemove(['authToken', 'user', 'userType']);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  // Check driver status - called periodically to auto-logout cancelled drivers
  checkStatus: async () => {
    const { user, logout } = get();
    if (!user?.id) return false;
    
    try {
      const { should_logout, status } = await backendAPI.checkDriverStatus(user.id);
      if (should_logout || status === 'cancelled') {
        console.log('🚨 Driver status is cancelled - forcing logout');
        await logout();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to check driver status:', error);
      return false;
    }
  },

  changePassword: async (newPassword: string) => {
    const { user } = get();
    if (!user) throw new Error('No user logged in');

    try {
      await backendAPI.changePassword(user.id, 'driver', newPassword);

      // Update user object (no longer first login)
      const updatedUser = { ...user, is_first_login: false };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (error: any) {
      console.error('Change password failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  },

  loadStoredAuth: async () => {
    try {
      const [token, userStr, userType] = await AsyncStorage.multiGet([
        'authToken',
        'user',
        'userType',
      ]);

      // Only allow driver users in this app
      if (token[1] && userStr[1] && userType[1] === 'driver') {
        const parsedUser = JSON.parse(userStr[1]);
        
        // Fix any boolean fields that might be stored as strings
        if (parsedUser.is_first_login !== undefined) {
          parsedUser.is_first_login = parsedUser.is_first_login === true || parsedUser.is_first_login === 'true';
        }
        
        set({
          token: token[1],
          user: parsedUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Clear any non-driver data
        await AsyncStorage.multiRemove(['authToken', 'user', 'userType']).catch(() => {});
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      await AsyncStorage.multiRemove(['authToken', 'user', 'userType']).catch(() => {});
      set({ isLoading: false });
    }
  },
}));
