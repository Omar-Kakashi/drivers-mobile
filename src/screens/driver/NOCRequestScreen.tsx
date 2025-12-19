/**
 * NOC Request Screen
 * 
 * Allows drivers to request a No Objection Certificate
 * for working at another company.
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

export default function NOCRequestScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [previousRequests, setPreviousRequests] = useState<any[]>([]);

  useEffect(() => {
    loadPreviousRequests();
  }, []);

  const loadPreviousRequests = async () => {
    try {
      const requests = await backendAPI.getHRRequests(user?.id || '', 'noc');
      setPreviousRequests(requests || []);
    } catch (error) {
      console.error('Failed to load previous requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please enter the company name',
      });
      return;
    }

    try {
      setSubmitting(true);

      await backendAPI.createHRRequest({
        request_type: 'noc',
        user_id: user?.id || '',
        user_type: 'driver',
        data: {
          noc_type: 'work_at_another_company',
          company_name: companyName,
          purpose: purpose || 'Employment at another company',
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: 'Your NOC request has been submitted',
      });

      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to submit request:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error?.message || 'Failed to submit NOC request',
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
        <MaterialCommunityIcons name="file-certificate" size={32} color="#6366F1" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>NOC for Working at Another Company</Text>
          <Text style={styles.infoText}>
            This certificate confirms no objection to working at another company.
          </Text>
        </View>
      </View>

      {/* Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Details</Text>
        
        <Text style={styles.label}>Company Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter company name"
          placeholderTextColor={theme.colors.text.secondary}
          value={companyName}
          onChangeText={setCompanyName}
        />
        
        <Text style={styles.label}>Purpose / Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional details about your NOC request..."
          placeholderTextColor={theme.colors.text.secondary}
          multiline
          numberOfLines={4}
          value={purpose}
          onChangeText={setPurpose}
          textAlignVertical="top"
        />
      </View>

      {/* Previous Requests */}
      {previousRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previous NOC Requests</Text>
          {previousRequests.slice(0, 3).map((request, index) => (
            <View key={request.id || index} style={styles.requestItem}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestDate}>
                  {new Date(request.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.requestDetail}>{request.data?.company_name || 'NOC Request'}</Text>
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
            <Text style={styles.submitText}>Submit NOC Request</Text>
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
    backgroundColor: '#6366F120',
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
    color: '#6366F1',
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
    minHeight: 100,
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
    backgroundColor: '#6366F1',
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
