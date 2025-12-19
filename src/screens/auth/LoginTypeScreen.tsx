import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../../theme';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../../components/Logo';

export default function LoginTypeScreen({ navigation }: any) {
  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Logo size={100} style={styles.logo} />
          <Text style={styles.title}>Ostol</Text>
          <Text style={styles.subtitle}>Fleet Management System</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Card variant="elevated" style={styles.actionCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.driver.light }]}>
                <Ionicons name="person" size={24} color={theme.colors.driver.primary} />
              </View>
              <View>
                <Text style={styles.roleTitle}>Driver</Text>
                <Text style={styles.roleSubtitle}>Access your fleet dashboard</Text>
              </View>
            </View>
            <Button
              title="Driver Login"
              onPress={() => navigation.navigate('DriverLogin')}
              fullWidth
            />
          </Card>

          <Card variant="elevated" style={styles.actionCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.admin.light }]}>
                <Ionicons name="shield-checkmark" size={24} color={theme.colors.admin.primary} />
              </View>
              <View>
                <Text style={styles.roleTitle}>Admin</Text>
                <Text style={styles.roleSubtitle}>Manage fleet operations</Text>
              </View>
            </View>
            <Button
              title="Admin Login"
              variant="secondary"
              onPress={() => navigation.navigate('AdminLogin')}
              fullWidth
            />
          </Card>
        </View>

        <Text style={styles.footer}>Version 1.0.0</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.layout.containerPadding,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  buttonContainer: {
    gap: theme.spacing.md,
  },
  actionCard: {
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  roleSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  footer: {
    ...theme.typography.caption,
    color: theme.colors.text.disabled,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});
