/**
 * Offline Banner Component
 * Shows a clear indicator when the device is offline
 * Displays at the top of screens that need network connectivity
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore, useIsOffline } from '../stores/networkStore';

interface OfflineBannerProps {
  /** Custom message to show (default: "You're offline - showing cached data") */
  message?: string;
  /** Whether to show inside SafeAreaView (adjusts for notch) */
  respectSafeArea?: boolean;
}

export function OfflineBanner({ 
  message = "You're offline - showing cached data", 
  respectSafeArea = false 
}: OfflineBannerProps) {
  const isOffline = useIsOffline();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-60)).current;
  
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline ? 0 : -60,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [isOffline]);
  
  if (!isOffline) {
    return null; // Don't render when online
  }
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [{ translateY: slideAnim }],
          paddingTop: respectSafeArea ? insets.top + 8 : 8,
        }
      ]}
    >
      <MaterialCommunityIcons name="wifi-off" size={18} color="#FFFFFF" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

/**
 * Smaller inline offline indicator (for cards/buttons)
 */
export function OfflineIndicator() {
  const isOffline = useIsOffline();
  
  if (!isOffline) return null;
  
  return (
    <View style={styles.indicator}>
      <MaterialCommunityIcons name="wifi-off" size={12} color="#92400E" />
      <Text style={styles.indicatorText}>Offline</Text>
    </View>
  );
}

/**
 * Hook to get disable state for buttons that require network
 */
export function useDisableIfOffline(): boolean {
  return useIsOffline();
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 1000,
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  indicatorText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default OfflineBanner;
