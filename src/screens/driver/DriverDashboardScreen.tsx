/**
 * Driver Dashboard Screen - Overview for drivers
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import { Driver, Assignment, Balance } from '../../types';
import { toastLoadError } from '../../utils/toastHelpers';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { resolveImageUrl } from '../../utils/urlHelper';

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

      // Fetch Detailed Balance
      try {
        const detailedBalance = await backendAPI.getDriverBalance(driver.id);
        setBalance(detailedBalance);
      } catch (e) {
        console.log('⚠️ Failed to load detailed balance, using summary', e);
        setBalance(data.balance);
      }

      setNotificationsCount(data.notifications_count);
    } catch (error: any) {
      console.error('❌ Dashboard load error:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      toastLoadError();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Screen style={styles.container} padding>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Logo size={40} />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Hello, {driver.name.split(' ')[0]}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            {notificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Current Assignment Card */}
        <Text style={styles.sectionTitle}>Current Vehicle</Text>
        {currentAssignment ? (
          <Card variant="elevated" noPadding style={styles.vehicleCard}>
            {resolveImageUrl(currentAssignment.vehicle_image_url) && (
              <Image
                source={{ uri: resolveImageUrl(currentAssignment.vehicle_image_url) }}
                style={styles.vehicleImage}
              />
            )}
            <View style={styles.vehicleContent}>
              <View style={styles.vehicleHeader}>
                <Text style={styles.licensePlate}>{currentAssignment.vehicle_license_plate}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{currentAssignment.status.toUpperCase()}</Text>
                </View>
              </View>
              {currentAssignment.make_model && (
                <Text style={styles.makeModel}>{currentAssignment.make_model}</Text>
              )}

              <View style={styles.vehicleDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.detailText}>
                    {new Date(currentAssignment.assignment_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="pricetag-outline" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.detailText}>
                    AED {currentAssignment.daily_rent.toFixed(2)} / day
                  </Text>
                </View>
              </View>

              <Button
                title="Vehicle Documents"
                variant="outline"
                size="small"
                onPress={() => navigation.navigate('VehicleDocuments')}
                style={styles.vehicleDocsButton}
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyStateCard}>
            <Ionicons name="car-outline" size={48} color={theme.colors.text.disabled} />
            <Text style={styles.emptyStateText}>No active vehicle assignment</Text>
          </Card>
        )}

        {/* Balance Card */}
        {balance && (
          <>
            <Text style={styles.sectionTitle}>Financials</Text>
            <Card variant="elevated" style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={[
                  styles.balanceAmount,
                  { color: (balance.current_balance || 0) >= 0 ? theme.colors.success : theme.colors.error }
                ]}>
                  AED {formatAmount(balance.current_balance)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.balanceGrid}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceSubLabel}>Total Rent Due</Text>
                  <Text style={styles.balanceSubValue}>AED {formatAmount(balance.total_rent_due)}</Text>
                </View>
                <View style={[styles.balanceItem, styles.balanceBorderLeft]}>
                  <Text style={styles.balanceSubLabel}>Total Paid</Text>
                  <Text style={styles.balanceSubValue}>AED {formatAmount(balance.total_payments)}</Text>
                </View>
              </View>

              {/* Detailed Breakdown */}
              {(balance.total_salik || balance.total_fines || balance.total_fuel) ? (
                <>
                  <View style={[styles.divider, { marginTop: theme.spacing.md }]} />
                  <View style={styles.balanceGrid}>
                    {balance.total_salik !== undefined && (
                      <View style={styles.balanceItem}>
                        <Text style={styles.balanceSubLabel}>Salik</Text>
                        <Text style={styles.balanceSubValue}>AED {formatAmount(balance.total_salik)}</Text>
                      </View>
                    )}
                    {balance.total_fines !== undefined && (
                      <View style={[styles.balanceItem, styles.balanceBorderLeft]}>
                        <Text style={styles.balanceSubLabel}>Fines</Text>
                        <Text style={styles.balanceSubValue}>AED {formatAmount(balance.total_fines)}</Text>
                      </View>
                    )}
                  </View>
                </>
              ) : null}
            </Card>
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Leave Request')}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryLight + '20' }]}>
              <Ionicons name="calendar" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Request Leave</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Assignments')}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.secondary + '20' }]}>
              <Ionicons name="time" size={24} color={theme.colors.secondary} />
            </View>
            <Text style={styles.actionLabel}>Assignments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('TrafficFines')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EF4444' + '20' }]}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
            </View>
            <Text style={styles.actionLabel}>Traffic Fines</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('AccidentReport')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#DC2626' + '20' }]}>
              <Ionicons name="car-sport" size={24} color="#DC2626" />
            </View>
            <Text style={styles.actionLabel}>Report Accident</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerText: {
    justifyContent: 'center',
  },
  greeting: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  driverId: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.error,
    borderRadius: 6,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  vehicleCard: {
    overflow: 'hidden',
  },
  vehicleImage: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.border,
  },
  vehicleContent: {
    padding: theme.spacing.md,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  licensePlate: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  statusBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontWeight: '700',
  },
  makeModel: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  vehicleDetails: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  vehicleDocsButton: {
    marginTop: theme.spacing.xs,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyStateText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  balanceCard: {
    backgroundColor: theme.colors.primary, // Using primary color for balance card background
  },
  balanceHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  balanceLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  balanceAmount: {
    ...theme.typography.h1,
    color: theme.colors.text.white,
    fontSize: 36,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.text.white,
    opacity: 0.2,
    marginBottom: theme.spacing.md,
  },
  balanceGrid: {
    flexDirection: 'row',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.2)',
  },
  balanceSubLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.white,
    opacity: 0.8,
    marginBottom: 2,
  },
  balanceSubValue: {
    ...theme.typography.h4,
    color: theme.colors.text.white,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionItem: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
});
