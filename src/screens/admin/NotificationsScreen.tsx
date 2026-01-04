import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { backendAPI as api } from '../../api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const data = await api.getNotifications(user.id, 'admin');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Mock data for demonstration
      setNotifications([
        {
          id: '1',
          title: 'New Leave Request',
          message: 'Mohammed Ali has requested 3 days of annual leave',
          type: 'leave_request',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Vehicle Assignment Updated',
          message: 'Vehicle ABC123 has been assigned to Tahir Ullah',
          type: 'assignment',
          is_read: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          title: 'Payment Received',
          message: 'Driver payment of AED 500 received',
          type: 'payment',
          is_read: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;
    
    try {
      await api.markNotificationRead(notificationId, user.id);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_request':
        return 'calendar-outline';
      case 'assignment':
        return 'car-outline';
      case 'payment':
        return 'cash-outline';
      default:
        return 'notifications-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.admin.primary} />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.colors.text.secondary} />
          <Text style={styles.emptyText}>No Notifications</Text>
          <Text style={styles.emptySubtext}>You're all caught up!</Text>
        </View>
      </ScrollView>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {unreadCount > 0 ? `${unreadCount} Unread` : 'All Read'}
        </Text>
      </View>

      {notifications.map((notification) => (
        <TouchableOpacity
          key={notification.id}
          style={[styles.notificationCard, !notification.is_read && styles.unreadCard]}
          onPress={() => !notification.is_read && markAsRead(notification.id)}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={getNotificationIcon(notification.type) as any}
              size={24}
              color={notification.is_read ? theme.colors.text.secondary : theme.colors.admin.primary}
            />
          </View>
          
          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, !notification.is_read && styles.unreadTitle]}>
                {notification.title}
              </Text>
              {!notification.is_read && <View style={styles.unreadDot} />}
            </View>
            
            <Text style={styles.message}>{notification.message}</Text>
            
            <Text style={styles.time}>
              {new Date(notification.created_at).toLocaleDateString()} at{' '}
              {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.text.white,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.text.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    ...theme.shadows.small,
  },
  unreadCard: {
    borderLeftColor: theme.colors.admin.primary,
    backgroundColor: theme.colors.admin.light,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  unreadTitle: {
    color: theme.colors.admin.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.admin.primary,
    marginLeft: theme.spacing.sm,
  },
  message: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  time: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
});