import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, Modal, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';

export default function LeaveReturnScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [returnDate, setReturnDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const signatureRef = useRef<any>(null);
  
  // Approved leave requests state
  const [approvedLeaveRequests, setApprovedLeaveRequests] = useState<any[]>([]);
  const [selectedLeaveRequestId, setSelectedLeaveRequestId] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(true);
  
  // DateTimePicker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // Fetch approved leave requests on mount
  useEffect(() => {
    const fetchApprovedLeaves = async () => {
      try {
        setLoadingRequests(true);
        const requests = await backendAPI.getLeaveRequests(user?.id || '', 'driver');
        // Filter for approved requests only
        const approved = requests.filter((r: any) => r.status === 'approved' || r.status === 'active');
        setApprovedLeaveRequests(approved);
        
        // Auto-select if only one approved leave
        if (approved.length === 1) {
          setSelectedLeaveRequestId(approved[0].id);
        }
      } catch (error: any) {
        console.error('Error fetching leave requests:', error);
        Alert.alert('Error', 'Failed to load your leave requests');
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchApprovedLeaves();
  }, [user?.id]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android' || event.type === 'set') {
        setReturnDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const confirmDate = () => {
    setReturnDate(tempDate.toISOString().split('T')[0]);
    setShowDatePicker(false);
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
    if (!selectedLeaveRequestId) {
      Alert.alert('Error', 'Please select the leave you are returning from');
      return;
    }

    if (!returnDate) {
      Alert.alert('Error', 'Please select your return date');
      return;
    }

    if (!signature) {
      Alert.alert('Error', 'Please provide your signature');
      return;
    }

    try {
      setSubmitting(true);
      
      await backendAPI.submitLeaveReturn(
        user?.id || '',
        'driver',              // Specify user type
        selectedLeaveRequestId,
        returnDate,
        signature
      );
      
      Alert.alert(
        'Success', 
        'Leave return notification submitted successfully. HR will acknowledge your return.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('My Requests')
          }
        ]
      );
      
      // Reset form
      setSelectedLeaveRequestId('');
      setReturnDate('');
      setSignature('');
      
      // Refresh approved leaves
      const requests = await backendAPI.getLeaveRequests(user?.id || '', 'driver');
      const approved = requests.filter((r: any) => r.status === 'approved' || r.status === 'active');
      setApprovedLeaveRequests(approved);
    } catch (error: any) {
      console.error('Leave return error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit leave return notification');
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
              <Ionicons name="arrow-back-circle" size={48} color={theme.colors.driver.primary} />
              <View style={styles.headerText}>
                <Text style={styles.cardTitle}>Announce Return from Leave</Text>
                <Text style={styles.subtitle}>Notify management of your return to work</Text>
              </View>
            </View>

            {loadingRequests ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.driver.primary} />
                <Text style={styles.loadingText}>Loading your leave requests...</Text>
              </View>
            ) : approvedLeaveRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color={theme.colors.text.secondary} />
                <Text style={styles.emptyTitle}>No Approved Leaves</Text>
                <Text style={styles.emptyText}>
                  You don't have any approved leave requests to return from.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>Select Leave to Return From *</Text>
                  <View style={styles.radioGroup}>
                    {approvedLeaveRequests.map((request) => (
                      <TouchableOpacity
                        key={request.id}
                        style={styles.radioButton}
                        onPress={() => setSelectedLeaveRequestId(request.id)}
                      >
                        <View style={[styles.radio, selectedLeaveRequestId === request.id && styles.radioSelected]} />
                        <View style={styles.radioContent}>
                          <Text style={styles.radioLabel}>
                            {request.leave_type_id || 'Leave'} - {request.start_date} to {request.end_date}
                          </Text>
                          <Text style={styles.radioSubtext}>
                            Reason: {request.reason}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
              <Text style={styles.label}>Actual Return Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={[styles.dateText, !returnDate && styles.placeholderText]}>
                  {returnDate || 'Select your return date'}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={styles.confirmButton} onPress={confirmDate}>
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Your Signature</Text>
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
                    {submitting ? 'Submitting...' : 'Submit Return Notification'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {!loadingRequests && approvedLeaveRequests.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📋 Important Information</Text>
              <Text style={styles.infoText}>• Submit this form on your first day back at work</Text>
              <Text style={styles.infoText}>• This notifies HR and management of your return</Text>
              <Text style={styles.infoText}>• Your manager will acknowledge your return</Text>
              <Text style={styles.infoText}>• Ensure you report to your supervisor upon arrival</Text>
            </View>
          )}
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
  infoCard: {
    backgroundColor: theme.colors.driver.light,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
  },
  infoTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  radioGroup: {
    gap: theme.spacing.sm,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.driver.primary,
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  radioSelected: {
    backgroundColor: theme.colors.driver.primary,
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  radioSubtext: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
});
