/**
 * Network Utilities for Mobile App
 * Auto-detects network changes and provides connection status
 * Integrates with backend auto-detection to switch IPs when network changes
 */

import NetInfo from '@react-native-community/netinfo';
import { toastOfflineWarning, toastInfo } from './toastHelpers';
import { resetBackendDetection } from '../api';

let isOnline = true;
let currentNetworkType: string | null = null;
let listeners: Array<(online: boolean) => void> = [];

// Initialize network monitoring
export const initNetworkMonitoring = () => {
  // Subscribe to network state updates
  const unsubscribe = NetInfo.addEventListener(state => {
    const wasOnline = isOnline;
    const previousNetworkType = currentNetworkType;
    
    isOnline = state.isConnected ?? false;
    currentNetworkType = state.type;

    // Detect network change (went offline, came online, OR changed network type)
    const networkChanged = previousNetworkType !== currentNetworkType;

    // Only show toast if status changed
    if (wasOnline && !isOnline) {
      // Just went offline
      toastOfflineWarning();
      console.warn('📡 Network: OFFLINE - App will work with cached data');
    } else if (!wasOnline && isOnline) {
      // Just came back online
      toastInfo('Back Online', 'Connection restored. Detecting backend...');
      console.log('📡 Network: ONLINE - Connection restored, re-detecting backend URL...');
      
      // Reset backend detection to auto-detect new network IP
      resetBackendDetection().then(() => {
        console.log('🔄 Backend auto-detection reset - will detect on next API call');
      }).catch(error => {
        console.error('❌ Failed to reset backend detection:', error);
      });
    } else if (isOnline && networkChanged && previousNetworkType !== null) {
      // Network type changed while online (WiFi → cellular, or different WiFi)
      console.log(`📡 Network changed: ${previousNetworkType} → ${currentNetworkType}`);
      toastInfo('Network Changed', 'Detecting new backend IP...');
      
      // Reset backend detection to auto-detect new network IP
      resetBackendDetection().then(() => {
        console.log('🔄 Backend auto-detection reset - will detect on next API call');
      }).catch(error => {
        console.error('❌ Failed to reset backend detection:', error);
      });
    }

    // Notify all listeners
    listeners.forEach(callback => callback(isOnline));
  });

  // Initial check
  NetInfo.fetch().then(state => {
    isOnline = state.isConnected ?? false;
    currentNetworkType = state.type;
    console.log(`📡 Network: Initial status = ${isOnline ? 'ONLINE' : 'OFFLINE'} (${currentNetworkType})`);
  });

  return unsubscribe;
};

// Get current network status
export const isNetworkOnline = (): boolean => {
  return isOnline;
};

// Check network status (async, fresh from device)
export const checkNetworkStatus = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  isOnline = state.isConnected ?? false;
  return isOnline;
};

// Subscribe to network changes
export const onNetworkChange = (callback: (online: boolean) => void): (() => void) => {
  listeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
};

// Get detailed network info
export const getNetworkInfo = async () => {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected ?? false,
    type: state.type, // 'wifi', 'cellular', 'none', etc.
    isInternetReachable: state.isInternetReachable ?? false,
    details: state.details,
  };
};
