import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';

export default function DriverHRHubScreen() {
  const navigation = useNavigation<any>();

  const hrOptions = [
    {
      id: 'leave-request',
      title: 'Request Leave',
      description: 'Submit a new leave request',
      icon: 'calendar-outline' as const,
      color: theme.colors.driver.primary,
      screen: 'Leave Request',
    },
    {
      id: 'my-requests',
      title: 'My Requests',
      description: 'View all your HR requests',
      icon: 'list' as const,
      color: '#3B82F6',
      screen: 'My Requests',
    },
    {
      id: 'leave-return',
      title: 'Announce Return from Leave',
      description: 'Notify management of your return to work',
      icon: 'arrow-back-circle' as const,
      color: theme.colors.success,
      screen: 'LeaveReturn',
    },
    {
      id: 'passport-handover',
      title: 'Passport Handover',
      description: 'Submit passport for official procedures',
      icon: 'document-lock' as const,
      color: theme.colors.warning,
      screen: 'PassportHandover',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="business" size={40} color={theme.colors.driver.primary} />
        <Text style={styles.headerTitle}>HR Services</Text>
        <Text style={styles.headerSubtitle}>Submit requests and notify management</Text>
      </View>

      <View style={styles.cardsContainer}>
        {hrOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.card}
            onPress={() => navigation.navigate(option.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
              <Ionicons name={option.icon} size={36} color={option.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={24} color={theme.colors.info} />
          <Text style={styles.infoTitle}>Information</Text>
        </View>
        <Text style={styles.infoText}>
          • All HR requests are reviewed by management
        </Text>
        <Text style={styles.infoText}>
          • You will receive notifications about request status
        </Text>
        <Text style={styles.infoText}>
          • For urgent matters, contact your supervisor directly
        </Text>
        <Text style={styles.infoText}>
          • Keep your contact information up to date
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
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  cardsContainer: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.medium,
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  cardDescription: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  infoCard: {
    backgroundColor: theme.colors.info + '15',
    margin: theme.spacing.md,
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  infoTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
});
