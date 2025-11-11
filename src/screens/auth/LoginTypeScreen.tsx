/**
 * Login Type Screen - Choose Driver or Admin Login
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { theme } from '../../theme';

export default function LoginTypeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ostol Mobile</Text>
        <Text style={styles.subtitle}>Fleet Management System</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.driverButton]}
          onPress={() => navigation.navigate('DriverLogin')}
        >
          <Text style={styles.buttonText}>Driver Login</Text>
          <Text style={styles.buttonSubtext}>For fleet drivers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Text style={styles.buttonText}>Admin Login</Text>
          <Text style={styles.buttonSubtext}>For staff members</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  buttonContainer: {
    gap: theme.spacing.lg,
  },
  button: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  driverButton: {
    backgroundColor: theme.colors.primary,
  },
  adminButton: {
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    ...theme.typography.h3,
    color: theme.colors.text.white,
    marginBottom: theme.spacing.xs,
  },
  buttonSubtext: {
    ...theme.typography.body2,
    color: theme.colors.text.white,
    opacity: 0.9,
  },
  footer: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl * 2,
  },
});
