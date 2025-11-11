/**
 * Notifications Screen - View and manage notifications
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import { Notification } from '../../types';

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await backendAPI.getNotifications(user?.id || '', 'driver');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await backendAPI.markNotificationRead(notification.id, user?.id || '');
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'leave_approved':
      case 'leave_rejected':
      case 'passport_approved':
      case 'passport_rejected':
        navigation.navigate('My Requests');
        break;
      case 'assignment_updated':
        navigation.navigate('Assignments');
        break;
      case 'payment_received':
        navigation.navigate('Balance');
        break;
      case 'settlement_generated':
      case 'settlement_approved':
      case 'settlement_paid':
        navigation.navigate('Settlements');
        break;
      default:
        // Just mark as read, no navigation
        break;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_approved':
        return { name: 'checkmark-circle', color: theme.colors.success };
      case 'leave_rejected':
        return { name: 'close-circle', color: theme.colors.error };
      case 'assignment_updated':
        return { name: 'car', color: theme.colors.driver.primary };
      case 'payment_received':
        return { name: 'cash', color: theme.colors.success };
      case 'settlement_generated':
      case 'settlement_approved':
        return { name: 'document-text', color: theme.colors.driver.primary };
      case 'settlement_paid':
        return { name: 'card', color: theme.colors.success };
      case 'passport_approved':
        return { name: 'checkmark-circle', color: theme.colors.success };
      case 'passport_rejected':
        return { name: 'close-circle', color: theme.colors.error };
      default:
        return { name: 'notifications', color: theme.colors.driver.primary };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.driver.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.colors.text.secondary} />
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        notifications.map((notification) => {
          const icon = getNotificationIcon(notification.type);
          return (
            <TouchableOpacity
              key={notification.id}
              style={[styles.notificationCard, !notification.is_read && styles.unreadCard]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={icon.name as any} size={28} color={icon.color} />
              </View>
              <View style={styles.contentContainer}>
                <Text style={[styles.title, !notification.is_read && styles.unreadTitle]}>
                  {notification.title}
                </Text>
                <Text style={styles.message}>{notification.message}</Text>
                <Text style={styles.time}>
                  {new Date(notification.created_at).toLocaleString()}
                </Text>
              </View>
              {!notification.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    margin: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    ...theme.shadows.sm,
  },
  unreadCard: {
    backgroundColor: theme.colors.driver.light,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.driver.primary,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  time: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.driver.primary,
    marginLeft: theme.spacing.sm,
    alignSelf: 'center',
  },
});
