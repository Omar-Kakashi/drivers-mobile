/**
 * Driver Transaction History Screen - View detailed transaction breakdown
 * Replaces DriverSettlementsScreen with real-time transaction data
 * Matches web app implementation (DriverBalanceScreen.tsx)
 * Enhanced with skeleton loading and haptic feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import { TransactionListSkeleton } from '../../components/SkeletonLoader';
import { lightHaptic, selectionHaptic } from '../../utils/haptics';

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  description: string;
  amount: number;
  running_balance: number;
}

interface TransactionData {
  transactions: Transaction[];
  total_count: number;
  month: number;
  year: number;
  opening_balance: number;
  total_income: number;
  total_expenses: number;
  net_change: number;
  current_balance: number;
}

export default function DriverTransactionHistoryScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<TransactionData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState<string>('all');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user, selectedMonth, selectedYear, filterType]);

  const loadTransactions = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (isInitialLoad) {
      setLoading(true);
    }

    try {
      const result = await backendAPI.getDriverTransactions(
        user?.id || '',
        selectedMonth,
        selectedYear,
        filterType === 'all' ? undefined : filterType
      );
      setData(result);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsInitialLoad(false);
    }
  };

  const handleRefresh = useCallback(() => {
    lightHaptic();
    loadTransactions(true);
  }, [selectedMonth, selectedYear, filterType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleDateString('en-US', { month: 'long' });
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'income':
        return 'cash-outline';
      case 'payment':
        return 'card-outline';
      case 'rent':
        return 'car-outline';
      case 'salik':
      case 'darb':
        return 'navigate-outline';
      case 'traffic_fine':
      case 'internal_fine':
        return 'warning-outline';
      case 'adjustment':
        return 'settings-outline';
      default:
        return 'document-text-outline';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'income':
      case 'payment':
        return theme.colors.success;
      case 'traffic_fine':
      case 'internal_fine':
        return theme.colors.error;
      case 'rent':
      case 'salik':
      case 'darb':
        return theme.colors.warning;
      default:
        return theme.colors.text.primary;
    }
  };

  const changeMonth = (delta: number) => {
    selectionHaptic();
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIcon}>
          <Ionicons
            name={getTransactionIcon(item.transaction_type) as any}
            size={24}
            color={getTransactionColor(item.transaction_type)}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.transaction_date)}</Text>
        </View>
        <View style={styles.transactionAmounts}>
          <Text
            style={[
              styles.transactionAmount,
              { color: item.amount >= 0 ? theme.colors.success : theme.colors.error },
            ]}
          >
            {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
          </Text>
          <Text style={styles.runningBalance}>Bal: {formatCurrency(item.running_balance)}</Text>
        </View>
      </View>
    </View>
  );

  if (isInitialLoad && loading) {
    return <TransactionListSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Month Navigator */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.driver.primary} />
        </TouchableOpacity>
        <View style={styles.monthDisplay}>
          <Text style={styles.monthText}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
        </View>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.driver.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'income', 'rent', 'salik', 'traffic_fine', 'payment'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => {
                selectionHaptic();
                setFilterType(type);
              }}
              style={[
                styles.filterButton,
                filterType === type && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === type && styles.filterButtonTextActive,
                ]}
              >
                {type === 'all' ? 'All' : type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Summary Card */}
      {data && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Opening Balance</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(data.opening_balance)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
              +{formatCurrency(data.total_income)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
              -{formatCurrency(Math.abs(data.total_expenses))}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabelTotal}>Current Balance</Text>
            <Text
              style={[
                styles.summaryValueTotal,
                { color: data.current_balance >= 0 ? theme.colors.success : theme.colors.error },
              ]}
            >
              {formatCurrency(data.current_balance)}
            </Text>
          </View>
        </View>
      )}

      {/* Transactions List */}
      <FlatList
        data={data?.transactions || []}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.text.disabled} />
            <Text style={styles.emptyText}>No transactions for this period</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  monthButton: {
    padding: theme.spacing.sm,
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.driver.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryRowTotal: {
    borderBottomWidth: 0,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderTopWidth: 2,
    borderTopColor: theme.colors.driver.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  summaryLabelTotal: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  transactionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  runningBalance: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});
