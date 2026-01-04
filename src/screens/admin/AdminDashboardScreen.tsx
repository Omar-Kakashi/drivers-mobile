import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { backendAPI } from '../../api';
import { useNavigation } from '@react-navigation/native';

// Share Adjustment types
const DISCOUNT_TYPES = [
  { value: 'workshop', label: 'Workshop (Vehicle in repair)' },
  { value: 'accident', label: 'Accident' },
  { value: 'medical', label: 'Medical Leave' },
  { value: 'travel', label: 'Travel/Vacation' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'other', label: 'Other' },
];

interface Driver {
  id: string;
  name: string;
  current_vehicle_id?: string;
  vehicle_license_plate?: string;
}

export default function AdminDashboardScreen() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    notifications: 0,
    pendingLeave: 0,
    pendingShare: 0,
    activeDrivers: 0,
    activeVehicles: 0,
  });
  
  // Create Share Adjustment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Selector modals
  const [showDriverSelector, setShowDriverSelector] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  
  // Form state
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [discountType, setDiscountType] = useState('workshop');
  const [discountDays, setDiscountDays] = useState('1');
  const [dailyRate, setDailyRate] = useState('');
  const [reason, setReason] = useState('');
  const [discountDate, setDiscountDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Helper to get selected driver name
  const selectedDriver = drivers.find(d => d.id === selectedDriverId);
  const selectedTypeLabel = DISCOUNT_TYPES.find(t => t.value === discountType)?.label || discountType;

  const loadStats = useCallback(async () => {
    try {
      // Load pending counts in parallel
      const [leaveRequests, shareAdjustments, notifications, drivers, vehicles] = await Promise.all([
        backendAPI.getPendingLeaveRequests().catch(() => []),
        backendAPI.getPendingRentDiscounts().catch(() => []),
        backendAPI.getNotifications(user?.id || '', 'admin').catch(() => []),
        backendAPI.getDrivers().catch(() => []),
        backendAPI.getVehicles().catch(() => []),
      ]);
      
      const unreadNotifications = notifications.filter((n: any) => !n.is_read).length;
      const activeDriverCount = drivers.filter((d: any) => d.status === 'active').length;
      const activeVehicleCount = vehicles.filter((v: any) => v.status === 'work' || v.status === 'available').length;
      
      setStats({
        notifications: unreadNotifications,
        pendingLeave: leaveRequests.length,
        pendingShare: shareAdjustments.length,
        activeDrivers: activeDriverCount,
        activeVehicles: activeVehicleCount,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const loadDrivers = async () => {
    setLoadingDrivers(true);
    try {
      // Fetch all drivers (or active ones with vehicles)
      const response = await backendAPI.getDrivers();
      // Filter to drivers with vehicles for share adjustments
      const driversWithVehicles = response.filter((d: any) => d.current_vehicle_id);
      setDrivers(driversWithVehicles);
      
      if (driversWithVehicles.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No Active Drivers',
          text2: 'No drivers currently have vehicles assigned',
        });
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load drivers',
      });
    } finally {
      setLoadingDrivers(false);
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    loadDrivers();
    // Reset form
    setSelectedDriverId('');
    setDiscountType('workshop');
    setDiscountDays('1');
    setDailyRate('');
    setReason('');
    setDiscountDate(new Date().toISOString().split('T')[0]);
  };

  const handleCreateShareAdjustment = async () => {
    // Validation
    if (!selectedDriverId) {
      Toast.show({ type: 'error', text1: 'Select Driver', text2: 'Please select a driver' });
      return;
    }
    const days = parseFloat(discountDays);
    if (isNaN(days) || days <= 0 || days > 31) {
      Toast.show({ type: 'error', text1: 'Invalid Days', text2: 'Enter days between 0.5 and 31' });
      return;
    }
    const rate = parseFloat(dailyRate);
    if (isNaN(rate) || rate <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid Rate', text2: 'Enter a valid daily rate' });
      return;
    }
    if (!reason.trim()) {
      Toast.show({ type: 'error', text1: 'Reason Required', text2: 'Please provide a reason' });
      return;
    }
    
    const selectedDriver = drivers.find(d => d.id === selectedDriverId);
    if (!selectedDriver?.current_vehicle_id) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Selected driver has no vehicle' });
      return;
    }
    
    try {
      setSubmitting(true);
      
      await backendAPI.requestRentDiscount({
        driver_id: selectedDriverId,
        vehicle_id: selectedDriver.current_vehicle_id,
        discount_type: discountType,
        discount_date: discountDate,
        discount_days: days,
        daily_rate: rate,
        reason: reason.trim(),
        requested_by: user?.id || '',
        requested_by_type: 'admin',
      });
      
      Toast.show({
        type: 'success',
        text1: 'Created',
        text2: 'Share adjustment request submitted',
      });
      
      setShowCreateModal(false);
      loadStats(); // Refresh counts
    } catch (error: any) {
      console.error('Create share adjustment error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.detail || 'Failed to create adjustment',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const navigateToTab = (tabName: string) => {
    navigation.navigate(tabName);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.admin.primary} />
      </View>
    );
  }

  const totalPending = stats.pendingLeave + stats.pendingShare;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>{user?.role?.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigateToTab('Profile')} style={styles.headerButton}>
            <Ionicons name="person-circle-outline" size={28} color={theme.colors.admin.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.headerButton}>
            <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: theme.colors.admin.primary }]}
          onPress={() => navigateToTab('Notifications')}
        >
          <Ionicons name="notifications-outline" size={32} color={theme.colors.text.white} />
          <Text style={styles.statValue}>{stats.notifications}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: theme.colors.warning }]}
          onPress={() => navigateToTab('Requests')}
        >
          <Ionicons name="time-outline" size={32} color={theme.colors.text.white} />
          <Text style={styles.statValue}>{totalPending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </TouchableOpacity>
      </View>

      {/* Fleet Overview Stats */}
      <View style={styles.fleetStatsRow}>
        <View style={styles.fleetStatCard}>
          <Ionicons name="people" size={24} color={theme.colors.success} />
          <Text style={styles.fleetStatValue}>{stats.activeDrivers}</Text>
          <Text style={styles.fleetStatLabel}>Active Drivers</Text>
        </View>
        
        <View style={styles.fleetStatCard}>
          <Ionicons name="car" size={24} color={theme.colors.info} />
          <Text style={styles.fleetStatValue}>{stats.activeVehicles}</Text>
          <Text style={styles.fleetStatLabel}>Active Vehicles</Text>
        </View>
      </View>

      {/* Pending Breakdown */}
      {totalPending > 0 && (
        <TouchableOpacity 
          style={styles.pendingBreakdown}
          onPress={() => navigateToTab('Requests')}
        >
          <View style={styles.pendingItem}>
            <Ionicons name="calendar" size={18} color={theme.colors.success} />
            <Text style={styles.pendingText}>{stats.pendingLeave} Leave</Text>
          </View>
          <View style={styles.pendingItem}>
            <Ionicons name="cash" size={18} color={theme.colors.warning} />
            <Text style={styles.pendingText}>{stats.pendingShare} Share Adj.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigateToTab('Requests')}
        >
          <Ionicons name="checkmark-done-outline" size={24} color={theme.colors.warning} />
          <Text style={styles.actionText}>Review Pending Requests</Text>
          {totalPending > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalPending}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.createAction]}
          onPress={openCreateModal}
        >
          <Ionicons name="add-circle" size={24} color={theme.colors.success} />
          <Text style={[styles.actionText, { color: theme.colors.success, fontWeight: '600' }]}>
            Create Share Adjustment
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.success} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigateToTab('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.admin.primary} />
          <Text style={styles.actionText}>View Notifications</Text>
          {stats.notifications > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.admin.primary }]}>
              <Text style={styles.badgeText}>{stats.notifications}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { borderBottomWidth: 0 }]}
          onPress={() => navigateToTab('My Requests')}
        >
          <Ionicons name="document-text-outline" size={24} color={theme.colors.admin.primary} />
          <Text style={styles.actionText}>My HR Requests</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={theme.colors.admin.primary} />
        <Text style={styles.infoText}>For full administrative features, please use the web portal.</Text>
      </View>

      {/* Create Share Adjustment Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Share Adjustment</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {loadingDrivers ? (
                <ActivityIndicator size="large" color={theme.colors.admin.primary} />
              ) : (
                <>
                  {/* Driver Selector */}
                  <Text style={styles.inputLabel}>Select Driver *</Text>
                  <TouchableOpacity 
                    style={styles.selectorButton}
                    onPress={() => setShowDriverSelector(true)}
                  >
                    <Text style={selectedDriver ? styles.selectorText : styles.selectorPlaceholder}>
                      {selectedDriver 
                        ? `${selectedDriver.name} (${selectedDriver.vehicle_license_plate || 'No plate'})`
                        : '-- Select a driver --'
                      }
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
                  </TouchableOpacity>

                  {/* Discount Type Selector */}
                  <Text style={styles.inputLabel}>Adjustment Type *</Text>
                  <TouchableOpacity 
                    style={styles.selectorButton}
                    onPress={() => setShowTypeSelector(true)}
                  >
                    <Text style={styles.selectorText}>{selectedTypeLabel}</Text>
                    <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
                  </TouchableOpacity>

                  {/* Date */}
                  <Text style={styles.inputLabel}>Adjustment Date *</Text>
                  <TextInput
                    style={styles.input}
                    value={discountDate}
                    onChangeText={setDiscountDate}
                    placeholder="YYYY-MM-DD"
                  />

                  {/* Days */}
                  <Text style={styles.inputLabel}>Number of Days *</Text>
                  <TextInput
                    style={styles.input}
                    value={discountDays}
                    onChangeText={setDiscountDays}
                    keyboardType="decimal-pad"
                    placeholder="e.g., 1, 2.5, 7"
                  />

                  {/* Daily Rate */}
                  <Text style={styles.inputLabel}>Daily Rate (AED) *</Text>
                  <TextInput
                    style={styles.input}
                    value={dailyRate}
                    onChangeText={setDailyRate}
                    keyboardType="decimal-pad"
                    placeholder="e.g., 120"
                  />

                  {/* Total Preview */}
                  {dailyRate && discountDays && (
                    <View style={styles.totalPreview}>
                      <Text style={styles.totalLabel}>Total Adjustment:</Text>
                      <Text style={styles.totalValue}>
                        AED {(parseFloat(dailyRate || '0') * parseFloat(discountDays || '0')).toFixed(2)}
                      </Text>
                    </View>
                  )}

                  {/* Reason */}
                  <Text style={styles.inputLabel}>Reason *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Explain why this adjustment is needed..."
                    multiline
                    numberOfLines={3}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, submitting && styles.disabledButton]}
                onPress={handleCreateShareAdjustment}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.colors.text.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Driver Selector Modal */}
      <Modal
        visible={showDriverSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDriverSelector(false)}
      >
        <View style={styles.selectorModalOverlay}>
          <View style={styles.selectorModalContent}>
            <View style={styles.selectorModalHeader}>
              <Text style={styles.selectorModalTitle}>Select Driver</Text>
              <TouchableOpacity onPress={() => setShowDriverSelector(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={drivers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectorItem,
                    selectedDriverId === item.id && styles.selectorItemSelected
                  ]}
                  onPress={() => {
                    setSelectedDriverId(item.id);
                    setShowDriverSelector(false);
                  }}
                >
                  <View style={styles.selectorItemContent}>
                    <Text style={styles.selectorItemText}>{item.name}</Text>
                    <Text style={styles.selectorItemSubtext}>
                      {item.vehicle_license_plate || 'No plate'}
                    </Text>
                  </View>
                  {selectedDriverId === item.id && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.success} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No drivers with vehicles found</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Discount Type Selector Modal */}
      <Modal
        visible={showTypeSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypeSelector(false)}
      >
        <View style={styles.selectorModalOverlay}>
          <View style={styles.selectorModalContent}>
            <View style={styles.selectorModalHeader}>
              <Text style={styles.selectorModalTitle}>Select Type</Text>
              <TouchableOpacity onPress={() => setShowTypeSelector(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={DISCOUNT_TYPES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectorItem,
                    discountType === item.value && styles.selectorItemSelected
                  ]}
                  onPress={() => {
                    setDiscountType(item.value);
                    setShowTypeSelector(false);
                  }}
                >
                  <Text style={styles.selectorItemText}>{item.label}</Text>
                  {discountType === item.value && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.success} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  greeting: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  name: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerButton: {
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
    ...theme.shadows.medium,
  },
  statValue: {
    ...theme.typography.h1,
    color: theme.colors.text.white,
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.white,
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  fleetStatsRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  fleetStatCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  fleetStatValue: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  fleetStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.medium,
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
    ...theme.typography.body1,
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
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  role: {
    ...theme.typography.caption,
    color: theme.colors.admin.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  pendingBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 8,
    gap: theme.spacing.lg,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingText: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  createAction: {
    backgroundColor: theme.colors.success + '10',
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    marginVertical: 4,
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    color: theme.colors.text.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: theme.spacing.lg,
    maxHeight: 450,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputLabel: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    ...theme.typography.body1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  totalPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '15',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginTop: theme.spacing.md,
  },
  totalLabel: {
    ...theme.typography.body1,
    color: theme.colors.success,
    fontWeight: '600',
  },
  totalValue: {
    ...theme.typography.h3,
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
  },
  submitButtonText: {
    ...theme.typography.body1,
    color: theme.colors.text.white,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Selector styles
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  selectorText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    flex: 1,
  },
  selectorPlaceholder: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  selectorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  selectorModalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  selectorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectorModalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectorItemSelected: {
    backgroundColor: theme.colors.success + '15',
  },
  selectorItemContent: {
    flex: 1,
  },
  selectorItemText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  selectorItemSubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  emptyText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
});