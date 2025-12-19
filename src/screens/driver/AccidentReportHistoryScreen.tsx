/**
 * Accident Report History Screen
 * 
 * Shows history of submitted accident reports for the driver.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import Toast from 'react-native-toast-message';

interface AccidentReport {
  id: string;
  status: string;
  created_at: string;
  data: {
    driver_license_front_url?: string;
    driver_license_back_url?: string;
    emirates_id_front_url?: string;
    emirates_id_back_url?: string;
    accident_report_url?: string;
    submitted_at?: string;
  };
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'completed':
      return theme.colors.success;
    case 'pending':
    case 'submitted':
      return '#F59E0B';
    case 'rejected':
      return theme.colors.error;
    case 'in_progress':
    case 'processing':
      return '#3B82F6';
    default:
      return theme.colors.text.secondary;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'submitted':
      return 'Pending Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'in_progress':
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

export default function AccidentReportHistoryScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<AccidentReport[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await backendAPI.getHRRequests(user?.id || '', 'accident_report');
      setReports(data || []);
    } catch (error) {
      console.error('Failed to load accident reports:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load accident reports' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleNewReport = () => {
    navigation.navigate('AccidentReport');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.driver.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information" size={20} color={theme.colors.info} />
          <Text style={styles.infoText}>
            Your accident reports are submitted to HR for insurance claim processing. 
            Keep your ID documents updated for faster processing.
          </Text>
        </View>

        {/* Reports List */}
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color={theme.colors.text.disabled} />
            <Text style={styles.emptyTitle}>No Accident Reports</Text>
            <Text style={styles.emptyText}>
              You haven't submitted any accident reports yet. 
              We hope you never need to!
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Submitted Reports ({reports.length})</Text>
            {reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <MaterialCommunityIcons name="car-emergency" size={28} color="#DC2626" />
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportDate}>
                      {formatDate(report.data?.submitted_at || report.created_at)}
                    </Text>
                    <Text style={styles.reportId}>Ref: {report.id.slice(0, 8).toUpperCase()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                      {getStatusLabel(report.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.reportDivider} />

                <View style={styles.documentsRow}>
                  <View style={styles.documentItem}>
                    <Ionicons 
                      name={report.data?.driver_license_front_url ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={report.data?.driver_license_front_url ? theme.colors.success : theme.colors.error} 
                    />
                    <Text style={styles.documentLabel}>License</Text>
                  </View>
                  <View style={styles.documentItem}>
                    <Ionicons 
                      name={report.data?.emirates_id_front_url ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={report.data?.emirates_id_front_url ? theme.colors.success : theme.colors.error} 
                    />
                    <Text style={styles.documentLabel}>Emirates ID</Text>
                  </View>
                  <View style={styles.documentItem}>
                    <Ionicons 
                      name={report.data?.accident_report_url ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={report.data?.accident_report_url ? theme.colors.success : theme.colors.error} 
                    />
                    <Text style={styles.documentLabel}>Report</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* New Report Button */}
      <TouchableOpacity style={styles.newReportButton} onPress={handleNewReport}>
        <Ionicons name="add" size={24} color={theme.colors.white} />
        <Text style={styles.newReportText}>New Accident Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '15',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.lg,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl * 2,
    borderRadius: 12,
    marginTop: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  reportCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportDate: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  reportId: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
  reportDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  documentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  documentItem: {
    alignItems: 'center',
    gap: 4,
  },
  documentLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  newReportButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadows.md,
  },
  newReportText: {
    ...theme.typography.h4,
    color: theme.colors.white,
    fontWeight: '600',
  },
});
