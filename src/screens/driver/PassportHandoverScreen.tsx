import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';

export default function PassportHandoverScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [handoverDate, setHandoverDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const signatureRef = useRef<any>(null);
  
  // DateTimePicker state
  const [showHandoverPicker, setShowHandoverPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [tempHandoverDate, setTempHandoverDate] = useState(new Date());
  const [tempReturnDate, setTempReturnDate] = useState(new Date());

  const purposeOptions = [
    { value: 'visa_renewal', label: 'Visa Renewal' },
    { value: 'other', label: 'Passport Renewal' },
    { value: 'vacation', label: 'Vacation / Travel' },
    { value: 'medical', label: 'Medical Services' },
    { value: 'emergency', label: 'Emergency' },
  ];

  const handleHandoverDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowHandoverPicker(false);
    }
    if (selectedDate) {
      setTempHandoverDate(selectedDate);
      if (Platform.OS === 'android' || event.type === 'set') {
        setHandoverDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const handleReturnDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowReturnPicker(false);
    }
    if (selectedDate) {
      setTempReturnDate(selectedDate);
      if (Platform.OS === 'android' || event.type === 'set') {
        setExpectedReturnDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const confirmHandoverDate = () => {
    setHandoverDate(tempHandoverDate.toISOString().split('T')[0]);
    setShowHandoverPicker(false);
  };

  const confirmReturnDate = () => {
    setExpectedReturnDate(tempReturnDate.toISOString().split('T')[0]);
    setShowReturnPicker(false);
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
    if (!handoverDate || !expectedReturnDate || !purpose.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!signature) {
      Alert.alert('Error', 'Please provide your signature');
      return;
    }

    try {
      setSubmitting(true);
      
      await backendAPI.submitPassportHandover(
        user?.id || '',
        'driver',              // Specify user type
        handoverDate,
        expectedReturnDate,
        purpose,
        notes,
        signature
      );
      
      Alert.alert(
        'Success', 
        'Passport handover request submitted successfully. Management will review and acknowledge.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('My Requests')
          }
        ]
      );
      
      // Reset form
      setHandoverDate('');
      setExpectedReturnDate('');
      setPurpose('');
      setNotes('');
      setSignature('');
    } catch (error: any) {
      console.error('Passport handover error:', error.response?.data?.detail || error.message || error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit passport handover request');
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
            <View style={styles.header}>
              <Ionicons name="document-lock" size={48} color={theme.colors.driver.primary} />
              <View style={styles.headerText}>
                <Text style={styles.cardTitle}>Passport Handover Request</Text>
                <Text style={styles.subtitle}>Submit passport for official procedures</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Handover Date *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowHandoverPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={[styles.dateText, !handoverDate && styles.placeholderText]}>
                  {handoverDate || 'When will you submit the passport?'}
                </Text>
              </TouchableOpacity>
              
              {showHandoverPicker && (
                <View>
                  <DateTimePicker
                    value={tempHandoverDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleHandoverDateChange}
                    minimumDate={new Date()}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={styles.confirmButton} onPress={confirmHandoverDate}>
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Expected Return Date *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowReturnPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={[styles.dateText, !expectedReturnDate && styles.placeholderText]}>
                  {expectedReturnDate || 'When should it be returned?'}
                </Text>
              </TouchableOpacity>
              
              {showReturnPicker && (
                <View>
                  <DateTimePicker
                    value={tempReturnDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleReturnDateChange}
                    minimumDate={handoverDate ? new Date(handoverDate) : new Date()}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={styles.confirmButton} onPress={confirmReturnDate}>
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Purpose *</Text>
              <View style={styles.radioGroup}>
                {purposeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.radioButton}
                    onPress={() => setPurpose(option.value)}
                  >
                    <View style={[styles.radio, purpose === option.value && styles.radioSelected]} />
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any additional information about the request"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Your Signature *</Text>
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
                {submitting ? 'Submitting...' : 'Submit Handover Request'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color={theme.colors.warning} />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>⚠️ Important Guidelines</Text>
              <Text style={styles.warningText}>• Passport will be held by HR for official procedures only</Text>
              <Text style={styles.warningText}>• Expected return date is an estimate and may vary</Text>
              <Text style={styles.warningText}>• You will be notified when passport is ready for collection</Text>
              <Text style={styles.warningText}>• Management approval is required for this request</Text>
              <Text style={styles.warningText}>• Original passport must be in good condition</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    
      {/* Signature Modal */}
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
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body1,
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
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
  textArea: {
    minHeight: 100,
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
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    backgroundColor: theme.colors.driver.primary,
    padding: theme.spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  confirmButtonText: {
    color: theme.colors.text.white,
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
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.text.white,
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
    color: theme.colors.text.white,
  },
  warningCard: {
    backgroundColor: '#fff3e0',
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  warningText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
});
