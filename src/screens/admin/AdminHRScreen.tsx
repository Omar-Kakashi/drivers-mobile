import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { backendAPI as api } from '../../api';

export default function AdminHRScreen() {
  const { user } = useAuthStore();
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', icon: 'sunny-outline' },
    { value: 'sick', label: 'Sick Leave', icon: 'medical-outline' },
    { value: 'emergency', label: 'Emergency Leave', icon: 'alert-circle-outline' },
    { value: 'unpaid', label: 'Unpaid Leave', icon: 'time-outline' },
  ];

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/leave-requests', {
        employee_id: user?.id,
        employee_type: 'admin',
        employee_name: user?.name,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
        status: 'pending',
      });

      Alert.alert(
        'Success',
        'Your leave request has been submitted and is pending approval.',
        [{ text: 'OK', onPress: () => {
          setStartDate('');
          setEndDate('');
          setReason('');
          setLeaveType('annual');
        }}]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={64} color={theme.colors.admin.primary} />
        <Text style={styles.headerTitle}>Staff Leave Request</Text>
        <Text style={styles.headerSubtitle}>{user?.name}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Request Leave</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Leave Type</Text>
          <View style={styles.leaveTypeGrid}>
            {leaveTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.leaveTypeCard,
                  leaveType === type.value && styles.leaveTypeCardSelected
                ]}
                onPress={() => setLeaveType(type.value)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={leaveType === type.value ? theme.colors.white : theme.colors.admin.primary}
                />
                <Text style={[
                  styles.leaveTypeLabel,
                  leaveType === type.value && styles.leaveTypeLabelSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Start Date</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.text.secondary}
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>End Date</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.text.secondary}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        {startDate && endDate && calculateDays() > 0 && (
          <View style={styles.durationCard}>
            <Ionicons name="time-outline" size={20} color={theme.colors.admin.primary} />
            <Text style={styles.durationText}>
              Duration: {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Reason for Leave</Text>
          <TextInput
            style={[styles.inputContainer, styles.textArea]}
            placeholder="Please provide a detailed reason for your leave request"
            placeholderTextColor={theme.colors.text.secondary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Ionicons name="send-outline" size={20} color={theme.colors.white} />
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={24} color={theme.colors.admin.primary} />
          <Text style={styles.infoTitle}>Important Information</Text>
        </View>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>Your request requires approval from senior management</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>Submit at least 7 days in advance for annual leave</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>Emergency leave may require supporting documentation</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>You will receive email notification when processed</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.admin.light,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.md,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  leaveTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  leaveTypeCard: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  leaveTypeCardSelected: {
    backgroundColor: theme.colors.admin.primary,
    borderColor: theme.colors.admin.primary,
  },
  leaveTypeLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  leaveTypeLabelSelected: {
    color: theme.colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingTop: theme.spacing.md,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.admin.light,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  durationText: {
    ...theme.typography.body,
    color: theme.colors.admin.primary,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.admin.primary,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.sm,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  infoTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  infoList: {
    gap: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  infoBullet: {
    ...theme.typography.body,
    color: theme.colors.admin.primary,
    fontWeight: 'bold',
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
});