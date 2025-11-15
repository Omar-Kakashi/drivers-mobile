/**
 * Driver Dashboard Screen - Overview for drivers
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import { Driver, Assignment, Balance } from '../../types';
import { toastLoadError } from '../../utils/toastHelpers';

const formatAmount = (amount: any): string => {
  if (amount === null || amount === undefined) return '0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export default function DriverDashboardScreen() {
  const { user, logout } = useAuthStore();
  const driver = user as Driver;
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard for driver:', driver.id, driver.driver_id);
      const data = await backendAPI.getDriverDashboard(driver.id);
      console.log('✅ Dashboard data received:', JSON.stringify(data, null, 2));
      setCurrentAssignment(data.current_assignment);
      setBalance(data.balance);
      setNotificationsCount(data.notifications_count);
    } catch (error: any) {
      console.error('❌ Dashboard load error:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      toastLoadError();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.greeting}>Hello, {driver.name}!</Text>
          <Text style={styles.driverInfo}>Driver ID: {driver.driver_id}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.driver.primary} />
          {notificationsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Current Assignment Card */}
      {currentAssignment ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Current Assignment</Text>
          </View>
          <View style={styles.assignmentContainer}>
            {currentAssignment.vehicle_image_url && (
              <Image 
                source={{ uri: currentAssignment.vehicle_image_url }}
                style={styles.vehicleImage}
              />
            )}
            <View style={styles.assignmentDetails}>
              <Text style={styles.licensePlate}>{currentAssignment.vehicle_license_plate}</Text>
              {currentAssignment.make_model && (
                <Text style={styles.makeModel}>{currentAssignment.make_model}</Text>
              )}
              <Text style={styles.assignmentInfo}>
                Since: {new Date(currentAssignment.assignment_date).toLocaleDateString()}
              </Text>
              <Text style={styles.assignmentInfo}>
                Daily Rent: AED {currentAssignment.daily_rent.toFixed(2)}
              </Text>
              <Text style={styles.assignmentInfo}>
                Status: <Text style={styles.statusActive}>{currentAssignment.status.toUpperCase()}</Text>
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.noAssignment}>No active assignment</Text>
        </View>
      )}

      {/* Balance Card */}
      {balance && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet" size={24} color={theme.colors.secondary} />
            <Text style={styles.cardTitle}>Balance Summary</Text>
          </View>
          <View style={styles.balanceGrid}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={[
                styles.balanceValue,
                { color: parseFloat(balance.current_balance || '0') >= 0 ? theme.colors.success : theme.colors.error }
              ]}>
                AED {formatAmount(balance.current_balance)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Total Rent Due</Text>
              <Text style={styles.balanceValue}>AED {formatAmount(balance.total_rent)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Total Payments</Text>
              <Text style={styles.balanceValue}>AED {formatAmount(balance.total_payments)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Total Credits</Text>
              <Text style={styles.balanceValue}>AED {formatAmount(balance.total_credits)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Leave Request')}
        >
          <Ionicons name="document-text" size={20} color={theme.colors.primary} />
          <Text style={styles.actionText}>Request Leave</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('MyAssignments')}
        >
          <Ionicons name="time" size={20} color={theme.colors.primary} />
          <Text style={styles.actionText}>View Assignment History</Text>
        </TouchableOpacity>
        {currentAssignment && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('VehicleDocuments')}
          >
            <Ionicons name="car-sport" size={20} color={theme.colors.primary} />
            <Text style={styles.actionText}>View Vehicle Documents</Text>
          </TouchableOpacity>
        )}
      </View>
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
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  greeting: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  driverInfo: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  notificationButton: {
    padding: theme.spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: theme.colors.text.white,
    fontSize: 10,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    marginTop: 0,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.h3,
    marginLeft: theme.spacing.sm,
  },
  assignmentContainer: {
    gap: theme.spacing.md,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    resizeMode: 'cover',
  },
  assignmentDetails: {
    gap: theme.spacing.sm,
  },
  licensePlate: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  makeModel: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginTop: -4,
  },
  assignmentInfo: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  statusActive: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  noAssignment: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  balanceItem: {
    flex: 1,
    minWidth: '45%',
  },
  balanceLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  balanceValue: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  quickActions: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    ...theme.shadows.small,
  },
  actionText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
});
