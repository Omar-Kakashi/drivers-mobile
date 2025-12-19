/**
 * Traffic Fines Screen
 * 
 * Displays list of traffic fines for the driver with payment status.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import Toast from 'react-native-toast-message';

interface Fine {
  id: string;
  fine_number: string;
  violation_type: string;
  amount: number;
  fine_date: string;
  license_plate: string;
  location?: string;
  status: 'pending' | 'paid' | 'deducted';
  source?: string;
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const formatAmount = (amount: any): string => {
  if (amount === null || amount === undefined) return 'AED 0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return `AED ${isNaN(num) ? '0.00' : num.toFixed(2)}`;
};

const getFineTypeIcon = (violationType: string): string => {
  const type = (violationType || '').toLowerCase();
  if (type.includes('speed') || type.includes('radar')) return 'speedometer';
  if (type.includes('parking')) return 'car';
  if (type.includes('signal') || type.includes('light') || type.includes('red')) return 'traffic-light';
  if (type.includes('lane')) return 'road';
  if (type.includes('seatbelt') || type.includes('belt')) return 'seatbelt';
  if (type.includes('phone') || type.includes('mobile')) return 'cellphone-off';
  if (type.includes('salik')) return 'gate';
  return 'alert-circle';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return theme.colors.success;
    case 'deducted':
      return '#6366F1'; // Indigo
    case 'pending':
    default:
      return theme.colors.error;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'paid':
      return 'PAID';
    case 'deducted':
      return 'DEDUCTED';
    case 'pending':
    default:
      return 'PENDING';
  }
};

export default function TrafficFinesScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fines, setFines] = useState<Fine[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    loadFines();
  }, []);

  const loadFines = async () => {
    try {
      const response = await backendAPI.getDriverTrafficFines(user?.id || '');
      const data = response?.fines || [];
      setFines(data);
      
      // Use totals from API response
      setTotalPending(response?.total_amount || 0);
      setTotalPaid(0); // Traffic fines from RTA don't have paid tracking yet
    } catch (error) {
      console.error('Failed to load fines:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load traffic fines' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFines();
  };

  const handlePayPress = () => {
    Toast.show({
      type: 'info',
      text1: 'Coming Soon',
      text2: 'Online payment will be available soon',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.driver.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.pendingCard]}>
          <MaterialCommunityIcons name="alert-circle" size={28} color={theme.colors.error} />
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryAmount, { color: theme.colors.error }]}>
            {formatAmount(totalPending)}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.paidCard]}>
          <Ionicons name="checkmark-circle" size={28} color={theme.colors.success} />
          <Text style={styles.summaryLabel}>Paid/Deducted</Text>
          <Text style={[styles.summaryAmount, { color: theme.colors.success }]}>
            {formatAmount(totalPaid)}
          </Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color={theme.colors.info} />
        <Text style={styles.infoText}>
          Traffic fines are automatically added to your balance. Pending fines will be deducted from your next settlement.
        </Text>
      </View>

      {/* Fines List */}
      <Text style={styles.sectionTitle}>Traffic Fines ({fines.length})</Text>
      
      {fines.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="check-decagram" size={64} color={theme.colors.success} />
          <Text style={styles.emptyTitle}>No Traffic Fines! 🎉</Text>
          <Text style={styles.emptyText}>
            You have no recorded traffic fines. Keep up the safe driving!
          </Text>
        </View>
      ) : (
        fines.map((fine) => (
          <View key={fine.id} style={styles.fineCard}>
            <View style={styles.fineHeader}>
              <View style={styles.fineIconContainer}>
                <MaterialCommunityIcons
                  name={getFineTypeIcon(fine.violation_type) as any}
                  size={24}
                  color={theme.colors.driver.primary}
                />
              </View>
              <View style={styles.fineInfo}>
                <Text style={styles.fineType}>{fine.violation_type || 'Traffic Fine'}</Text>
                <Text style={styles.fineMeta}>
                  {fine.license_plate} • {formatDate(fine.fine_date)}
                </Text>
                {fine.fine_number && (
                  <Text style={styles.fineNumber}>#{fine.fine_number}</Text>
                )}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fine.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(fine.status) }]}>
                  {getStatusLabel(fine.status)}
                </Text>
              </View>
            </View>
            
            <View style={styles.fineDivider} />
            
            <View style={styles.fineFooter}>
              <View>
                {fine.location && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.locationText}>{fine.location}</Text>
                  </View>
                )}
                {fine.source && (
                  <Text style={styles.sourceText}>Source: {fine.source}</Text>
                )}
              </View>
              <Text style={styles.fineAmount}>{formatAmount(fine.amount)}</Text>
            </View>
          </View>
        ))
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Status Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
            <Text style={styles.legendText}>Pending - Awaiting payment</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
            <Text style={styles.legendText}>Deducted - From settlement</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
            <Text style={styles.legendText}>Paid - Directly paid</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  paidCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
  summaryAmount: {
    ...theme.typography.h3,
    fontWeight: '700',
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '15',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.lg,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl * 2,
    borderRadius: 12,
    ...theme.shadows.sm,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.success,
    marginTop: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  fineCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  fineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fineIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.driver.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fineInfo: {
    flex: 1,
  },
  fineType: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  fineMeta: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  fineNumber: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    fontSize: 10,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
  fineDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  fineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  notesText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  sourceText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginTop: 4,
    fontSize: 10,
  },
  fineAmount: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.driver.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  payButtonText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '600',
  },
  legend: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginTop: theme.spacing.md,
  },
  legendTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  legendItems: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
});
