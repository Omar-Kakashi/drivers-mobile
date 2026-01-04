/**
 * Admin Profile Screen - Admin profile, settings, password change
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Image, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { backendAPI } from '../../api';
import Toast from 'react-native-toast-message';
import { 
  isBiometricAvailable, 
  isBiometricEnabled, 
  enableBiometric, 
  disableBiometric,
  getBiometricTypeName,
  authenticateBiometric
} from '../../utils/biometric';

export default function AdminProfileScreen() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<any>();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  
  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometrics');
  const [loadingBiometric, setLoadingBiometric] = useState(true);

  useEffect(() => {
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
        const result = await authenticateBiometric(`Verify ${biometricName} to enable`);
        if (result.success) {
          await enableBiometric(user?.id || '');
          setBiometricEnabled(true);
          Toast.show({
            type: 'success',
            text1: 'Biometric Enabled',
            text2: `${biometricName} enabled for quick login`,
          });
        } else if (result.error && result.error !== 'Cancelled') {
          Toast.show({
            type: 'error',
            text1: 'Biometric Failed',
            text2: result.error,
          });
        }
      } else {
        await disableBiometric();
        setBiometricEnabled(false);
        Toast.show({
          type: 'success',
          text1: 'Biometric Disabled',
          text2: `${biometricName} disabled`,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update biometric setting',
      });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Password',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords Don\'t Match',
        text2: 'Please confirm your new password',
      });
      return;
    }

    try {
      setChanging(true);
      await backendAPI.changePassword(user?.id || '', 'admin', newPassword);
      Toast.show({
        type: 'success',
        text1: 'Password Changed',
        text2: 'Your password has been updated',
      });
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Password Change Failed',
        text2: error.response?.data?.detail || 'Failed to change password',
      });
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

  const formatRole = (role?: string) => {
    if (!role) return 'Admin';
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={48} color={theme.colors.text.white} />
        </View>
        <Text style={styles.name}>{user?.name || 'Admin User'}</Text>
        <Text style={styles.role}>{formatRole((user as any)?.role)}</Text>
        <Text style={styles.email}>{(user as any)?.email || ''}</Text>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{(user as any)?.email || 'N/A'}</Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="shield-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={[styles.infoValue, { color: theme.colors.admin.primary }]}>
              {formatRole((user as any)?.role)}
            </Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        {/* Biometric Login Toggle */}
        {biometricAvailable && !loadingBiometric && (
          <View style={styles.settingRow}>
            <Ionicons 
              name={biometricName.includes('Face') ? 'scan-outline' : 'finger-print-outline'} 
              size={24} 
              color={theme.colors.admin.primary} 
            />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>{biometricName} Login</Text>
              <Text style={styles.settingSubtext}>Quick login without password</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.admin.light }}
              thumbColor={biometricEnabled ? theme.colors.admin.primary : '#f4f3f4'}
            />
          </View>
        )}
        
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => setShowPasswordModal(true)}
        >
          <Ionicons name="key-outline" size={24} color={theme.colors.admin.primary} />
          <Text style={[styles.settingText, styles.settingButtonText]}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.settingText, styles.settingButtonText, styles.logoutText]}>Logout</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard2}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={24} color={theme.colors.admin.primary} />
          <Text style={styles.infoCardTitle}>Mobile App Access</Text>
        </View>
        <Text style={styles.infoText}>
          The mobile app provides quick access to approve requests, view notifications, and manage HR tasks. For full administrative features including driver management, vehicle assignments, and reporting, please use the web portal.
        </Text>
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
                placeholderTextColor={theme.colors.text.secondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={theme.colors.text.secondary}
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
    backgroundColor: theme.colors.admin.primary,
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
  name: {
    ...theme.typography.h2,
    color: theme.colors.text.white,
    marginBottom: theme.spacing.xs,
  },
  role: {
    ...theme.typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  email: {
    ...theme.typography.body2,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
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
  infoCard2: {
    backgroundColor: theme.colors.admin.light,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  infoCardTitle: {
    ...theme.typography.h4,
    color: theme.colors.admin.primary,
    fontWeight: '600',
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    lineHeight: 20,
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
    backgroundColor: theme.colors.admin.primary,
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
