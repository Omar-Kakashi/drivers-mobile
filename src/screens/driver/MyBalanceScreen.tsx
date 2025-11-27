import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';

export default function MyBalanceScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<any>(null);

  const loadBalance = async () => {
    try {
      const balance = await backendAPI.getDriverBalance(user?.id || '');
      setBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatAmount = (amount: any): string => {
    if (amount === null || amount === undefined) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  useEffect(() => {
    if (user?.id) {
      loadBalance();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBalance();
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
            onPress={() => navigation.navigate('Settlements')}
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
  balanceCard: {
    backgroundColor: theme.colors.driver.primary,
    margin: theme.spacing.md,
    padding: theme.spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  balanceLabel: {
    ...theme.typography.body,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing.sm,
  },
  balanceAmount: {
    ...theme.typography.h1,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.md,
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
    ...theme.typography.body,
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
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});