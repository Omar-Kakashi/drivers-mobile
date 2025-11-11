import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    notifications: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setStats({
        notifications: 5,
        pendingApprovals: 3,
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.admin.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.admin.primary }]}>
          <Ionicons name="notifications-outline" size={32} color={theme.colors.white} />
          <Text style={styles.statValue}>{stats.notifications}</Text>
          <Text style={styles.statLabel}>Notifications</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.warning }]}>
          <Ionicons name="checkmark-circle-outline" size={32} color={theme.colors.white} />
          <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
          <Text style={styles.statLabel}>Pending Approvals</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.admin.primary} />
          <Text style={styles.actionText}>View Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="checkmark-done-outline" size={24} color={theme.colors.admin.primary} />
          <Text style={styles.actionText}>Pending Approvals</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="calendar-outline" size={24} color={theme.colors.admin.primary} />
          <Text style={styles.actionText}>My Leave Requests</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={theme.colors.admin.primary} />
        <Text style={styles.infoText}>For full administrative features, please use the web portal.</Text>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  greeting: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  name: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  statValue: {
    ...theme.typography.h1,
    color: theme.colors.white,
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.md,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.admin.light,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    flex: 1,
  },
});