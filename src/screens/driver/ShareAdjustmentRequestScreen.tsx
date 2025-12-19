/**
 * Share Adjustment Request Screen
 * 
 * Allows drivers to request rent share adjustments (discounts)
 * for days when the vehicle was in workshop, accident, etc.
 * 
 * Uses the rent_discounts backend API.
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
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import Toast from 'react-native-toast-message';

// Discount reason options
const DISCOUNT_REASONS = [
  { id: 'workshop', label: 'Vehicle in Workshop', icon: 'car-wrench' },
  { id: 'accident', label: 'Accident / Damage', icon: 'car-emergency' },
  { id: 'breakdown', label: 'Vehicle Breakdown', icon: 'car-off' },
  { id: 'other', label: 'Other Reason', icon: 'help-circle-outline' },
];

// Days options for selection (max 2 days per request, matching web app)
const DAYS_OPTIONS = [0.5, 1, 1.5, 2];

export default function ShareAdjustmentRequestScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  
  // Form state
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [discountDays, setDiscountDays] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Data state
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [previousRequests, setPreviousRequests] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current assignment to find vehicle and daily rate
      const assignments = await backendAPI.getDriverAssignments(user?.id || '');
      const activeAssignment = assignments.find((a: any) => a.status === 'active');
      setAssignment(activeAssignment);
      
      // Get previous discount requests - filter for current month only
      if (user?.id) {
        const discounts = await backendAPI.getDriverRentDiscounts(user.id);
        // Filter for current month only
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const thisMonthDiscounts = (discounts || []).filter((d: any) => {
          const discountDate = new Date(d.discount_date || d.created_at);
          return discountDate.getMonth() === currentMonth && discountDate.getFullYear() === currentYear;
        });
        setPreviousRequests(thisMonthDiscounts);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image',
      });
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to take photo',
      });
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoUri || !user?.id) return null;

    try {
      setUploading(true);
      const uploadedUrl = await backendAPI.uploadDriverDocument(
        user.id,
        'discount_attachment',
        photoUri
      );
      return uploadedUrl;
    } catch (error) {
      console.error('Failed to upload photo:', error);
      throw new Error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedReason) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please select a reason for the adjustment',
      });
      return;
    }

    if (!assignment) {
      Toast.show({
        type: 'error',
        text1: 'No Active Assignment',
        text2: 'You need an active vehicle assignment to request an adjustment',
      });
      return;
    }

    // Workshop/accident requires photo proof
    if ((selectedReason === 'workshop' || selectedReason === 'accident') && !photoUri) {
      Toast.show({
        type: 'error',
        text1: 'Photo Required',
        text2: 'Please attach a photo of the job card or damage report',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Upload photo if provided
      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await uploadPhoto();
      }

      // Get the reason label
      const reasonLabel = DISCOUNT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;

      // Submit discount request
      // Send the calculated daily rate (monthly / days in month)
      await backendAPI.requestRentDiscount({
        driver_id: user?.id || '',
        vehicle_id: assignment.vehicle_id,
        discount_type: selectedReason === 'workshop' ? 'repair' : 'manual',
        discount_date: new Date().toISOString().split('T')[0],
        discount_days: discountDays,
        daily_rate: dailyRate, // Calculated: monthly rate / days in current month
        reason: reasonLabel,
        notes: notes || undefined,
        job_card_picture_url: photoUrl || undefined,
        requested_by: user?.id,
      });

      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: 'Your share adjustment request has been submitted for approval',
      });

      // Navigate back
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to submit request:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error?.message || 'Failed to submit adjustment request',
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

  // Calculate daily rate: monthly rent / days in current month
  // Monthly rent comes from daily_rental_rate field (which stores monthly value despite the name)
  const getDaysInCurrentMonth = (): number => {
    const now = new Date();
    // Get the last day of current month
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  };

  const getMonthlyRate = (): number => {
    // Monthly rent comes from vehicle_costs table via the assignments API
    // API returns "monthly_rent" field
    if (assignment?.monthly_rent) return Number(assignment.monthly_rent);
    if (assignment?.vehicle?.monthly_rent) return Number(assignment.vehicle.monthly_rent);
    // Default fallback
    return 8250; // Common default monthly rate
  };

  const daysInMonth = getDaysInCurrentMonth();
  const monthlyRate = getMonthlyRate();
  const dailyRate = monthlyRate / daysInMonth;
  const totalDiscount = discountDays * dailyRate;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Info Card */}
      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="information" size={24} color={theme.colors.driver.primary} />
        <Text style={styles.infoText}>
          Request a rent adjustment for days when you couldn't work due to vehicle issues. 
          Maximum 2 days per request. Requires manager approval.
        </Text>
      </View>

      {/* Current Assignment Info */}
      {assignment ? (
        <View style={styles.assignmentCard}>
          <Text style={styles.sectionTitle}>Current Assignment</Text>
          <View style={styles.assignmentRow}>
            <Text style={styles.assignmentLabel}>Vehicle:</Text>
            <Text style={styles.assignmentValue}>{assignment.vehicle_license_plate || assignment.vehicle?.license_plate || 'N/A'}</Text>
          </View>
          <View style={styles.assignmentRow}>
            <Text style={styles.assignmentLabel}>Monthly Rate:</Text>
            <Text style={styles.assignmentValue}>AED {monthlyRate.toFixed(0)}</Text>
          </View>
          <View style={styles.assignmentRow}>
            <Text style={styles.assignmentLabel}>Daily Rate ({daysInMonth} days):</Text>
            <Text style={styles.assignmentValue}>AED {dailyRate.toFixed(2)}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={24} color="#F59E0B" />
          <Text style={styles.warningText}>
            No active vehicle assignment found. You need an active assignment to request adjustments.
          </Text>
        </View>
      )}

      {/* Reason Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reason for Adjustment</Text>
        <View style={styles.reasonGrid}>
          {DISCOUNT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonCard,
                selectedReason === reason.id && styles.reasonCardSelected,
              ]}
              onPress={() => setSelectedReason(reason.id)}
            >
              <MaterialCommunityIcons
                name={reason.icon as any}
                size={32}
                color={selectedReason === reason.id ? theme.colors.white : theme.colors.driver.primary}
              />
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === reason.id && styles.reasonTextSelected,
                ]}
              >
                {reason.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Days Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Number of Days</Text>
        <View style={styles.daysContainer}>
          {DAYS_OPTIONS.map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.dayButton,
                discountDays === days && styles.dayButtonSelected,
              ]}
              onPress={() => setDiscountDays(days)}
            >
              <Text
                style={[
                  styles.dayText,
                  discountDays === days && styles.dayTextSelected,
                ]}
              >
                {days === 0.5 ? '½' : days}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.totalText}>
          Total Discount: <Text style={styles.totalAmount}>AED {totalDiscount.toFixed(2)}</Text>
        </Text>
      </View>

      {/* Photo Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Attach Photo {(selectedReason === 'workshop' || selectedReason === 'accident') && <Text style={styles.required}>*</Text>}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {selectedReason === 'workshop' 
            ? 'Upload a photo of the job card' 
            : selectedReason === 'accident'
            ? 'Upload a photo of the damage or accident report'
            : 'Upload supporting documentation (optional)'}
        </Text>

        {photoUri ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setPhotoUri(null)}
            >
              <Ionicons name="close-circle" size={28} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Ionicons name="camera" size={28} color={theme.colors.driver.primary} />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Ionicons name="images" size={28} color={theme.colors.driver.primary} />
              <Text style={styles.photoButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Additional Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add any additional details about your request..."
          placeholderTextColor={theme.colors.text.secondary}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />
      </View>

      {/* Previous Requests */}
      {previousRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previous Requests This Month</Text>
          {previousRequests.slice(0, 3).map((request, index) => (
            <View key={request.id || index} style={styles.requestItem}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestDate}>
                  {new Date(request.discount_date).toLocaleDateString()}
                </Text>
                <Text style={styles.requestReason}>{request.reason}</Text>
              </View>
              <View style={styles.requestRight}>
                <Text style={styles.requestDays}>{request.discount_days} days</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(request.status) }
                ]}>
                  <Text style={styles.statusText}>{request.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!assignment || submitting || uploading) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!assignment || submitting || uploading}
      >
        {(submitting || uploading) ? (
          <>
            <ActivityIndicator size="small" color={theme.colors.white} />
            <Text style={styles.submitText}>
              {uploading ? 'Uploading Photo...' : 'Submitting...'}
            </Text>
          </>
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
    case 'pending':
      return '#F59E0B';
    case 'approved':
      return '#10B981';
    case 'rejected':
      return '#EF4444';
    default:
      return '#6B7280';
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
    backgroundColor: theme.colors.driver.light,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  assignmentCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  assignmentLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  assignmentValue: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    gap: 12,
  },
  warningText: {
    flex: 1,
    ...theme.typography.body,
    color: '#92400E',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  required: {
    color: theme.colors.error,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reasonCard: {
    width: '47%',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  reasonCardSelected: {
    backgroundColor: theme.colors.driver.primary,
    borderColor: theme.colors.driver.primary,
  },
  reasonText: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  reasonTextSelected: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  dayButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  dayButtonSelected: {
    backgroundColor: theme.colors.driver.primary,
    borderColor: theme.colors.driver.primary,
  },
  dayText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
  },
  dayTextSelected: {
    color: theme.colors.white,
  },
  totalText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  totalAmount: {
    fontWeight: '700',
    color: theme.colors.driver.primary,
    fontSize: 18,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  photoButtonText: {
    ...theme.typography.caption,
    color: theme.colors.driver.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.white,
    borderRadius: 14,
  },
  notesInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: 100,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  requestReason: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  requestRight: {
    alignItems: 'flex-end',
  },
  requestDays: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    backgroundColor: theme.colors.driver.primary,
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
