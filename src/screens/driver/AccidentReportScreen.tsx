/**
 * Accident Report Screen
 * 
 * Allows drivers to submit accident documentation for insurance claims.
 * Documents:
 * - Driver License (front/back) - stored once, reused
 * - Emirates ID (front/back) - stored once, reused  
 * - Accident Report PDF - new each time
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import Toast from 'react-native-toast-message';

// Storage keys for saved documents
const STORAGE_KEYS = {
  DRIVER_LICENSE_FRONT: 'driver_license_front_url',
  DRIVER_LICENSE_BACK: 'driver_license_back_url',
  EMIRATES_ID_FRONT: 'emirates_id_front_url',
  EMIRATES_ID_BACK: 'emirates_id_back_url',
};

interface DocumentState {
  uri: string | null;
  uploaded: boolean;
  url: string | null;
}

export default function AccidentReportScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Document states
  const [driverLicenseFront, setDriverLicenseFront] = useState<DocumentState>({ uri: null, uploaded: false, url: null });
  const [driverLicenseBack, setDriverLicenseBack] = useState<DocumentState>({ uri: null, uploaded: false, url: null });
  const [emiratesIdFront, setEmiratesIdFront] = useState<DocumentState>({ uri: null, uploaded: false, url: null });
  const [emiratesIdBack, setEmiratesIdBack] = useState<DocumentState>({ uri: null, uploaded: false, url: null });
  const [accidentReport, setAccidentReport] = useState<DocumentState>({ uri: null, uploaded: false, url: null });

  useEffect(() => {
    loadSavedDocuments();
  }, []);

  const loadSavedDocuments = async () => {
    try {
      // Load previously saved document URLs
      const [dlFront, dlBack, eidFront, eidBack] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DRIVER_LICENSE_FRONT),
        AsyncStorage.getItem(STORAGE_KEYS.DRIVER_LICENSE_BACK),
        AsyncStorage.getItem(STORAGE_KEYS.EMIRATES_ID_FRONT),
        AsyncStorage.getItem(STORAGE_KEYS.EMIRATES_ID_BACK),
      ]);

      if (dlFront) setDriverLicenseFront({ uri: dlFront, uploaded: true, url: dlFront });
      if (dlBack) setDriverLicenseBack({ uri: dlBack, uploaded: true, url: dlBack });
      if (eidFront) setEmiratesIdFront({ uri: eidFront, uploaded: true, url: eidFront });
      if (eidBack) setEmiratesIdBack({ uri: eidBack, uploaded: true, url: eidBack });
    } catch (error) {
      console.error('Failed to load saved documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (
    setDocument: React.Dispatch<React.SetStateAction<DocumentState>>,
    documentType: string,
    storageKey?: string
  ) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setDocument({ uri, uploaded: false, url: null });
        
        // Upload immediately
        await uploadDocument(uri, documentType, setDocument, storageKey);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to pick image' });
    }
  };

  const takePhoto = async (
    setDocument: React.Dispatch<React.SetStateAction<DocumentState>>,
    documentType: string,
    storageKey?: string
  ) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setDocument({ uri, uploaded: false, url: null });
        
        // Upload immediately
        await uploadDocument(uri, documentType, setDocument, storageKey);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to take photo' });
    }
  };

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAccidentReport({ uri, uploaded: false, url: null });
        
        // Upload immediately
        await uploadDocument(uri, 'accident_report', setAccidentReport);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to pick document' });
    }
  };

  const uploadDocument = async (
    uri: string,
    documentType: string,
    setDocument: React.Dispatch<React.SetStateAction<DocumentState>>,
    storageKey?: string
  ) => {
    try {
      setUploading(documentType);
      
      const uploadedUrl = await backendAPI.uploadDriverDocument(
        user?.id || '',
        documentType,
        uri
      );
      
      setDocument({ uri, uploaded: true, url: uploadedUrl });
      
      // Save to AsyncStorage for reuse (except accident report)
      if (storageKey) {
        await AsyncStorage.setItem(storageKey, uploadedUrl);
      }
      
      Toast.show({ type: 'success', text1: 'Uploaded', text2: 'Document uploaded successfully' });
    } catch (error) {
      console.error('Failed to upload document:', error);
      Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Failed to upload document' });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    // Validate all required documents
    if (!driverLicenseFront.uploaded || !driverLicenseBack.uploaded) {
      Toast.show({
        type: 'error',
        text1: 'Missing Documents',
        text2: 'Please upload both sides of your driver license',
      });
      return;
    }

    if (!emiratesIdFront.uploaded || !emiratesIdBack.uploaded) {
      Toast.show({
        type: 'error',
        text1: 'Missing Documents',
        text2: 'Please upload both sides of your Emirates ID',
      });
      return;
    }

    if (!accidentReport.uploaded) {
      Toast.show({
        type: 'error',
        text1: 'Missing Documents',
        text2: 'Please upload the accident report',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Create HR request with all document URLs
      await backendAPI.createHRRequest({
        request_type: 'accident_report',
        user_id: user?.id || '',
        user_type: 'driver',
        data: {
          driver_license_front_url: driverLicenseFront.url,
          driver_license_back_url: driverLicenseBack.url,
          emirates_id_front_url: emiratesIdFront.url,
          emirates_id_back_url: emiratesIdBack.url,
          accident_report_url: accidentReport.url,
          submitted_at: new Date().toISOString(),
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Report Submitted',
        text2: 'Your accident report has been submitted successfully',
      });

      // Clear accident report (but keep ID docs for reuse)
      setAccidentReport({ uri: null, uploaded: false, url: null });
      
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to submit report:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error?.message || 'Failed to submit accident report',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderDocumentCard = (
    title: string,
    subtitle: string,
    document: DocumentState,
    setDocument: React.Dispatch<React.SetStateAction<DocumentState>>,
    documentType: string,
    storageKey?: string,
    color: string = theme.colors.driver.primary
  ) => {
    const isUploading = uploading === documentType;
    
    return (
      <View style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentTitle}>{title}</Text>
          {document.uploaded && (
            <View style={styles.uploadedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={styles.uploadedText}>Uploaded</Text>
            </View>
          )}
        </View>
        <Text style={styles.documentSubtitle}>{subtitle}</Text>
        
        {document.uri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: document.uri }} style={styles.preview} />
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color={theme.colors.text.white} />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setDocument({ uri: null, uploaded: false, url: null })}
            >
              <Ionicons name="close-circle" size={28} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadButtons}>
            <TouchableOpacity
              style={[styles.uploadButton, { borderColor: color }]}
              onPress={() => takePhoto(setDocument, documentType, storageKey)}
            >
              <Ionicons name="camera" size={24} color={color} />
              <Text style={[styles.uploadButtonText, { color }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, { borderColor: color }]}
              onPress={() => pickImage(setDocument, documentType, storageKey)}
            >
              <Ionicons name="images" size={24} color={color} />
              <Text style={[styles.uploadButtonText, { color }]}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
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
        <MaterialCommunityIcons name="car-emergency" size={32} color="#DC2626" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Accident Report Submission</Text>
          <Text style={styles.infoText}>
            Upload all required documents for insurance claim processing.
          </Text>
        </View>
      </View>

      {/* Saved Documents Notice */}
      {(driverLicenseFront.uploaded || emiratesIdFront.uploaded) && (
        <View style={styles.savedNotice}>
          <Ionicons name="information-circle" size={20} color={theme.colors.info} />
          <Text style={styles.savedNoticeText}>
            Your ID documents are saved and will be reused for future reports.
          </Text>
        </View>
      )}

      {/* Driver License Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="card-account-details" size={24} color="#6366F1" />
          <Text style={styles.sectionTitle}>Driver License</Text>
        </View>
        
        {renderDocumentCard(
          'Front Side',
          'Take a clear photo of the front of your license',
          driverLicenseFront,
          setDriverLicenseFront,
          'driver_license_front',
          STORAGE_KEYS.DRIVER_LICENSE_FRONT,
          '#6366F1'
        )}
        
        {renderDocumentCard(
          'Back Side',
          'Take a clear photo of the back of your license',
          driverLicenseBack,
          setDriverLicenseBack,
          'driver_license_back',
          STORAGE_KEYS.DRIVER_LICENSE_BACK,
          '#6366F1'
        )}
      </View>

      {/* Emirates ID Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#10B981" />
          <Text style={styles.sectionTitle}>Emirates ID</Text>
        </View>
        
        {renderDocumentCard(
          'Front Side',
          'Take a clear photo of the front of your Emirates ID',
          emiratesIdFront,
          setEmiratesIdFront,
          'emirates_id_front',
          STORAGE_KEYS.EMIRATES_ID_FRONT,
          '#10B981'
        )}
        
        {renderDocumentCard(
          'Back Side',
          'Take a clear photo of the back of your Emirates ID',
          emiratesIdBack,
          setEmiratesIdBack,
          'emirates_id_back',
          STORAGE_KEYS.EMIRATES_ID_BACK,
          '#10B981'
        )}
      </View>

      {/* Accident Report Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="file-document" size={24} color="#DC2626" />
          <Text style={styles.sectionTitle}>Accident Report</Text>
          <Text style={styles.requiredTag}>Required for each claim</Text>
        </View>
        
        <View style={styles.documentCard}>
          <Text style={styles.documentTitle}>Police Report / Accident Report</Text>
          <Text style={styles.documentSubtitle}>
            Upload PDF or photo of the official accident report
          </Text>
          
          {accidentReport.uri ? (
            <View style={styles.previewContainer}>
              {accidentReport.uri.toLowerCase().endsWith('.pdf') ? (
                <View style={styles.pdfPreview}>
                  <MaterialCommunityIcons name="file-pdf-box" size={48} color="#DC2626" />
                  <Text style={styles.pdfText}>PDF Document</Text>
                </View>
              ) : (
                <Image source={{ uri: accidentReport.uri }} style={styles.preview} />
              )}
              {uploading === 'accident_report' && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={theme.colors.text.white} />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setAccidentReport({ uri: null, uploaded: false, url: null })}
              >
                <Ionicons name="close-circle" size={28} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity
                style={[styles.uploadButton, { borderColor: '#DC2626' }]}
                onPress={pickPDF}
              >
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#DC2626" />
                <Text style={[styles.uploadButtonText, { color: '#DC2626' }]}>PDF/Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadButton, { borderColor: '#DC2626' }]}
                onPress={() => takePhoto(setAccidentReport, 'accident_report')}
              >
                <Ionicons name="camera" size={24} color="#DC2626" />
                <Text style={[styles.uploadButtonText, { color: '#DC2626' }]}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (submitting || uploading) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={submitting || !!uploading}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={theme.colors.text.white} />
        ) : (
          <>
            <Ionicons name="send" size={20} color={theme.colors.text.white} />
            <Text style={styles.submitText}>Submit Accident Report</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
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
    backgroundColor: '#DC262620',
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
    color: '#DC2626',
    marginBottom: 4,
  },
  infoText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  savedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info + '20',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  savedNoticeText: {
    flex: 1,
    ...theme.typography.caption,
    color: theme.colors.info,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    flex: 1,
  },
  requiredTag: {
    ...theme.typography.caption,
    color: '#DC2626',
    backgroundColor: '#DC262620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  documentCard: {
    backgroundColor: theme.colors.text.white,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentTitle: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  documentSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 4,
    marginBottom: theme.spacing.md,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadedText: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontWeight: '600',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    ...theme.typography.caption,
    fontWeight: '600',
    marginTop: 4,
  },
  previewContainer: {
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
  pdfPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfText: {
    ...theme.typography.caption,
    color: '#DC2626',
    marginTop: 8,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    ...theme.typography.caption,
    color: theme.colors.text.white,
    marginTop: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.text.white,
    borderRadius: 14,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#DC2626',
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
