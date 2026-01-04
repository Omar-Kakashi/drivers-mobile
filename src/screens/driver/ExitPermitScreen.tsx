/**
 * Exit Permit (Early Leave) Request Screen
 * 
 * Allows drivers to request permission to leave early for a day.
 * إذن خروج
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

const LEAVE_TIMES = [
  { id: '10:00', label: '10:00 AM' },
  { id: '11:00', label: '11:00 AM' },
  { id: '12:00', label: '12:00 PM' },
  { id: '13:00', label: '1:00 PM' },
  { id: '14:00', label: '2:00 PM' },
  { id: '15:00', label: '3:00 PM' },
  { id: '16:00', label: '4:00 PM' },
  { id: '17:00', label: '5:00 PM' },
];

export default function ExitPermitScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [previousRequests, setPreviousRequests] = useState<any[]>([]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    loadPreviousRequests();
  }, []);

  const loadPreviousRequests = async () => {
    try {
      const requests = await backendAPI.getHRRequests(user?.id || '', 'early_leave');
      setPreviousRequests(requests || []);
    } catch (error) {
      console.error('Failed to load previous requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTime) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please select a departure time',
      });
      return;
    }

    if (!reason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please provide a reason for early leave',
      });
      return;
    }

    try {
      setSubmitting(true);

      await backendAPI.createHRRequest({
        request_type: 'early_leave',
        user_id: user?.id || '',
        user_type: 'driver',
        data: {
          date: new Date().toISOString().split('T')[0],
          departure_time: selectedTime,
          reason: reason,
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: 'Your exit permit request has been submitted',
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
        <Ionicons name="time" size={32} color="#EC4899" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Exit Permit - إذن خروج</Text>
          <Text style={styles.infoText}>
            Request permission to leave work early today.
          </Text>
        </View>
      </View>

      {/* Today's Date */}
      <View style={styles.dateCard}>
        <Ionicons name="calendar" size={24} color={theme.colors.driver.primary} />
        <Text style={styles.dateText}>{today}</Text>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Departure Time</Text>
        <View style={styles.timeGrid}>
          {LEAVE_TIMES.map((time) => (
            <TouchableOpacity
              key={time.id}
              style={[
                styles.timeButton,
                selectedTime === time.id && styles.timeButtonSelected,
              ]}
              onPress={() => setSelectedTime(time.id)}
            >
              <Text
                style={[
                  styles.timeText,
                  selectedTime === time.id && styles.timeTextSelected,
                ]}
              >
                {time.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reason */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reason <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Please explain why you need to leave early..."
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
          <Text style={styles.sectionTitle}>Recent Exit Permits</Text>
          {previousRequests.slice(0, 3).map((request, index) => (
            <View key={request.id || index} style={styles.requestItem}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestDate}>
                  {new Date(request.data?.date || request.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.requestDetail}>
                  Leave at {request.data?.departure_time || 'N/A'}
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
            <Text style={styles.submitText}>Submit Exit Permit</Text>
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
    backgroundColor: '#EC489920',
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...theme.typography.h4,
    color: '#EC4899',
    marginBottom: 4,
  },
  infoText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.lg,
    gap: 12,
    ...theme.shadows.small,
  },
  dateText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    flex: 1,
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
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeButton: {
    width: '23%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  timeButtonSelected: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  timeText: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  timeTextSelected: {
    color: theme.colors.text.white,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.surface,
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
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
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
    backgroundColor: '#EC4899',
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
