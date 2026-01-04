/**
 * My Requests Screen - Unified view of all HR requests
 * Includes: Leave Requests, Passport Handovers, NOC, Salary Certificate, Accident Reports
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import { LeaveRequest, PassportHandover } from '../../types';

type RequestItem = {
  id: string;
  type: string; // 'leave', 'passport', 'noc', 'salary_certificate', 'early_leave', 'accident_report'
  status: string;
  title: string;
  subtitle: string;
  date: string;
  data: any;
};

const MyRequestsScreen = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchAllRequests = async () => {
    if (!user?.id) return;
    
    try {
      setError(null);
      
      // Fetch all request types in parallel
      const [leaveRequests, passportHandovers, hrRequests] = await Promise.all([
        backendAPI.getLeaveRequests(user.id, 'driver').catch(() => []),
        backendAPI.getPassportHandovers(user.id, 'driver').catch(() => []),
        backendAPI.getHRRequests(user.id).catch(() => []),
      ]);

      // Combine and format all requests
      const combined: RequestItem[] = [
        // Leave requests
        ...(leaveRequests || []).map((req: LeaveRequest) => ({
          id: req.id,
          type: 'leave',
          status: req.status,
          title: getLeaveTypeName(req.leave_type_id),
          subtitle: `${formatDate(req.start_date)} - ${formatDate(req.end_date)}`,
          date: req.created_at,
          data: req,
        })),
        // Passport handover requests
        ...(passportHandovers || []).map((req: PassportHandover) => ({
          id: req.id,
          type: 'passport',
          status: req.workflow_state || req.status,
          title: 'Passport Handover',
          subtitle: `Return: ${formatDate(req.expected_return_date)}`,
          date: req.created_at,
          data: req,
        })),
        // HR Requests (NOC, Salary Certificate, Early Leave, Accident Reports)
        ...(hrRequests || []).map((req: any) => ({
          id: req.id,
          type: req.request_type,
          status: req.status,
          title: getRequestTypeName(req.request_type),
          subtitle: getRequestSubtitle(req),
          date: req.created_at,
          data: req,
        })),
      ];

      // Remove duplicates (HR requests might include same leave/passport data)
      const uniqueRequests = combined.filter((req, index, self) =>
        index === self.findIndex((r) => r.id === req.id)
      );

      // Sort by date (newest first)
      uniqueRequests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setRequests(uniqueRequests);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllRequests();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllRequests, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllRequests();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      case 'pending':
      case 'pending_first_approval':
      case 'pending_hr_approval':
      case 'pending_accounting_approval':
        return theme.colors.warning;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
      case 'pending_first_approval':
      case 'pending_hr_approval':
      case 'pending_accounting_approval':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_first_approval':
        return 'PENDING MANAGER';
      case 'pending_hr_approval':
        return 'PENDING HR';
      case 'pending_accounting_approval':
        return 'PENDING ACCOUNTING';
      default:
        return status ? status.toUpperCase() : 'UNKNOWN';
    }
  };

  const getLeaveTypeName = (typeId: string) => {
    const mapping: Record<string, string> = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      emergency: 'Emergency Leave',
      unpaid: 'Unpaid Leave',
    };
    return mapping[typeId] || typeId;
  };

  const getRequestTypeName = (requestType: string) => {
    const mapping: Record<string, string> = {
      noc: 'NOC Request',
      salary_certificate: 'Salary Certificate',
      early_leave: 'Early Leave',
      accident_report: 'Accident Report',
      leave_request: 'Leave Request',
      passport_handover: 'Passport Handover',
    };
    return mapping[requestType] || requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRequestSubtitle = (req: any) => {
    const data = req.data || {};
    switch (req.request_type) {
      case 'noc':
        return data.purpose || 'No Objection Certificate';
      case 'salary_certificate':
        return data.purpose || 'For official use';
      case 'early_leave':
        return data.leave_time ? `Leave at: ${data.leave_time}` : 'Early departure request';
      case 'accident_report':
        return data.accident_date ? `Date: ${formatDate(data.accident_date)}` : 'Accident documentation';
      default:
        return formatDate(req.created_at);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return { name: 'calendar-outline', family: 'ionicons' };
      case 'passport':
        return { name: 'document-lock-outline', family: 'ionicons' };
      case 'noc':
        return { name: 'file-certificate', family: 'material-community' };
      case 'salary_certificate':
        return { name: 'document-text-outline', family: 'ionicons' };
      case 'early_leave':
        return { name: 'time-outline', family: 'ionicons' };
      case 'accident_report':
        return { name: 'car-emergency', family: 'material-community' };
      default:
        return { name: 'document-outline', family: 'ionicons' };
    }
  };

  const getRequestIconColor = (type: string) => {
    switch (type) {
      case 'leave':
        return theme.colors.driver.primary;
      case 'passport':
        return theme.colors.warning;
      case 'noc':
        return '#6366F1';
      case 'salary_certificate':
        return '#F59E0B';
      case 'early_leave':
        return '#EC4899';
      case 'accident_report':
        return '#DC2626';
      default:
        return theme.colors.text.secondary;
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') {
      return req.status.includes('pending');
    }
    return req.status === filterStatus;
  });

  const renderFilterButton = (label: string, value: typeof filterStatus) => (
    <TouchableOpacity
      style={[styles.filterButton, filterStatus === value && styles.filterButtonActive]}
      onPress={() => setFilterStatus(value)}
    >
      <Text style={[styles.filterText, filterStatus === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRequestIcon = (type: string) => {
    const iconInfo = getRequestIcon(type);
    const iconColor = getRequestIconColor(type);
    
    if (iconInfo.family === 'material-community') {
      return <MaterialCommunityIcons name={iconInfo.name as any} size={24} color={iconColor} />;
    }
    return <Ionicons name={iconInfo.name as any} size={24} color={iconColor} />;
  };

  const renderRequest = ({ item }: { item: RequestItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          {renderRequestIcon(item.type)}
          <View style={styles.titleContainer}>
            <Text style={styles.requestTitle}>{item.title}</Text>
            <Text style={styles.requestSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status) as any} size={14} color="white" />
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
          <Text style={styles.dateText}>Submitted: {formatDate(item.date)}</Text>
        </View>
      </View>

      {/* Show additional details based on type */}
      {item.type === 'leave' && item.data?.reason && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailLabel}>Reason:</Text>
          <Text style={styles.detailText}>{item.data.reason}</Text>
        </View>
      )}
      
      {item.type === 'passport' && item.data?.reason && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailLabel}>Purpose:</Text>
          <Text style={styles.detailText}>
            {item.data.reason?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </Text>
        </View>
      )}

      {/* NOC and other HR requests */}
      {item.data?.data?.purpose && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailLabel}>Purpose:</Text>
          <Text style={styles.detailText}>{item.data.data.purpose}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.driver.primary} />
        <Text style={styles.loadingText}>Loading your requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {renderFilterButton('All', 'all')}
        {renderFilterButton('Pending', 'pending')}
        {renderFilterButton('Approved', 'approved')}
        {renderFilterButton('Rejected', 'rejected')}
      </View>

      <FlatList
        data={filteredRequests}
        renderItem={renderRequest}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={80} color={theme.colors.text.secondary} />
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptyText}>
              {filterStatus === 'all' 
                ? "You haven't submitted any HR requests yet."
                : `No ${filterStatus} requests found.`}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.driver.primary,
    borderColor: theme.colors.driver.primary,
  },
  filterText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: theme.colors.text.white,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  titleContainer: {
    flex: 1,
  },
  requestTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  requestSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.text.white,
    fontWeight: '700',
    fontSize: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  detailsSection: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  detailLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailText: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default MyRequestsScreen;
