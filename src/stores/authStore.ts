/**
 * Authentication Store - Zustand
 * Manages user authentication state and tokens
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendAPI } from '../api';
import { Driver, AdminUser, UserType } from '../types';
import { registerPushTokenAfterLogin } from '../utils/pushNotificationHelper';

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
      // Clear any corrupted old data first
      await AsyncStorage.multiRemove(['authToken', 'user', 'userType']).catch(() => {});
      
      let response;
      if (type === 'driver') {
        response = await backendAPI.driverLogin(identifier, password);
      } else {
        response = await backendAPI.adminLogin(identifier, password);
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
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
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
