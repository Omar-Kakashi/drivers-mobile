/**
 * Notification Store - Zustand
 * Caches notifications with unread count badge
 * Provides instant loading with background refresh
 */

import { create } from 'zustand';
import { backendAPI } from '../api';
import { Notification } from '../types';

interface NotificationState {
  // Data
  notifications: Notification[];
  unreadCount: number;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetched: number | null;
  
  // Error state
  error: string | null;
  
  // Actions
  fetchNotifications: (userId: string, userType: 'driver' | 'admin', forceRefresh?: boolean) => Promise<void>;
  markAsRead: (notificationId: string, userId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  clearCache: () => void;
  decrementUnreadCount: () => void;
}

// Cache duration: 2 minutes (notifications should be fresh)
const CACHE_DURATION = 2 * 60 * 1000;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isRefreshing: false,
  lastFetched: null,
  error: null,

  fetchNotifications: async (userId: string, userType: 'driver' | 'admin', forceRefresh = false) => {
    const { notifications, lastFetched, isLoading } = get();
    
    // If already loading, skip
    if (isLoading) return;
    
    // Check if cache is still valid
    const now = Date.now();
    const isCacheValid = lastFetched && (now - lastFetched) < CACHE_DURATION;
    
    // If we have cached data and not forcing refresh
    if (notifications.length > 0 && isCacheValid && !forceRefresh) {
      // Background refresh
      set({ isRefreshing: true });
      try {
        const data = await backendAPI.getNotifications(userId, userType);
        const unread = data.filter(n => !n.is_read).length;
        set({ 
          notifications: data,
          unreadCount: unread,
          lastFetched: Date.now(),
          isRefreshing: false,
          error: null 
        });
      } catch (error: any) {
        console.warn('Background notification refresh failed:', error.message);
        set({ isRefreshing: false });
      }
      return;
    }
    
    // No cache or expired - show loading
    set({ isLoading: notifications.length === 0, isRefreshing: notifications.length > 0, error: null });
    
    try {
      const data = await backendAPI.getNotifications(userId, userType);
      const unread = data.filter(n => !n.is_read).length;
      set({ 
        notifications: data,
        unreadCount: unread,
        lastFetched: Date.now(),
        isLoading: false,
        isRefreshing: false,
        error: null 
      });
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      set({ 
        isLoading: false, 
        isRefreshing: false,
        error: error.message || 'Failed to load notifications' 
      });
    }
  },

  markAsRead: async (notificationId: string, userId: string) => {
    try {
      await backendAPI.markNotificationRead(notificationId, userId);
      
      // Update local state immediately (optimistic update)
      const { notifications } = get();
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      const unread = updatedNotifications.filter(n => !n.is_read).length;
      
      set({ 
        notifications: updatedNotifications,
        unreadCount: unread 
      });
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async (userId: string) => {
    // Optimistic update - mark all as read locally
    const { notifications } = get();
    const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }));
    set({ 
      notifications: updatedNotifications,
      unreadCount: 0 
    });
    
    // TODO: Add backend endpoint for mark all as read
    // For now, mark each one individually in background
    for (const n of notifications.filter(n => !n.is_read)) {
      backendAPI.markNotificationRead(n.id, userId).catch(() => {});
    }
  },

  decrementUnreadCount: () => {
    const { unreadCount } = get();
    if (unreadCount > 0) {
      set({ unreadCount: unreadCount - 1 });
    }
  },

  clearCache: () => {
    set({ 
      notifications: [], 
      unreadCount: 0,
      lastFetched: null,
      error: null 
    });
  },
}));
