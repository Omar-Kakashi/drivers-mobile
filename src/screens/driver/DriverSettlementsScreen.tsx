/**
 * Driver Settlements Screen - View monthly settlement details
 * Mobile-only screen for drivers to see their settlement breakdowns
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
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import { Settlement } from '../../types';

export default function DriverSettlementsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadSettlements();
    }
  }, [user, selectedMonth, selectedYear]);

  const loadSettlements = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await backendAPI.getSettlements({
        driver_id: user?.id || '',
        month: selectedMonth,
        year: selectedYear,
      });
      setSettlements(data);
    } catch (error) {
      console.error('Error loading settlements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadSettlements(true);
  };

  const toggleExpand = (id: string | undefined) => {
    if (!id) return;
    setExpandedId(expandedId === id ? null : id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return theme.colors.success;
      case 'approved':
        return theme.colors.driver.primary;
      case 'pending':
        return theme.colors.warning;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'checkmark-circle';
      case 'approved':
        return 'checkmark';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const renderMonthSelector = () => (
    <View style={styles.monthSelector}>
      <TouchableOpacity style={styles.monthArrow} onPress={goToPreviousMonth}>
        <Ionicons name="chevron-back" size={24} color={theme.colors.driver.primary} />
      </TouchableOpacity>
      <View style={styles.monthDisplay}>
        <Text style={styles.monthText}>
          {getMonthName(selectedMonth)} {selectedYear}
        </Text>
      </View>
      <TouchableOpacity style={styles.monthArrow} onPress={goToNextMonth}>
        <Ionicons name="chevron-forward" size={24} color={theme.colors.driver.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderSettlementCard = (settlement: Settlement) => {
    const isExpanded = expandedId === settlement.id;

    return (
      <TouchableOpacity
        key={settlement.id}
        style={styles.settlementCard}
        onPress={() => toggleExpand(settlement.id)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.settlementHeader}>
          <View style={styles.settlementHeaderLeft}>
            <Ionicons
              name={getStatusIcon(settlement.status)}
              size={24}
              color={getStatusColor(settlement.status)}
            />
            <View style={styles.settlementHeaderText}>
              <Text style={styles.settlementPeriod}>
                {getMonthName(settlement.settlement_month)} {settlement.settlement_year}
              </Text>
              <Text style={[styles.settlementStatus, { color: getStatusColor(settlement.status) }]}>
                {settlement.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.settlementHeaderRight}>
            <Text style={[styles.settlementAmount, { color: settlement.net_balance >= 0 ? theme.colors.success : theme.colors.error }]}>
              {formatCurrency(Math.abs(settlement.net_balance))}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.text.secondary}
            />
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.settlementDetails}>
            <View style={styles.detailsDivider} />

            {/* Income Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>INCOME</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Uber Income</Text>
                <Text style={[styles.detailValue, styles.positiveValue]}>
                  +{formatCurrency(settlement.total_uber)}
                </Text>
              </View>
              {settlement.other_credits > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Other Credits</Text>
                  <Text style={[styles.detailValue, styles.positiveValue]}>
                    +{formatCurrency(settlement.other_credits)}
                  </Text>
                </View>
              )}
            </View>

            {/* Deductions Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>DEDUCTIONS</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rent</Text>
                <Text style={[styles.detailValue, styles.negativeValue]}>
                  -{formatCurrency(settlement.total_rent)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Salik</Text>
                <Text style={[styles.detailValue, styles.negativeValue]}>
                  -{formatCurrency(settlement.total_salik)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fines</Text>
                <Text style={[styles.detailValue, styles.negativeValue]}>
                  -{formatCurrency(settlement.total_fines)}
                </Text>
              </View>
              {settlement.total_other_deductions > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Other Deductions</Text>
                  <Text style={[styles.detailValue, styles.negativeValue]}>
                    -{formatCurrency(settlement.total_other_deductions)}
                  </Text>
                </View>
              )}
              {settlement.workshop_credit > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Workshop Credit</Text>
                  <Text style={[styles.detailValue, styles.negativeValue]}>
                    -{formatCurrency(settlement.workshop_credit)}
                  </Text>
                </View>
              )}
            </View>

            {/* Payments Section */}
            {settlement.total_paid > 0 && (
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>PAYMENTS</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Paid</Text>
                  <Text style={[styles.detailValue, styles.positiveValue]}>
                    +{formatCurrency(settlement.total_paid)}
                  </Text>
                </View>
              </View>
            )}

            {/* Summary Section */}
            <View style={[styles.detailsSection, styles.summarySection]}>
              <View style={styles.detailRow}>
                <Text style={styles.summaryLabel}>Net Settlement</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(settlement.net_balance)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(settlement.total_paid)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Balance After Payment</Text>
                <Text
                  style={[
                    styles.totalValue,
                    { color: settlement.balance_after_payment >= 0 ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  {formatCurrency(settlement.balance_after_payment)}
                </Text>
              </View>
            </View>

            {/* Dates */}
            <View style={styles.datesSection}>
              <Text style={styles.dateText}>Settlement Date: {formatDate(settlement.settlement_date)}</Text>
              {settlement.created_at && (
                <Text style={styles.dateText}>Created: {formatDate(settlement.created_at)}</Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.driver.primary} />
        <Text style={styles.loadingText}>Loading settlements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderMonthSelector()}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {settlements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.text.secondary} />
            <Text style={styles.emptyText}>No settlements found</Text>
            <Text style={styles.emptySubtext}>
              No settlement records for {getMonthName(selectedMonth)} {selectedYear}
            </Text>
          </View>
        ) : (
          <View style={styles.settlementsContainer}>
            {settlements.map(renderSettlementCard)}
          </View>
        )}
      </ScrollView>
    </View>
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
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  monthArrow: {
    padding: 8,
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  settlementsContainer: {
    padding: 16,
  },
  settlementCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settlementHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settlementHeaderText: {
    marginLeft: 12,
  },
  settlementPeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  settlementStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  settlementHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settlementAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  settlementDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  positiveValue: {
    color: theme.colors.success,
  },
  negativeValue: {
    color: theme.colors.error,
  },
  summarySection: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  datesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
});
