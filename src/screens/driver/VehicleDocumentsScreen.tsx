/**
 * Vehicle Documents Screen - View documents of assigned vehicle
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import { Driver } from '../../types';

interface VehicleDocument {
  id: string;
  name: string;
  type: string;
  expiryDate: string | null;
  url: string;
  thumbnail?: string;
}

export default function VehicleDocumentsScreen() {
  const { user } = useAuthStore();
  const driver = user as Driver;
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [vehicleLicense, setVehicleLicense] = useState('');

  useEffect(() => {
    loadVehicleDocuments();
  }, []);

  const loadVehicleDocuments = async () => {
    try {
      // Get current assignment to find vehicle
      const data = await backendAPI.getDriverAssignment(driver.id);
      
      if (data && data.assignment && data.vehicle) {
        setVehicleLicense(data.vehicle.license_plate);
        // TODO: Implement backend endpoint to fetch vehicle documents
        // For now, using mock data
        setDocuments([
          {
            id: '1',
            name: 'Vehicle Registration (Mulkiya)',
            type: 'registration',
            expiryDate: '2026-03-15',
            url: 'https://example.com/reg.pdf',
          },
          {
            id: '2',
            name: 'Insurance Certificate',
            type: 'insurance',
            expiryDate: '2025-12-31',
            url: 'https://example.com/insurance.pdf',
          },
          {
            id: '3',
            name: 'Vehicle License',
            type: 'license',
            expiryDate: '2026-06-20',
            url: 'https://example.com/license.pdf',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load vehicle documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return 'car-sport';
      case 'insurance':
        return 'shield-checkmark';
      case 'license':
        return 'document-text';
      default:
        return 'document';
    }
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.driver.primary} />
      </View>
    );
  }

  if (!driver.current_vehicle_id) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="car-outline" size={64} color={theme.colors.text.secondary} />
        <Text style={styles.emptyText}>No Active Assignment</Text>
        <Text style={styles.emptySubtext}>You are not currently assigned to a vehicle</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Vehicle Header */}
      <View style={styles.header}>
        <View style={styles.vehicleIcon}>
          <Ionicons name="car-sport" size={32} color={theme.colors.text.white} />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleLabel}>Assigned Vehicle</Text>
          <Text style={styles.vehicleLicense}>{vehicleLicense}</Text>
        </View>
      </View>

      {/* Documents List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Documents</Text>
        
        {documents.map((doc) => {
          const expiringSoon = isExpiringSoon(doc.expiryDate);
          const expired = isExpired(doc.expiryDate);
          
          return (
            <TouchableOpacity key={doc.id} style={styles.documentCard}>
              <View style={[
                styles.documentIcon,
                expired && styles.documentIconExpired,
                expiringSoon && !expired && styles.documentIconWarning,
              ]}>
                <Ionicons
                  name={getDocumentIcon(doc.type) as any}
                  size={28}
                  color={
                    expired
                      ? theme.colors.error
                      : expiringSoon
                      ? theme.colors.warning
                      : theme.colors.driver.primary
                  }
                />
              </View>
              
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.name}</Text>
                {doc.expiryDate && (
                  <View style={styles.expiryContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={
                        expired
                          ? theme.colors.error
                          : expiringSoon
                          ? theme.colors.warning
                          : theme.colors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.expiryText,
                        expired && styles.expiredText,
                        expiringSoon && !expired && styles.expiringText,
                      ]}
                    >
                      {expired
                        ? `Expired: ${new Date(doc.expiryDate).toLocaleDateString()}`
                        : `Expires: ${new Date(doc.expiryDate).toLocaleDateString()}`}
                    </Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity style={styles.viewButton}>
                <Ionicons name="eye-outline" size={24} color={theme.colors.driver.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Important Notice */}
      <View style={styles.noticeCard}>
        <Ionicons name="information-circle" size={24} color={theme.colors.info} />
        <Text style={styles.noticeText}>
          These are official documents for your assigned vehicle. Please report any expired or missing documents to management immediately.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
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
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.driver.primary,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: 12,
    ...theme.shadows.medium,
  },
  vehicleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLabel: {
    ...theme.typography.body2,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.xs,
  },
  vehicleLicense: {
    ...theme.typography.h2,
    color: theme.colors.text.white,
    fontWeight: 'bold',
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
  documentIconExpired: {
    backgroundColor: '#ffebee',
  },
  documentIconWarning: {
    backgroundColor: '#fff3e0',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  expiryText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  expiredText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  expiringText: {
    color: theme.colors.warning,
    fontWeight: '600',
  },
  viewButton: {
    padding: theme.spacing.sm,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    gap: theme.spacing.sm,
  },
  noticeText: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
});
