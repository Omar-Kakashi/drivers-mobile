/**
 * Loan Certificate (Salary Advance) Request Screen
 * 
 * Allows drivers to request a salary advance / loan.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import Toast from 'react-native-toast-message';

const LOAN_AMOUNTS = [500, 1000, 1500, 2000, 2500, 3000];

const REPAYMENT_TERMS = [
  { id: '1_month', label: '1 Month', months: 1 },
  { id: '2_months', label: '2 Months', months: 2 },
  { id: '3_months', label: '3 Months', months: 3 },
  { id: '6_months', label: '6 Months', months: 6 },
];

export default function LoanCertificateScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [repaymentTerm, setRepaymentTerm] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [previousRequests, setPreviousRequests] = useState<any[]>([]);

  useEffect(() => {
    loadPreviousRequests();
  }, []);

  const loadPreviousRequests = async () => {
    try {
      const requests = await backendAPI.getHRRequests(user?.id || '', 'loan_certificate');
      setPreviousRequests(requests || []);
    } catch (error) {
      console.error('Failed to load previous requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedAmount = (): number => {
    if (amount) return amount;
    if (customAmount) return parseFloat(customAmount) || 0;
    return 0;
  };

  const getMonthlyPayment = (): number => {
    const total = getSelectedAmount();
    const term = REPAYMENT_TERMS.find(t => t.id === repaymentTerm);
    if (!term || total === 0) return 0;
    return total / term.months;
  };

  const handleSubmit = async () => {
    const selectedAmount = getSelectedAmount();
    
    if (selectedAmount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please select or enter a loan amount',
      });
      return;
    }

    if (!repaymentTerm) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please select a repayment term',
      });
      return;
    }

    if (!reason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please provide a reason for the loan',
      });
      return;
    }

    try {
      setSubmitting(true);

      const term = REPAYMENT_TERMS.find(t => t.id === repaymentTerm);
      
      await backendAPI.createHRRequest({
        request_type: 'loan_certificate',
        user_id: user?.id || '',
        user_type: 'driver',
        data: {
          amount: selectedAmount,
          repayment_term: repaymentTerm,
          repayment_months: term?.months || 1,
          monthly_payment: getMonthlyPayment(),
          reason: reason,
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: 'Your loan request has been submitted for approval',
      });

      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to submit request:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error?.message || 'Failed to submit request',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.driver.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Info */}
      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="cash-multiple" size={32} color="#EF4444" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Salary Advance Request</Text>
          <Text style={styles.infoText}>
            Request a salary advance that will be deducted from your future earnings.
          </Text>
        </View>
      </View>

      {/* Amount Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Amount (AED)</Text>
        <View style={styles.amountGrid}>
          {LOAN_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[
                styles.amountButton,
                amount === amt && styles.amountButtonSelected,
              ]}
              onPress={() => {
                setAmount(amt);
                setCustomAmount('');
              }}
            >
              <Text
                style={[
                  styles.amountText,
                  amount === amt && styles.amountTextSelected,
                ]}
              >
                {amt.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.orText}>OR enter custom amount</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="numeric"
          value={customAmount}
          onChangeText={(text) => {
            setCustomAmount(text);
            setAmount(null);
          }}
        />
      </View>

      {/* Repayment Term */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repayment Term</Text>
        <View style={styles.termGrid}>
          {REPAYMENT_TERMS.map((term) => (
            <TouchableOpacity
              key={term.id}
              style={[
                styles.termButton,
                repaymentTerm === term.id && styles.termButtonSelected,
              ]}
              onPress={() => setRepaymentTerm(term.id)}
            >
              <Text
                style={[
                  styles.termText,
                  repaymentTerm === term.id && styles.termTextSelected,
                ]}
              >
                {term.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {getSelectedAmount() > 0 && repaymentTerm && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Monthly Deduction:</Text>
            <Text style={styles.summaryValue}>
              AED {getMonthlyPayment().toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* Reason */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reason for Request <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Please explain why you need this advance..."
          placeholderTextColor={theme.colors.text.secondary}
          multiline
          numberOfLines={4}
          value={reason}
          onChangeText={setReason}
          textAlignVertical="top"
        />
      </View>

      {/* Previous Requests */}
      {previousRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previous Requests</Text>
          {previousRequests.slice(0, 3).map((request, index) => (
            <View key={request.id || index} style={styles.requestItem}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestDate}>
                  {new Date(request.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.requestDetail}>
                  AED {request.data?.amount?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                <Text style={styles.statusText}>{request.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={theme.colors.text.white} />
        ) : (
          <>
            <Ionicons name="send" size={20} color={theme.colors.text.white} />
            <Text style={styles.submitText}>Submit Request</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return '#F59E0B';
    case 'approved': return '#10B981';
    case 'rejected': return '#EF4444';
    default: return '#6B7280';
  }
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EF444420',
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginBottom: theme.spacing.lg,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...theme.typography.h4,
    color: '#EF4444',
    marginBottom: 4,
  },
  infoText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  required: {
    color: theme.colors.error,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  amountButton: {
    width: '31%',
    backgroundColor: theme.colors.text.white,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  amountButtonSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  amountText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
  },
  amountTextSelected: {
    color: theme.colors.text.white,
  },
  orText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.text.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  termGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  termButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.text.white,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  termButtonSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  termText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  termTextSelected: {
    color: theme.colors.text.white,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20',
    padding: theme.spacing.md,
    borderRadius: 12,
  },
  summaryLabel: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    ...theme.typography.h3,
    color: theme.colors.success,
    fontWeight: '700',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.text.white,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestDate: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  requestDetail: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.text.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadows.medium,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  submitText: {
    ...theme.typography.h4,
    color: theme.colors.text.white,
    fontWeight: '600',
  },
});
