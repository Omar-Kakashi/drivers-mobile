/**
 * Salary Certificate Request Screen
 * 
 * Allows drivers to request a salary certificate
 * for banks, embassies, visa applications, etc.
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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import Toast from 'react-native-toast-message';

const PURPOSES = [
  { id: 'bank_loan', label: 'Bank Loan Application', icon: 'business' },
  { id: 'visa', label: 'Visa Application', icon: 'airplane' },
  { id: 'embassy', label: 'Embassy Requirement', icon: 'flag' },
  { id: 'rental', label: 'Apartment Rental', icon: 'home' },
  { id: 'other', label: 'Other Purpose', icon: 'document-text' },
];

export default function SalaryCertificateScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [addressedTo, setAddressedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [previousRequests, setPreviousRequests] = useState<any[]>([]);

  useEffect(() => {
    loadPreviousRequests();
  }, []);

  const loadPreviousRequests = async () => {
    try {
      const requests = await backendAPI.getHRRequests(user?.id || '', 'salary_certificate');
      setPreviousRequests(requests || []);
    } catch (error) {
      console.error('Failed to load previous requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPurpose) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please select a purpose',
      });
      return;
    }

    if (!addressedTo.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please specify who the certificate should be addressed to',
      });
      return;
    }

    try {
      setSubmitting(true);

      await backendAPI.createHRRequest({
        request_type: 'salary_certificate',
        user_id: user?.id || '',
        user_type: 'driver',
        data: {
          purpose: selectedPurpose,
          addressed_to: addressedTo,
          notes: notes || undefined,
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: 'Your salary certificate request has been submitted',
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
        <Ionicons name="document-text" size={32} color="#F59E0B" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Salary Certificate</Text>
          <Text style={styles.infoText}>
            Certificate includes: Employee name, position, salary, and employment duration.
          </Text>
        </View>
      </View>

      {/* Purpose Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What will this certificate be used for?</Text>
        <View style={styles.purposeGrid}>
          {PURPOSES.map((purpose) => (
            <TouchableOpacity
              key={purpose.id}
              style={[
                styles.purposeCard,
                selectedPurpose === purpose.id && styles.purposeCardSelected,
              ]}
              onPress={() => setSelectedPurpose(purpose.id)}
            >
              <Ionicons
                name={purpose.icon as any}
                size={24}
                color={selectedPurpose === purpose.id ? theme.colors.white : '#F59E0B'}
              />
              <Text
                style={[
                  styles.purposeText,
                  selectedPurpose === purpose.id && styles.purposeTextSelected,
                ]}
              >
                {purpose.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Certificate Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certificate Details</Text>
        
        <Text style={styles.label}>Addressed To <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Bank Name, Embassy, Company..."
          placeholderTextColor={theme.colors.text.secondary}
          value={addressedTo}
          onChangeText={setAddressedTo}
        />
        
        <Text style={styles.label}>Additional Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any specific requirements or additional details..."
          placeholderTextColor={theme.colors.text.secondary}
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
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
                  {PURPOSES.find(p => p.id === request.data?.purpose)?.label || 'Salary Certificate'}
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
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <>
            <Ionicons name="send" size={20} color={theme.colors.white} />
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
    backgroundColor: '#F59E0B20',
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
    color: '#F59E0B',
    marginBottom: 4,
  },
  infoText: {
    ...theme.typography.body,
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
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  purposeCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  purposeCardSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  purposeText: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  purposeTextSelected: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  required: {
    color: theme.colors.error,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  textArea: {
    minHeight: 80,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
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
    ...theme.typography.body,
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
    color: theme.colors.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  submitText: {
    ...theme.typography.h4,
    color: theme.colors.white,
    fontWeight: '600',
  },
});
