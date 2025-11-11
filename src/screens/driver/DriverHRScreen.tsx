import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';

export default function DriverHRScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const signatureRef = useRef<any>(null);
  
  // DateTimePicker state
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' },
  ];

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      setTempStartDate(selectedDate);
      if (Platform.OS === 'android' || event.type === 'set') {
        setStartDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      setTempEndDate(selectedDate);
      if (Platform.OS === 'android' || event.type === 'set') {
        setEndDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const confirmStartDate = () => {
    setStartDate(tempStartDate.toISOString().split('T')[0]);
    setShowStartPicker(false);
  };

  const confirmEndDate = () => {
    setEndDate(tempEndDate.toISOString().split('T')[0]);
    setShowEndPicker(false);
  };

  const handleSignature = (sig: string) => {
    setSignature(sig);
    setShowSignatureModal(false);
  };

  const handleClearSignature = () => {
    setSignature('');
    signatureRef.current?.clearSignature();
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!signature) {
      Alert.alert('Error', 'Please provide your signature');
      return;
    }

    try {
      setSubmitting(true);
      
      await backendAPI.submitLeaveRequest(
        user?.id || '',
        'driver',
        leaveType,
        startDate,
        endDate,
        reason,
        signature
      );
      
      Alert.alert(
        'Success', 
        'Leave request submitted successfully. You will be notified when it is processed.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('My Requests')
          }
        ]
      );
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveType('annual');
      setSignature('');
    } catch (error: any) {
      console.error('Leave request error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Request Leave</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Leave Type</Text>
          <View style={styles.radioGroup}>
            {leaveTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.radioButton}
                onPress={() => setLeaveType(type.value)}
              >
                <View style={[styles.radio, leaveType === type.value && styles.radioSelected]} />
                <Text style={styles.radioLabel}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={[styles.dateText, !startDate && styles.placeholderText]}>
              {startDate || 'Select start date'}
            </Text>
          </TouchableOpacity>
          
          {showStartPicker && (
            <View>
              <DateTimePicker
                value={tempStartDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.confirmButton} onPress={confirmStartDate}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>End Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={[styles.dateText, !endDate && styles.placeholderText]}>
              {endDate || 'Select end date'}
            </Text>
          </TouchableOpacity>
          
          {showEndPicker && (
            <View>
              <DateTimePicker
                value={tempEndDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndDateChange}
                minimumDate={startDate ? new Date(startDate) : new Date()}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.confirmButton} onPress={confirmEndDate}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Explain the reason for your leave request"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Signature</Text>
          {signature ? (
            <View style={styles.signaturePreview}>
              <Text style={styles.signatureText}>✓ Signature captured</Text>
              <TouchableOpacity onPress={handleClearSignature} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signatureButton}
              onPress={() => setShowSignatureModal(true)}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.driver.primary} />
              <Text style={styles.signatureButtonText}>Tap to Sign</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📋 Important Information</Text>
        <Text style={styles.infoText}>• Submit your request at least 3 days in advance</Text>
        <Text style={styles.infoText}>• Annual leave requires manager approval</Text>
        <Text style={styles.infoText}>• Emergency leave may require documentation</Text>
        <Text style={styles.infoText}>• You will be notified when your request is processed</Text>
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    
      {/* Signature Modal - Outside KeyboardAvoidingView */}
      {showSignatureModal && (
        <Modal
          visible={showSignatureModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowSignatureModal(false)}
        >
        <View style={styles.signatureModal}>
          <View style={styles.signatureHeader}>
            <Text style={styles.signatureTitle}>Sign Below</Text>
            <TouchableOpacity onPress={() => setShowSignatureModal(false)}>
              <Ionicons name="close" size={28} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.signatureCanvas}>
            <SignatureScreen
              ref={signatureRef}
              onOK={handleSignature}
              onEmpty={() => Alert.alert('Error', 'Please provide a signature')}
              descriptionText="Sign above"
              clearText="Clear"
              confirmText="Confirm"
              webStyle={`
                .m-signature-pad {
                  box-shadow: none;
                  border: 2px solid #e0e0e0;
                  border-radius: 8px;
                }
                .m-signature-pad--body {
                  border: none;
                }
                .m-signature-pad--footer {
                  display: none;
                }
              `}
            />
          </View>

          <View style={styles.signatureActions}>
            <TouchableOpacity
              style={[styles.signatureActionButton, styles.clearActionButton]}
              onPress={() => signatureRef.current?.clearSignature()}
            >
              <Text style={styles.clearActionText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.signatureActionButton, styles.confirmActionButton]}
              onPress={() => signatureRef.current?.readSignature()}
            >
              <Text style={styles.confirmActionText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )}
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  radioGroup: {
    gap: theme.spacing.sm,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.driver.primary,
    marginRight: theme.spacing.sm,
  },
  radioSelected: {
    backgroundColor: theme.colors.driver.primary,
  },
  radioLabel: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dateText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.text.secondary,
  },
  textArea: {
    minHeight: 100,
  },
  confirmButton: {
    backgroundColor: theme.colors.driver.primary,
    padding: theme.spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.driver.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  signatureButtonText: {
    color: theme.colors.driver.primary,
    fontWeight: '600',
  },
  signaturePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.success,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: theme.spacing.md,
  },
  signatureText: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  clearButtonText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  signatureModal: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  signatureTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  signatureCanvas: {
    flex: 1,
    margin: theme.spacing.lg,
  },
  signatureActions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  signatureActionButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearActionButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clearActionText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  confirmActionButton: {
    backgroundColor: theme.colors.driver.primary,
  },
  confirmActionText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: theme.colors.driver.primary,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
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
    backgroundColor: theme.colors.driver.light,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
  },
  infoTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
});