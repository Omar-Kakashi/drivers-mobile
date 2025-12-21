/**
 * Authentication Store - Zustand
 * Manages user authentication state and tokens
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendAPI, getCurrentBackendUrl } from '../api';
import { Driver, AdminUser, UserType } from '../types';
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
    
    // Send to backend via nginx (fire and forget)
    fetch('https://ostoldev.stsc.ae/api/mobile-logs/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    }).catch(() => {}); // Ignore errors
  } catch (e) {
    // Ignore logging errors
  }
};

interface AuthState {
  user: Driver | AdminUser | null;
  userType: UserType | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (identifier: string, password: string, type: UserType) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userType: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (identifier: string, password: string, type: UserType) => {
    try {
      await remoteLog('LOGIN_ATTEMPT', { identifier, type, passwordLength: password.length });
      
      // Clear any corrupted old data first
      await AsyncStorage.multiRemove(['authToken', 'user', 'userType']).catch(() => {});
      
      let response;
      if (type === 'driver') {
        // Ensure identifier is always sent as string (avoid 422 from pydantic if numeric)
        await remoteLog('CALLING_DRIVER_LOGIN', { identifier: String(identifier) });
        response = await backendAPI.driverLogin(String(identifier), password);
        await remoteLog('DRIVER_LOGIN_SUCCESS', { userId: response.user?.id });
      } else {
        await remoteLog('CALLING_ADMIN_LOGIN', { identifier });
        response = await backendAPI.adminLogin(identifier, password);
        await remoteLog('ADMIN_LOGIN_SUCCESS', { userId: response.user?.id });
      }

      // Store in AsyncStorage with proper types
      await AsyncStorage.setItem('authToken', String(response.token));
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('userType', String(response.user_type));

      // Update state
      set({
        user: response.user,
        userType: response.user_type,
        token: response.token,
        isAuthenticated: true,
      });

      // 🔔 CRITICAL: Re-register FCM token with user_id after login
      // This links the FCM token to the logged-in user so they can receive notifications
      registerPushTokenAfterLogin(response.user.id, response.user_type).catch(err => {
        console.warn('Failed to register push token:', err);
        // Don't block login if push token registration fails
      });
    } catch (error: any) {
      // Log the full error for remote debugging
      await remoteLog('LOGIN_ERROR', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl: error.config?.url,
        requestBaseURL: error.config?.baseURL,
      });
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Login failed');
    }
  },

  logout: async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['authToken', 'user', 'userType']);

      // Clear state
      set({
        user: null,
        userType: null,
        token: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  changePassword: async (newPassword: string) => {
    const { user, userType } = get();
    if (!user || !userType) throw new Error('No user logged in');

    try {
      await backendAPI.changePassword(user.id, userType, newPassword);

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

      if (token[1] && userStr[1] && userType[1]) {
        // Parse user and ensure all fields are properly typed
        const parsedUser = JSON.parse(userStr[1]);
        
        // Fix any boolean fields that might be stored as strings
        if (parsedUser.is_first_login !== undefined) {
          parsedUser.is_first_login = parsedUser.is_first_login === true || parsedUser.is_first_login === 'true';
        }
        
        set({
          token: token[1],
          user: parsedUser,
          userType: userType[1] as UserType,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      // Clear corrupted storage and reset
      await AsyncStorage.multiRemove(['authToken', 'user', 'userType']).catch(() => {});
      set({ isLoading: false });
    }
  },
}));
