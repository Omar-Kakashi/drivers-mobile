/**
 * Dashboard Summary Widget
 * Shows at-a-glance information on driver dashboard:
 * - Days until next document expires
 * - Current balance with trend indicator
 * - Quick status indicators
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDocumentStore, getExpiryStatusColor } from '../stores/documentStore';
import { useBalanceStore } from '../stores/balanceStore';
import { theme } from '../theme';
import { lightHaptic } from '../utils/haptics';

interface DashboardSummaryWidgetProps {
  driverId: string;
  userId: string;
}

export function DashboardSummaryWidget({ driverId, userId }: DashboardSummaryWidgetProps) {
  const navigation = useNavigation<any>();
  
  // Store data
  const { 
    nearestExpiryDays, 
    expiringDocuments,
    fetchDocuments,
    isLoading: docsLoading 
  } = useDocumentStore();
  
  const { 
    balance, 
    fetchBalance,
    isLoading: balanceLoading 
  } = useBalanceStore();
  
  // Fetch data on mount
  useEffect(() => {
    if (driverId) {
      fetchDocuments(driverId);
    }
    if (userId) {
      fetchBalance(userId);
    }
  }, [driverId, userId]);
  
  // Navigate to documents screen
  const handleDocumentPress = () => {
    lightHaptic();
    navigation.navigate('Documents');
  };
  
  // Navigate to balance screen
  const handleBalancePress = () => {
    lightHaptic();
    navigation.navigate('Balance');
  };
  
  // Determine document status
  const getDocumentStatus = () => {
    if (docsLoading && nearestExpiryDays === null) {
      return { icon: 'file-document-outline', color: theme.colors.text.secondary, text: 'Loading...' };
    }
    
    // If no documents at all, this is a problem - not "All OK"
    const allDocs = useDocumentStore.getState().documents;
    if (allDocs.length === 0) {
      return { icon: 'file-document-alert', color: '#F59E0B', text: 'No Documents' };
    }
    
    if (nearestExpiryDays !== null) {
      const color = getExpiryStatusColor(nearestExpiryDays);
      if (nearestExpiryDays < 0) {
        return { icon: 'file-document-alert', color, text: 'Expired!' };
      }
      if (nearestExpiryDays === 0) {
        return { icon: 'file-document-alert', color, text: 'Expires Today!' };
      }
      if (nearestExpiryDays === 1) {
        return { icon: 'file-document-alert', color, text: '1 day left' };
      }
      if (nearestExpiryDays <= 30) {
        return { icon: 'file-document-alert', color, text: `${nearestExpiryDays} days left` };
      }
      return { icon: 'file-document-check', color: '#10B981', text: 'All OK' };
    }
    
    // Has documents but none with expiry dates tracked
    if (expiringDocuments.length === 0) {
      return { icon: 'file-document-check', color: '#10B981', text: 'All OK' };
    }
    
    return { icon: 'file-document-outline', color: theme.colors.text.secondary, text: 'No docs' };
  };
  
  // Determine balance status
  const getBalanceStatus = () => {
    if (balanceLoading && balance === null) {
      return { color: theme.colors.text.secondary, text: 'Loading...' };
    }
    
    // Extract current_balance from Balance object
    const balanceValue = balance?.current_balance ?? 0;
    const numericBalance = typeof balanceValue === 'string' ? parseFloat(balanceValue) : balanceValue;
    
    const formattedBalance = Math.abs(numericBalance).toLocaleString('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    if (numericBalance > 0) {
      return { 
        icon: 'arrow-up-circle', 
        color: '#10B981', 
        text: `AED ${formattedBalance}`,
        label: 'Credit'
      };
    } else if (numericBalance < 0) {
      return { 
        icon: 'arrow-down-circle', 
        color: '#EF4444', 
        text: `AED ${formattedBalance}`,
        label: 'Due'
      };
    }
    return { 
      icon: 'checkbox-marked-circle', 
      color: '#10B981', 
      text: 'AED 0.00',
      label: 'Clear'
    };
  };
  
  const docStatus = getDocumentStatus();
  const balanceStatus = getBalanceStatus();
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Overview</Text>
      
      <View style={styles.widgetsRow}>
        {/* Document Status Widget */}
        <TouchableOpacity 
          style={styles.widget}
          onPress={handleDocumentPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${docStatus.color}15` }]}>
            <MaterialCommunityIcons 
              name={docStatus.icon as any}
              size={24} 
              color={docStatus.color} 
            />
          </View>
          <Text style={styles.widgetLabel}>Documents</Text>
          <Text style={[styles.widgetValue, { color: docStatus.color }]}>
            {docStatus.text}
          </Text>
          {expiringDocuments.length > 1 && (
            <Text style={styles.widgetSubtext}>
              +{expiringDocuments.length - 1} more expiring
            </Text>
          )}
        </TouchableOpacity>
        
        {/* Balance Widget */}
        <TouchableOpacity 
          style={styles.widget}
          onPress={handleBalancePress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${balanceStatus.color}15` }]}>
            <MaterialCommunityIcons 
              name={(balanceStatus as any).icon || 'wallet'} 
              size={24} 
              color={balanceStatus.color} 
            />
          </View>
          <Text style={styles.widgetLabel}>Balance</Text>
          <Text style={[styles.widgetValue, { color: balanceStatus.color }]}>
            {balanceStatus.text}
          </Text>
          {(balanceStatus as any).label && (
            <Text style={styles.widgetSubtext}>
              {(balanceStatus as any).label}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  widgetsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  widget: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  widgetLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  widgetValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  widgetSubtext: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
});

export default DashboardSummaryWidget;
