/**
 * Profile Screen - Driver profile, settings, password change, biometric
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Image, ActivityIndicator, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import { Driver, Balance } from '../../types';
import { toastValidationError, toastUpdateSuccess, toastError, toastSuccess } from '../../utils/toastHelpers';
import { 
  isBiometricAvailable, 
  isBiometricEnabled, 
  enableBiometric, 
  disableBiometric,
  getBiometricTypeName,
  authenticateBiometric
} from '../../utils/biometric';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<any>();
  const driver = user as Driver;
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  
  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometrics');
  const [loadingBiometric, setLoadingBiometric] = useState(true);

  useEffect(() => {
    loadBalance();
    loadBiometricStatus();
  }, []);
  
  const loadBiometricStatus = async () => {
    try {
      const [available, enabled, name] = await Promise.all([
        isBiometricAvailable(),
        isBiometricEnabled(),
        getBiometricTypeName(),
      ]);
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
      setBiometricName(name);
    } catch (error) {
      console.error('Failed to check biometric status:', error);
    } finally {
      setLoadingBiometric(false);
    }
  };
  
  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        // Verify biometric before enabling
        const result = await authenticateBiometric(`Verify ${biometricName} to enable`);
        if (result.success) {
          await enableBiometric(driver.id);
          setBiometricEnabled(true);
          toastSuccess(`${biometricName} enabled for quick login`);
        } else if (result.error && result.error !== 'Cancelled') {
          toastError({ message: result.error }, 'Biometric Failed');
        }
      } else {
        await disableBiometric();
        setBiometricEnabled(false);
        toastSuccess(`${biometricName} disabled`);
      }
    } catch (error: any) {
      toastError(error, 'Failed to update biometric setting');
    }
  };

  const loadBalance = async () => {
    try {
      const data = await backendAPI.getDriverBalance(driver.id);
      setBalance(data);
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toastValidationError('password (must be at least 6 characters)');
      return;
    }

    if (newPassword !== confirmPassword) {
      toastValidationError('password confirmation (passwords must match)');
      return;
    }

    try {
      setChanging(true);
      await backendAPI.changePassword(driver.id, 'driver', newPassword);
      toastUpdateSuccess('Password');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toastError(error, 'Password Change Failed');
    } finally {
      setChanging(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {driver.profile_picture_url ? (
            <Image 
              source={{ uri: driver.profile_picture_url }} 
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person" size={48} color={theme.colors.text.white} />
          )}
        </View>
        <Text style={styles.name}>{driver.name}</Text>
        <Text style={styles.driverId}>ID: {driver.driver_id}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('Balance')}
        >
          <Ionicons name="wallet-outline" size={24} color={theme.colors.driver.primary} />
          {loadingBalance ? (
            <ActivityIndicator size="small" color={theme.colors.driver.primary} style={{ marginTop: 8 }} />
          ) : (
            <>
              <Text style={styles.statValue}>
                {balance ? formatCurrency(balance.current_balance) : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Current Balance</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('Assignments')}
        >
          <Ionicons name="car-sport-outline" size={24} color={theme.colors.driver.primary} />
          <Text style={styles.statValue}>
            {driver.current_vehicle_id ? '1' : '0'}
          </Text>
          <Text style={styles.statLabel}>Active Vehicle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('Settlements')}
        >
          <Ionicons name="document-text-outline" size={24} color={theme.colors.driver.primary} />
          <Text style={styles.statValue}>View</Text>
          <Text style={styles.statLabel}>Settlements</Text>
        </TouchableOpacity>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{driver.phone || driver.phone_number || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{driver.email || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>
              {driver.created_at ? new Date(driver.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, driver.status === 'active' ? styles.statusActive : {}]}>
              {driver.status ? driver.status.toUpperCase() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Current Assignment */}
      {driver.current_vehicle_id && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Assignment</Text>
          <View style={styles.infoCard}>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Ionicons name="car-sport-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>Active Assignment</Text>
            </View>
          </View>
        </View>
      )}

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        {/* Biometric Login Toggle */}
        {biometricAvailable && !loadingBiometric && (
          <View style={styles.settingRow}>
            <Ionicons 
              name={biometricName.includes('Face') ? 'scan-outline' : 'finger-print-outline'} 
              size={24} 
              color={theme.colors.driver.primary} 
            />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>{biometricName} Login</Text>
              <Text style={styles.settingSubtext}>Quick login without password</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.driver.light }}
              thumbColor={biometricEnabled ? theme.colors.driver.primary : '#f4f3f4'}
            />
          </View>
        )}
        
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => navigation.navigate('AccidentReportHistory')}
        >
          <MaterialCommunityIcons name="car-emergency" size={24} color="#DC2626" />
          <Text style={[styles.settingText, styles.settingButtonText]}>Accident Report History</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => setShowPasswordModal(true)}
        >
          <Ionicons name="key-outline" size={24} color={theme.colors.driver.primary} />
          <Text style={[styles.settingText, styles.settingButtonText]}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.settingText, styles.settingButtonText, styles.logoutText]}>Logout</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Ostol Fleet Manager</Text>
        <Text style={styles.appInfoText}>Version 1.0.0</Text>
        <Text style={styles.appInfoSubtext}>© 2025 STSC. All rights reserved.</Text>
      </View>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.changeButton, changing && styles.changeButtonDisabled]}
                onPress={handleChangePassword}
                disabled={changing}
              >
                <Text style={styles.changeButtonText}>
                  {changing ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.driver.primary,
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    ...theme.typography.h2,
    color: theme.colors.text.white,
    marginBottom: theme.spacing.xs,
  },
  driverId: {
    ...theme.typography.body1,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    marginTop: -30,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginHorizontal: 4,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  infoValue: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  statusActive: {
    color: theme.colors.success,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  settingText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
  settingSubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  settingButtonText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  logoutText: {
    color: theme.colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
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
  inputLabel: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
  changeButton: {
    backgroundColor: theme.colors.driver.primary,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  changeButtonDisabled: {
    opacity: 0.5,
  },
  changeButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.white,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  appInfoText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
});
