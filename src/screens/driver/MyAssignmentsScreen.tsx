import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';

export default function MyAssignmentsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);

  const loadAssignment = async () => {
    try {
      const data = await backendAPI.getDriverAssignment(user?.id || '');
      setAssignment(data.assignment);
      setVehicle(data.vehicle);
    } catch (error) {
      console.error('Failed to load assignment:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadAssignment();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignment();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.driver.primary} />
      </View>
    );
  }

  if (!assignment) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No Active Assignment</Text>
          <Text style={styles.emptySubtext}>You currently don't have any vehicle assigned</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Assignment</Text>
        
        {vehicle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>License Plate:</Text>
              <Text style={styles.value}>{vehicle.license_plate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Type:</Text>
              <Text style={styles.value}>{vehicle.car_type || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Model:</Text>
              <Text style={styles.value}>{vehicle.car_model || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Daily Rent:</Text>
              <Text style={styles.value}>AED {vehicle.daily_rental_rate}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Assignment Date:</Text>
            <Text style={styles.value}>
              {assignment.assignment_date ? new Date(assignment.assignment_date).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.status.active }]}>
              <Text style={styles.statusText}>{assignment.status}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Shared:</Text>
            <Text style={styles.value}>{assignment.is_shared ? 'Yes' : 'No'}</Text>
          </View>
          {assignment.notes && (
            <View style={styles.row}>
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{assignment.notes}</Text>
            </View>
          )}
        </View>
      </View>
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
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
    ...theme.shadows.md,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.driver.primary,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  value: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});