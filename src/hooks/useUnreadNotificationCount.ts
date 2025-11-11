/**
 * Hook to get unread notification count
 */

import { useState, useEffect } from 'react';
import { backendAPI } from '../api';
import { useAuthStore } from '../stores/authStore';

export const useUnreadNotificationCount = () => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const notifications = await backendAPI.getNotifications(user.id, 'driver');
      const unread = notifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return { unreadCount, refresh: fetchUnreadCount };
};
