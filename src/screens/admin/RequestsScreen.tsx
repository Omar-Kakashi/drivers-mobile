/**
 * Requests Screen - Admin Approval Center
 * 
 * Combined view for all request types:
 * - Leave Requests
 * - Share Adjustments (Rent Discounts)
 * - NOC Requests
 * - Salary Certificates
 * - Loan/Advance Requests
 * - Exit Permits
 * 
 * Supports approve/reject with activity logging.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';

// Request type definitions
type RequestType = 'all' | 'leave' | 'share_adjustment' | 'early_leave' | 'noc' | 'salary_cert' | 'loan' | 'exit_permit' | 'passport';

interface BaseRequest {
  id: string;
  type: RequestType;
  requester_name: string;
  requester_type: 'driver' | 'employee' | 'admin';
  status: string;
  created_at: string;
  reason?: string;
  data?: Record<string, any>; // For HR requests with extra data
}

interface LeaveRequest extends BaseRequest {
  type: 'leave';
  leave_type: string;
  start_date: string;
  end_date: string;
}

interface ShareAdjustmentRequest extends BaseRequest {
  type: 'share_adjustment';
  driver_name: string;
  vehicle_license_plate: string;
  discount_type: string;
  discount_date: string;
  discount_days: number;
  daily_rate: number;
  total_discount_amount: number;
  job_card_picture_url?: string;
}

interface EarlyLeaveRequest extends BaseRequest {
  type: 'early_leave';
  departure_time: string;
  date: string;
}

type AnyRequest = LeaveRequest | ShareAdjustmentRequest | EarlyLeaveRequest | BaseRequest;

// Filter tabs
const REQUEST_FILTERS: { key: RequestType; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'leave', label: 'Leave', icon: 'calendar' },
  { key: 'share_adjustment', label: 'Share', icon: 'cash' },
  { key: 'early_leave', label: 'Early Leave', icon: 'time' },
  { key: 'noc', label: 'NOC', icon: 'document-text' },
  { key: 'passport', label: 'Passport', icon: 'card' },
];

export default function RequestsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<RequestType>('all');
  const [requests, setRequests] = useState<AnyRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Modal state for viewing details
  const [selectedRequest, setSelectedRequest] = useState<AnyRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const allRequests: AnyRequest[] = [];
      
      // Load Leave Requests (pending)
      try {
        const leaveRequests = await backendAPI.getPendingLeaveRequests();
        const mappedLeave: LeaveRequest[] = leaveRequests.map((r: any) => ({
          id: r.id,
          type: 'leave' as const,
          requester_name: r.employee_name || r.driver_name || 'Unknown',
          requester_type: r.employee_type || 'driver',
          status: r.status,
          created_at: r.created_at,
          reason: r.reason,
          leave_type: r.leave_type,
          start_date: r.start_date,
          end_date: r.end_date,
        }));
        allRequests.push(...mappedLeave);
      } catch (err) {
        console.warn('Failed to load leave requests:', err);
      }
      
      // Load Share Adjustments (pending)
      try {
        const shareAdjustments = await backendAPI.getPendingRentDiscounts();
        const mappedShare: ShareAdjustmentRequest[] = shareAdjustments.map((r: any) => ({
          id: r.id,
          type: 'share_adjustment' as const,
          requester_name: r.driver_name || 'Unknown Driver',
          requester_type: 'driver',
          status: r.status,
          created_at: r.requested_at || r.created_at,
          reason: r.reason,
          driver_name: r.driver_name,
          vehicle_license_plate: r.vehicle_license_plate,
          discount_type: r.discount_type,
          discount_date: r.discount_date,
          discount_days: r.discount_days,
          daily_rate: r.daily_rate,
          total_discount_amount: r.total_discount_amount,
          job_card_picture_url: r.job_card_picture_url,
        }));
        allRequests.push(...mappedShare);
      } catch (err) {
        console.warn('Failed to load share adjustments:', err);
      }
      
      // Load Early Leave Requests (pending) via HR Requests API
      try {
        const earlyLeaveRequests = await backendAPI.getPendingHRRequests('early_leave');
        const mappedEarlyLeave: EarlyLeaveRequest[] = earlyLeaveRequests.map((r: any) => ({
          id: r.id,
          type: 'early_leave' as const,
          requester_name: r.requester_name || r.user_name || 'Unknown',
          requester_type: r.user_type || 'driver',
          status: r.status,
          created_at: r.created_at,
          reason: r.data?.reason || r.reason,
          data: r.data,
          departure_time: r.data?.departure_time || '',
          date: r.data?.date || '',
        }));
        allRequests.push(...mappedEarlyLeave);
      } catch (err) {
        console.warn('Failed to load early leave requests:', err);
      }
      
      // Load NOC Requests (pending)
      try {
        const nocRequests = await backendAPI.getPendingHRRequests('noc');
        const mappedNoc: BaseRequest[] = nocRequests.map((r: any) => ({
          id: r.id,
          type: 'noc' as const,
          requester_name: r.requester_name || r.user_name || 'Unknown',
          requester_type: r.user_type || 'driver',
          status: r.status,
          created_at: r.created_at,
          reason: r.data?.purpose || r.reason,
          data: r.data,
        }));
        allRequests.push(...mappedNoc);
      } catch (err) {
        console.warn('Failed to load NOC requests:', err);
      }
      
      // Load Passport Handover Requests (pending)
      try {
        const passportRequests = await backendAPI.getPendingHRRequests('passport_handover');
        const mappedPassport: BaseRequest[] = passportRequests.map((r: any) => ({
          id: r.id,
          type: 'passport' as const,
          requester_name: r.requester_name || r.user_name || 'Unknown',
          requester_type: r.user_type || 'driver',
          status: r.status,
          created_at: r.created_at,
          reason: r.data?.reason || r.reason,
          data: r.data,
        }));
        allRequests.push(...mappedPassport);
      } catch (err) {
        console.warn('Failed to load passport requests:', err);
      }
      
      // Sort by created_at (newest first)
      allRequests.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setRequests(allRequests);
    } catch (error) {
      console.error('Failed to load requests:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load requests',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  // Filter requests based on active filter
  const filteredRequests = requests.filter(r => {
    if (activeFilter === 'all') return r.status === 'pending';
    return r.type === activeFilter && r.status === 'pending';
  });

  const handleApprove = async (request: AnyRequest) => {
    Alert.alert(
      'Approve Request',
      `Are you sure you want to approve this ${request.type === 'leave' ? 'leave' : 'share adjustment'} request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessing(request.id);
              
              if (request.type === 'leave') {
                await backendAPI.approveLeaveRequest(request.id, 'mobile-approval');
              } else if (request.type === 'share_adjustment') {
                // Type guard: Admin users have 'role', drivers don't
                const userRole = (user as any)?.role || 'admin';
                await backendAPI.approveRentDiscount(
                  request.id,
                  user?.id || '',
                  userRole
                );
              } else if (['early_leave', 'noc', 'passport'].includes(request.type)) {
                // Generic HR request approval
                await backendAPI.approveHRRequest(request.id, user?.id || '');
              }
              
              Toast.show({
                type: 'success',
                text1: 'Approved',
                text2: 'Request has been approved successfully',
              });
              
              setShowDetailModal(false);
              loadRequests();
            } catch (error: any) {
              console.error('Approve error:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.detail || 'Failed to approve request',
              });
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    if (!rejectReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Reason Required',
        text2: 'Please provide a reason for rejection',
      });
      return;
    }
    
    try {
      setProcessing(selectedRequest.id);
      
      if (selectedRequest.type === 'leave') {
        await backendAPI.rejectLeaveRequest(selectedRequest.id, rejectReason);
      } else if (selectedRequest.type === 'share_adjustment') {
        await backendAPI.rejectRentDiscount(selectedRequest.id, rejectReason, user?.id || '');
      } else if (['early_leave', 'noc', 'passport'].includes(selectedRequest.type)) {
        // Generic HR request rejection
        await backendAPI.rejectHRRequest(selectedRequest.id, rejectReason, user?.id || '');
      }
      
      Toast.show({
        type: 'success',
        text1: 'Rejected',
        text2: 'Request has been rejected',
      });
      
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectReason('');
      loadRequests();
    } catch (error: any) {
      console.error('Reject error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.detail || 'Failed to reject request',
      });
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (request: AnyRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const getRequestIcon = (type: RequestType): string => {
    switch (type) {
      case 'leave': return 'calendar-outline';
      case 'share_adjustment': return 'cash-outline';
      case 'early_leave': return 'time-outline';
      case 'noc': return 'document-text-outline';
      case 'salary_cert': return 'receipt-outline';
      case 'loan': return 'wallet-outline';
      case 'exit_permit': return 'airplane-outline';
      case 'passport': return 'card-outline';
      default: return 'document-outline';
    }
  };

  const getRequestTypeLabel = (type: RequestType): string => {
    switch (type) {
      case 'leave': return 'Leave Request';
      case 'share_adjustment': return 'Share Adjustment';
      case 'early_leave': return 'Early Leave';
      case 'noc': return 'NOC Request';
      case 'salary_cert': return 'Salary Certificate';
      case 'loan': return 'Loan Request';
      case 'exit_permit': return 'Exit Permit';
      case 'passport': return 'Passport Request';
      default: return 'Request';
    }
  };

  const getTypeColor = (type: RequestType): string => {
    switch (type) {
      case 'leave': return theme.colors.success;
      case 'share_adjustment': return theme.colors.warning;
      case 'early_leave': return '#EC4899';
      case 'noc': return theme.colors.info || '#3B82F6';
      case 'salary_cert': return '#8B5CF6';
      case 'loan': return '#EC4899';
      case 'exit_permit': return '#F97316';
      case 'passport': return '#F59E0B';
      default: return theme.colors.admin.primary;
    }
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return `AED ${amount.toFixed(2)}`;
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.admin.primary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {REQUEST_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                activeFilter === filter.key && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Ionicons
                name={filter.icon as any}
                size={18}
                color={activeFilter === filter.key ? theme.colors.text.white : theme.colors.text.secondary}
              />
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
              {filter.key !== 'all' && (
                <View style={[
                  styles.filterBadge,
                  activeFilter === filter.key && styles.filterBadgeActive,
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    activeFilter === filter.key && styles.filterBadgeTextActive,
                  ]}>
                    {requests.filter(r => r.type === filter.key && r.status === 'pending').length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={theme.colors.success} />
            <Text style={styles.emptyText}>No Pending Requests</Text>
            <Text style={styles.emptySubtext}>All requests have been processed</Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              onPress={() => {
                setSelectedRequest(request);
                setShowDetailModal(true);
              }}
            >
              {/* Request Type Badge */}
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(request.type) }]}>
                <Ionicons name={getRequestIcon(request.type) as any} size={16} color={theme.colors.text.white} />
                <Text style={styles.typeBadgeText}>{getRequestTypeLabel(request.type)}</Text>
              </View>

              {/* Requester Info */}
              <View style={styles.requesterRow}>
                <Text style={styles.requesterName}>{request.requester_name}</Text>
                <Text style={styles.requestDate}>{formatDate(request.created_at)}</Text>
              </View>

              {/* Request Details */}
              {request.type === 'leave' && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailText}>
                    📅 {(request as LeaveRequest).leave_type} • {calculateDays((request as LeaveRequest).start_date, (request as LeaveRequest).end_date)} days
                  </Text>
                  <Text style={styles.detailSubtext}>
                    {formatDate((request as LeaveRequest).start_date)} - {formatDate((request as LeaveRequest).end_date)}
                  </Text>
                </View>
              )}

              {request.type === 'share_adjustment' && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailText}>
                    🚗 {(request as ShareAdjustmentRequest).vehicle_license_plate} • {(request as ShareAdjustmentRequest).discount_days} days
                  </Text>
                  <Text style={styles.amountText}>
                    {formatCurrency((request as ShareAdjustmentRequest).total_discount_amount)}
                  </Text>
                </View>
              )}

              {request.type === 'early_leave' && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailText}>
                    ⏰ Leave at {(request as EarlyLeaveRequest).departure_time || request.data?.departure_time || 'N/A'}
                  </Text>
                  <Text style={styles.detailSubtext}>
                    {formatDate((request as EarlyLeaveRequest).date || request.data?.date || request.created_at)}
                  </Text>
                </View>
              )}

              {(request.type === 'noc' || request.type === 'passport') && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailText}>
                    {request.type === 'noc' ? '📄 Purpose: ' : '🛂 Reason: '}
                    {request.data?.purpose || request.data?.reason || request.reason || 'Not specified'}
                  </Text>
                </View>
              )}

              {/* Reason */}
              {request.reason && (
                <Text style={styles.reasonText} numberOfLines={2}>
                  {request.reason}
                </Text>
              )}

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[styles.quickButton, styles.rejectQuickButton]}
                  onPress={() => openRejectModal(request)}
                  disabled={processing === request.id}
                >
                  <Ionicons name="close" size={18} color={theme.colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.approveQuickButton]}
                  onPress={() => handleApprove(request)}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? (
                    <ActivityIndicator size="small" color={theme.colors.success} />
                  ) : (
                    <Ionicons name="checkmark" size={18} color={theme.colors.success} />
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={28} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Request Details</Text>
            <View style={{ width: 28 }} />
          </View>

          {selectedRequest && (
            <ScrollView style={styles.modalContent}>
              {/* Type Badge */}
              <View style={[styles.modalTypeBadge, { backgroundColor: getTypeColor(selectedRequest.type) }]}>
                <Ionicons name={getRequestIcon(selectedRequest.type) as any} size={20} color={theme.colors.text.white} />
                <Text style={styles.modalTypeBadgeText}>{getRequestTypeLabel(selectedRequest.type)}</Text>
              </View>

              {/* Requester */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Requested By</Text>
                <Text style={styles.modalValue}>{selectedRequest.requester_name}</Text>
              </View>

              {/* Leave-specific details */}
              {selectedRequest.type === 'leave' && (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Leave Type</Text>
                    <Text style={styles.modalValue}>{(selectedRequest as LeaveRequest).leave_type}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <View style={styles.modalHalf}>
                      <Text style={styles.modalLabel}>From</Text>
                      <Text style={styles.modalValue}>{formatDate((selectedRequest as LeaveRequest).start_date)}</Text>
                    </View>
                    <View style={styles.modalHalf}>
                      <Text style={styles.modalLabel}>To</Text>
                      <Text style={styles.modalValue}>{formatDate((selectedRequest as LeaveRequest).end_date)}</Text>
                    </View>
                  </View>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Duration</Text>
                    <Text style={styles.modalValue}>
                      {calculateDays((selectedRequest as LeaveRequest).start_date, (selectedRequest as LeaveRequest).end_date)} days
                    </Text>
                  </View>
                </>
              )}

              {/* Share Adjustment-specific details */}
              {selectedRequest.type === 'share_adjustment' && (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Vehicle</Text>
                    <Text style={styles.modalValue}>{(selectedRequest as ShareAdjustmentRequest).vehicle_license_plate}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <View style={styles.modalHalf}>
                      <Text style={styles.modalLabel}>Discount Days</Text>
                      <Text style={styles.modalValue}>{(selectedRequest as ShareAdjustmentRequest).discount_days} days</Text>
                    </View>
                    <View style={styles.modalHalf}>
                      <Text style={styles.modalLabel}>Daily Rate</Text>
                      <Text style={styles.modalValue}>{formatCurrency((selectedRequest as ShareAdjustmentRequest).daily_rate)}</Text>
                    </View>
                  </View>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Total Amount</Text>
                    <Text style={[styles.modalValue, styles.amountHighlight]}>
                      {formatCurrency((selectedRequest as ShareAdjustmentRequest).total_discount_amount)}
                    </Text>
                  </View>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Discount Date</Text>
                    <Text style={styles.modalValue}>{formatDate((selectedRequest as ShareAdjustmentRequest).discount_date)}</Text>
                  </View>

                  {/* Job Card Image */}
                  {(selectedRequest as ShareAdjustmentRequest).job_card_picture_url && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Job Card Photo</Text>
                      <Image
                        source={{ uri: (selectedRequest as ShareAdjustmentRequest).job_card_picture_url }}
                        style={styles.jobCardImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                </>
              )}

              {/* Reason */}
              {selectedRequest.reason && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Reason</Text>
                  <Text style={styles.modalValue}>{selectedRequest.reason}</Text>
                </View>
              )}

              {/* Submitted Date */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Submitted</Text>
                <Text style={styles.modalValue}>{formatDate(selectedRequest.created_at)}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.rejectButton]}
                  onPress={() => {
                    setShowDetailModal(false);
                    setTimeout(() => openRejectModal(selectedRequest), 300);
                  }}
                  disabled={processing === selectedRequest.id}
                >
                  <Ionicons name="close-circle" size={22} color={theme.colors.text.white} />
                  <Text style={styles.modalButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.approveButton]}
                  onPress={() => handleApprove(selectedRequest)}
                  disabled={processing === selectedRequest.id}
                >
                  {processing === selectedRequest.id ? (
                    <ActivityIndicator size="small" color={theme.colors.text.white} />
                  ) : (
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.text.white} />
                  )}
                  <Text style={styles.modalButtonText}>
                    {processing === selectedRequest.id ? 'Processing...' : 'Approve'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        visible={showRejectModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.rejectModalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Rejection Reason</Text>
            <Text style={styles.rejectModalSubtitle}>
              Please provide a reason for rejecting this request
            </Text>
            
            <TextInput
              style={styles.rejectInput}
              placeholder="Enter reason..."
              placeholderTextColor={theme.colors.text.secondary}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={styles.rejectModalCancel}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                <Text style={styles.rejectModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rejectModalConfirm, !rejectReason.trim() && styles.buttonDisabled]}
                onPress={handleReject}
                disabled={!rejectReason.trim() || processing !== null}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={theme.colors.text.white} />
                ) : (
                  <Text style={styles.rejectModalConfirmText}>Reject</Text>
                )}
              </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  filterContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: theme.colors.admin.primary,
  },
  filterText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: theme.colors.text.white,
  },
  filterBadge: {
    backgroundColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
  },
  filterBadgeTextActive: {
    color: theme.colors.text.white,
  },
  listContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: theme.spacing.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    color: theme.colors.text.white,
    fontWeight: '600',
  },
  requesterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  requesterName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  requestDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  detailsRow: {
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  detailSubtext: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.warning,
    marginTop: 4,
  },
  reasonText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  quickButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectQuickButton: {
    backgroundColor: '#FEE2E2',
  },
  approveQuickButton: {
    backgroundColor: '#D1FAE5',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  modalTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  modalTypeBadgeText: {
    fontSize: 16,
    color: theme.colors.text.white,
    fontWeight: '600',
  },
  modalSection: {
    marginBottom: theme.spacing.lg,
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  modalHalf: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalValue: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  amountHighlight: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  jobCardImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    marginTop: theme.spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.white,
  },
  // Reject Modal
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  rejectModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  rejectModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  rejectModalSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: 100,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  rejectModalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  rejectModalCancel: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  rejectModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  rejectModalConfirm: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
  },
  rejectModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
