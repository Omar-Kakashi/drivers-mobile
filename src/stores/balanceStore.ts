/**
 * Balance Store - Zustand
 * Caches driver balance data with stale-while-revalidate pattern
 * Provides instant loading with background refresh
 */

import { create } from 'zustand';
import { backendAPI } from '../api';
import { Balance } from '../types';

interface BalanceState {
  // Data
  balance: Balance | null;
  transactions: any[];
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetched: number | null;
  
  // Error state
  error: string | null;
  
  // Actions
  fetchBalance: (driverId: string, forceRefresh?: boolean) => Promise<void>;
  fetchTransactions: (driverId: string, filters?: TransactionFilters) => Promise<void>;
  clearCache: () => void;
}

interface TransactionFilters {
  month?: number;
  year?: number;
  transactionType?: string;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useBalanceStore = create<BalanceState>((set, get) => ({
  balance: null,
  transactions: [],
  isLoading: false,
  isRefreshing: false,
  lastFetched: null,
  error: null,

  fetchBalance: async (driverId: string, forceRefresh = false) => {
    const { balance, lastFetched, isLoading } = get();
    
    // If already loading, skip
    if (isLoading) return;
    
    // Check if cache is still valid
    const now = Date.now();
    const isCacheValid = lastFetched && (now - lastFetched) < CACHE_DURATION;
    
    // If we have cached data and not forcing refresh, show cached first
    if (balance && isCacheValid && !forceRefresh) {
      // Background refresh (stale-while-revalidate)
      set({ isRefreshing: true });
      try {
        const freshData = await backendAPI.getDriverBalance(driverId);
        set({ 
          balance: freshData, 
          lastFetched: Date.now(),
          isRefreshing: false,
          error: null 
        });
      } catch (error: any) {
        console.warn('Background balance refresh failed:', error.message);
        set({ isRefreshing: false });
      }
      return;
    }
    
    // No cache or expired - show loading
    set({ isLoading: !balance, isRefreshing: !!balance, error: null });
    
    try {
      const data = await backendAPI.getDriverBalance(driverId);
      set({ 
        balance: data, 
        lastFetched: Date.now(),
        isLoading: false,
        isRefreshing: false,
        error: null 
      });
    } catch (error: any) {
      console.error('Failed to fetch balance:', error);
      set({ 
        isLoading: false, 
        isRefreshing: false,
        error: error.message || 'Failed to load balance' 
      });
    }
  },

  fetchTransactions: async (driverId: string, filters?: TransactionFilters) => {
    try {
      const data = await backendAPI.getDriverTransactions(
        driverId,
        filters?.month,
        filters?.year,
        filters?.transactionType
      );
      set({ transactions: data.transactions || data });
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
    }
  },

  clearCache: () => {
    set({ 
      balance: null, 
      transactions: [],
      lastFetched: null,
      error: null 
    });
  },
}));
