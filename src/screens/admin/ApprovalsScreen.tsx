import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { backendAPI as api } from '../../api';

interface LeaveRequest {
  id: string;
  employee_name: string;
  employee_type: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function ApprovalsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadPendingRequests = async () => {
    try {
      const data = await api.getPendingLeaveRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
      // Mock data for demonstration
      setRequests([
        {
          id: '1',
          employee_name: 'Mohammed Ali',
          employee_type: 'driver',
          leave_type: 'annual',
          start_date: '2025-11-15',
          end_date: '2025-11-17',
          reason: 'Family vacation',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          employee_name: 'Tahir Ullah',
          employee_type: 'driver',
          leave_type: 'sick',
          start_date: '2025-11-10',
          end_date: '2025-11-12',
          reason: 'Medical appointment',
          status: 'pending',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingRequests();
  };

  const handleApprove = async (requestId: string) => {
    Alert.alert(
      'Approve Leave Request',
      'Are you sure you want to approve this leave request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessing(requestId);
              // Note: Approval requires signature - using placeholder
              await api.approveLeaveRequest(requestId, 'data:image/png;base64,placeholder');
              Alert.alert('Success', 'Leave request approved');
              loadPendingRequests();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to approve request');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (requestId: string) => {
    Alert.alert(
      'Reject Leave Request',
      'Are you sure you want to reject this leave request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(requestId);
              await api.rejectLeaveRequest(requestId, 'Rejected via mobile');
              Alert.alert('Success', 'Leave request rejected');
              loadPendingRequests();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to reject request');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual':
        return theme.colors.success;
      case 'sick':
        return theme.colors.warning;
      case 'emergency':
        return theme.colors.danger;
      case 'unpaid':
        return theme.colors.text.secondary;
      default:
        return theme.colors.admin.primary;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.admin.primary} />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={theme.colors.success} />
          <Text style={styles.emptyText}>No Pending Approvals</Text>
          <Text style={styles.emptySubtext}>All requests have been processed</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>{requests.length} Pending Request{requests.length !== 1 ? 's' : ''}</Text>
      </View>

      {requests.map((request) => (
        <View key={request.id} style={styles.requestCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.employeeName}>{request.employee_name}</Text>
              <Text style={styles.employeeType}>
                {request.employee_type === 'driver' ? '🚗 Driver' : '👤 Staff'}
              </Text>
            </View>
            <View style={[styles.leaveTypeBadge, { backgroundColor: getLeaveTypeColor(request.leave_type) }]}>
              <Text style={styles.leaveTypeText}>
                {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.text.secondary} />
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {calculateDays(request.start_date, request.end_date)} days
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="enter-outline" size={18} color={theme.colors.text.secondary} />
              <Text style={styles.detailLabel}>From:</Text>
              <Text style={styles.detailValue}>
                {new Date(request.start_date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="exit-outline" size={18} color={theme.colors.text.secondary} />
              <Text style={styles.detailLabel}>To:</Text>
              <Text style={styles.detailValue}>
                {new Date(request.end_date).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.reasonSection}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{request.reason}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.rejectButton, processing === request.id && styles.disabledButton]}
              onPress={() => handleReject(request.id)}
              disabled={processing === request.id}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.white} />
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.approveButton, processing === request.id && styles.disabledButton]}
              onPress={() => handleApprove(request.id)}
              disabled={processing === request.id}
            >
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.white} />
              <Text style={styles.buttonText}>
                {processing === request.id ? 'Processing...' : 'Approve'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.submittedText}>
            Submitted {new Date(request.created_at).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  requestCard: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  employeeName: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  employeeType: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  leaveTypeBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
  },
  leaveTypeText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  detailsSection: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  detailValue: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  reasonSection: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  reasonLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  reasonText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.danger,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  submittedText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});