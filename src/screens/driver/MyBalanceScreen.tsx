import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useBalanceStore } from '../../stores/balanceStore';
import { BalanceSkeleton } from '../../components/SkeletonLoader';
import { lightHaptic } from '../../utils/haptics';

export default function MyBalanceScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  
  // Use cached store
  const { 
    balance, 
    isLoading, 
    isRefreshing,
    fetchBalance 
  } = useBalanceStore();
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatAmount = (amount: any): string => {
    if (amount === null || amount === undefined) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  useEffect(() => {
    if (user?.id) {
      fetchBalance(user.id).then(() => setIsInitialLoad(false));
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lightHaptic();
    await fetchBalance(user?.id || '', true);
    setRefreshing(false);
  }, [user?.id]);

  if (isInitialLoad && isLoading) {
    return <BalanceSkeleton />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={[styles.balanceAmount, { color: parseFloat(balance?.current_balance || '0') >= 0 ? theme.colors.success : theme.colors.error }]}>
          AED {formatAmount(balance?.current_balance)}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Financial Summary</Text>
          <TouchableOpacity
            style={styles.settlementsButton}
            onPress={() => {
              lightHaptic();
              navigation.navigate('Settlements');
            }}
          >
            <Ionicons name="list-outline" size={20} color={theme.colors.driver.primary} />
            <Text style={styles.settlementsButtonText}>View History</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Opening Balance</Text>
          <Text style={[styles.summaryValue, { color: parseFloat(balance?.opening_balance || '0') >= 0 ? theme.colors.text.primary : theme.colors.error }]}>
            AED {formatAmount(balance?.opening_balance)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Uber Income</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
            AED {formatAmount(balance?.total_uber_income)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Rent Charged</Text>
          <Text style={styles.summaryValue}>AED {formatAmount(balance?.total_rent_charged)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Salik</Text>
          <Text style={styles.summaryValue}>AED {formatAmount(balance?.total_salik)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Traffic Fines</Text>
          <Text style={styles.summaryValue}>AED {formatAmount(balance?.total_traffic_fines)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Internal Fines</Text>
          <Text style={styles.summaryValue}>AED {formatAmount(balance?.total_internal_fines)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Payments Received</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
            AED {formatAmount(balance?.total_payments_received)}
          </Text>
        </View>
      </View>

      {balance?.last_settlement_date && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last Settlement</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>
              {new Date(balance.last_settlement_date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={[styles.summaryValue, { 
              color: balance.settlement_status === 'completed' ? theme.colors.success : theme.colors.warning 
            }]}>
              {balance.settlement_status === 'completed' ? '✓ Completed' : '⏳ Pending'}
            </Text>
          </View>
          {balance.is_in_shared_assignment && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Assignment Type</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.driver.primary }]}>
                🤝 Shared Vehicle
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>💡 Balance is calculated in real-time from your transaction history. Tap "View History" to see detailed breakdown.</Text>
      </View>

      {/* Request Adjustment Button */}
      <TouchableOpacity
        style={styles.adjustmentButton}
        onPress={() => {
          lightHaptic();
          navigation.navigate('ShareAdjustmentRequest');
        }}
      >
        <MaterialCommunityIcons name="file-document-edit" size={24} color={theme.colors.text.white} />
        <View style={styles.adjustmentButtonContent}>
          <Text style={styles.adjustmentButtonTitle}>Request Share Adjustment</Text>
          <Text style={styles.adjustmentButtonSubtitle}>For workshop days, accidents, etc.</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={theme.colors.text.white} />
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  balanceCard: {
    backgroundColor: theme.colors.driver.primary,
    margin: theme.spacing.md,
    padding: theme.spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  balanceLabel: {
    ...theme.typography.body1,
    color: theme.colors.text.white,
    opacity: 0.9,
    marginBottom: theme.spacing.sm,
  },
  balanceAmount: {
    ...theme.typography.h1,
    color: theme.colors.text.white,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: theme.colors.text.white,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  settlementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.driver.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  settlementsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.driver.primary,
    marginLeft: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryLabel: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: theme.colors.driver.light,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
  },
  infoText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  adjustmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.driver.primary,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.medium,
  },
  adjustmentButtonContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  adjustmentButtonTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.white,
    fontWeight: '600',
  },
  adjustmentButtonSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.white,
    opacity: 0.8,
    marginTop: 2,
  },
});