/**
 * Documents Screen - Upload and manage driver documents with OCR
 * Enhanced with expiry warnings and skeleton loading
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useDocumentStore, getDocumentTypeLabel, getExpiryStatusColor } from '../../stores/documentStore';
import { backendAPI } from '../../api';
import { lightHaptic } from '../../utils/haptics';

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  url: string;
}

/**
 * Calculate days until a date
 */
function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get expiry status text
 */
function getExpiryText(daysRemaining: number): string {
  if (daysRemaining < 0) return 'Expired';
  if (daysRemaining === 0) return 'Expires Today';
  if (daysRemaining === 1) return '1 day left';
  if (daysRemaining <= 30) return `${daysRemaining} days left`;
  return '';
}

export default function DocumentsScreen() {
  const { user } = useAuthStore();
  const { 
    documents: storeDocuments, 
    expiringDocuments,
    isLoading: storeLoading,
    fetchDocuments 
  } = useDocumentStore();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('license');

  const documentCategories = [
    { value: 'license', label: 'Driver License', icon: 'card' },
    { value: 'passport', label: 'Passport', icon: 'airplane' },
    { value: 'visa', label: 'Visa/Emirates ID', icon: 'document-text' },
    { value: 'contract', label: 'Employment Contract', icon: 'document' },
    { value: 'other', label: 'Other Documents', icon: 'folder' },
  ];

  useEffect(() => {
    requestPermissions();
    loadDocuments();
  }, []);

  // Fetch documents from store
  useEffect(() => {
    if (user?.id) {
      fetchDocuments(user.id);
    }
  }, [user?.id]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lightHaptic();
    if (user?.id) {
      await fetchDocuments(user.id, true);
    }
    setRefreshing(false);
  }, [user?.id]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera and media library permissions are needed to upload documents');
    }
  };

  const loadDocuments = async () => {
    // TODO: Implement backend endpoint to fetch driver documents
    // For now, using mock data
    setDocuments([
      {
        id: '1',
        name: 'Driver License',
        type: 'license',
        uploadDate: '2025-10-15',
        url: 'https://example.com/doc1.pdf',
      },
    ]);
  };

  const handleCaptureAndScan = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Camera result:', asset.uri);
        await uploadDocument(asset.uri, 'image/jpeg', asset.fileName || `photo_${Date.now()}.jpg`);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture image: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleUploadFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Gallery result:', asset.uri);
        await uploadDocument(asset.uri, 'image/jpeg', asset.fileName || `image_${Date.now()}.jpg`);
      }
    } catch (error: any) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to pick image: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Document result:', asset.uri);
        await uploadDocument(asset.uri, asset.mimeType || 'application/pdf', asset.name);
      }
    } catch (error: any) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document: ' + (error?.message || 'Unknown error'));
    }
  };

  const uploadDocument = async (uri: string, type: string, fileName?: string) => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      setLoading(true);
      console.log('Uploading document:', { uri, type, fileName });
      
      const file = {
        uri,
        type,
        name: fileName || `document_${Date.now()}.${type.includes('pdf') ? 'pdf' : 'jpg'}`,
      };

      await backendAPI.uploadDocument(file, selectedCategory, user.id);
      
      Alert.alert('Success', 'Document uploaded successfully');
      setShowUploadModal(false);
      loadDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.response?.data?.detail || error.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.driver.primary]}
            tintColor={theme.colors.driver.primary}
          />
        }
      >
        {/* Expiring Documents Warning Banner */}
        {expiringDocuments.length > 0 && (
          <View style={styles.warningBanner}>
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning" size={24} color="#F59E0B" />
            </View>
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Documents Expiring Soon</Text>
              <Text style={styles.warningSubtext}>
                {expiringDocuments.length} document{expiringDocuments.length > 1 ? 's' : ''} expiring within 30 days
              </Text>
            </View>
          </View>
        )}

        {/* Upload Button */}
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setShowUploadModal(true)}
        >
          <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.text.white} />
          <Text style={styles.uploadButtonText}>Upload New Document</Text>
        </TouchableOpacity>

        {/* Documents List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Documents</Text>
          
          {storeLoading && storeDocuments.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.driver.primary} />
              <Text style={styles.loadingText}>Loading documents...</Text>
            </View>
          ) : storeDocuments.length === 0 && documents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color={theme.colors.text.secondary} />
              <Text style={styles.emptyText}>No documents uploaded yet</Text>
              <Text style={styles.emptySubtext}>Upload your documents to get started</Text>
            </View>
          ) : (
            <>
              {/* Real documents from store */}
              {storeDocuments.map((doc: any) => {
                const daysRemaining = doc.expiry_date ? daysUntil(doc.expiry_date) : null;
                const expiryColor = daysRemaining !== null ? getExpiryStatusColor(daysRemaining) : null;
                const expiryText = daysRemaining !== null ? getExpiryText(daysRemaining) : null;
                const isExpiring = daysRemaining !== null && daysRemaining <= 30;
                
                return (
                  <View key={doc.id} style={[styles.documentCard, isExpiring && { borderLeftWidth: 4, borderLeftColor: expiryColor! }]}>
                    <View style={[styles.documentIcon, isExpiring && { backgroundColor: `${expiryColor}15` }]}>
                      <Ionicons
                        name="document-text"
                        size={32}
                        color={isExpiring ? expiryColor! : theme.colors.driver.primary}
                      />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>{getDocumentTypeLabel(doc.document_type)}</Text>
                      {doc.document_number && (
                        <Text style={styles.documentNumber}>#{doc.document_number}</Text>
                      )}
                      {doc.expiry_date && (
                        <View style={styles.expiryRow}>
                          <Text style={styles.documentDate}>
                            Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                          </Text>
                          {expiryText && (
                            <View style={[styles.expiryBadge, { backgroundColor: `${expiryColor}20` }]}>
                              <Text style={[styles.expiryBadgeText, { color: expiryColor! }]}>
                                {expiryText}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    {doc.file_url && (
                      <TouchableOpacity onPress={() => lightHaptic()}>
                        <Ionicons name="eye-outline" size={24} color={theme.colors.driver.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              
              {/* Legacy mock documents */}
              {documents.map((doc) => {
                const category = documentCategories.find(c => c.value === doc.type);
                return (
                  <View key={doc.id} style={styles.documentCard}>
                    <View style={styles.documentIcon}>
                      <Ionicons
                        name={category?.icon as any || 'document'}
                        size={32}
                        color={theme.colors.driver.primary}
                      />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>{doc.name}</Text>
                      <Text style={styles.documentDate}>
                        Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity>
                      <Ionicons name="eye-outline" size={24} color={theme.colors.driver.primary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Document</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Document Category</Text>
              <View style={styles.categoryGrid}>
                {documentCategories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.value && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setSelectedCategory(category.value)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={24}
                      color={selectedCategory === category.value ? theme.colors.text.white : theme.colors.driver.primary}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category.value && styles.categoryTextSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Upload Method</Text>
              
              <TouchableOpacity
                style={styles.methodButton}
                onPress={handleCaptureAndScan}
                disabled={loading}
              >
                <Ionicons name="camera" size={24} color={theme.colors.driver.primary} />
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodTitle}>Capture & Scan</Text>
                  <Text style={styles.methodSubtitle}>Take photo with OCR scanning</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.methodButton}
                onPress={handleUploadFromGallery}
                disabled={loading}
              >
                <Ionicons name="images" size={24} color={theme.colors.driver.primary} />
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodTitle}>Upload from Gallery</Text>
                  <Text style={styles.methodSubtitle}>Choose existing photo</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.methodButton}
                onPress={handleUploadDocument}
                disabled={loading}
              >
                <Ionicons name="document" size={24} color={theme.colors.driver.primary} />
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodTitle}>Upload File</Text>
                  <Text style={styles.methodSubtitle}>Select PDF or image file</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.driver.primary} />
                  <Text style={styles.loadingText}>Uploading...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    margin: theme.spacing.md,
    marginBottom: 0,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    ...theme.typography.body1,
    color: '#92400E',
    fontWeight: '700',
  },
  warningSubtext: {
    ...theme.typography.caption,
    color: '#B45309',
    marginTop: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.driver.primary,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    ...theme.shadows.medium,
  },
  uploadButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.white,
    marginLeft: theme.spacing.sm,
  },
  section: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  documentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.driver.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  documentNumber: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  documentDate: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  expiryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.driver.primary,
    minWidth: '30%',
  },
  categoryButtonSelected: {
    backgroundColor: theme.colors.driver.primary,
  },
  categoryText: {
    ...theme.typography.caption,
    color: theme.colors.driver.primary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: theme.colors.text.white,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
  },
  methodTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  methodTitle: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  methodSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.driver.primary,
    marginTop: theme.spacing.sm,
  },
});
