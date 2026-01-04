/**
 * Network Store - Zustand
 * Tracks network connectivity status for offline mode indicators
 */

import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  
  // Actions
  initialize: () => () => void; // Returns unsubscribe function
  checkConnection: () => Promise<boolean>;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true, // Optimistic default
  isInternetReachable: true,
  connectionType: null,
  
  initialize: () => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      set({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
      
      // Log connection changes for debugging
      if (state.isConnected === false) {
        console.log('📵 Device went offline');
      } else if (state.isConnected === true) {
        console.log('📶 Device is online');
      }
    });
    
    // Also fetch current state immediately
    NetInfo.fetch().then((state: NetInfoState) => {
      set({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });
    
    return unsubscribe;
  },
  
  checkConnection: async () => {
    const state = await NetInfo.fetch();
    set({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
    });
    return state.isConnected ?? false;
  },
}));

/**
 * Hook to check if currently offline
 */
export function useIsOffline(): boolean {
  const isConnected = useNetworkStore(state => state.isConnected);
  return isConnected === false;
}
