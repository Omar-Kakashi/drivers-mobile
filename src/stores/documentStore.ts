/**
 * Document Store - Zustand
 * Caches driver documents with expiry alerts
 * Provides instant loading with background refresh
 */

import { create } from 'zustand';
import { backendAPI } from '../api';

interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: string;
  document_number?: string;
  file_url?: string;
  expiry_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface DocumentState {
  // Data
  documents: DriverDocument[];
  expiringDocuments: DriverDocument[];
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetched: number | null;
  
  // Computed values
  nearestExpiryDays: number | null;
  
  // Actions
  fetchDocuments: (driverId: string, forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
}

// Cache duration: 30 minutes (documents don't change often)
const CACHE_DURATION = 30 * 60 * 1000;

/**
 * Calculate days until a date
 */
function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  expiringDocuments: [],
  isLoading: false,
  isRefreshing: false,
  lastFetched: null,
  nearestExpiryDays: null,

  fetchDocuments: async (driverId: string, forceRefresh = false) => {
    const { documents, lastFetched, isLoading } = get();
    
    // If already loading, skip
    if (isLoading) return;
    
    // Check if cache is still valid
    const now = Date.now();
    const isCacheValid = lastFetched && (now - lastFetched) < CACHE_DURATION;
    
    // If we have cached data and not forcing refresh
    if (documents.length > 0 && isCacheValid && !forceRefresh) {
      // Background refresh
      set({ isRefreshing: true });
      try {
        await fetchAndUpdate(driverId, set);
        set({ isRefreshing: false });
      } catch (error: any) {
        console.warn('Background document refresh failed:', error.message);
        set({ isRefreshing: false });
      }
      return;
    }
    
    // No cache or expired - show loading
    set({ isLoading: documents.length === 0, isRefreshing: documents.length > 0 });
    
    try {
      await fetchAndUpdate(driverId, set);
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      set({ isLoading: false, isRefreshing: false });
    }
  },

  clearCache: () => {
    set({ 
      documents: [], 
      expiringDocuments: [],
      lastFetched: null,
      nearestExpiryDays: null 
    });
  },
}));

/**
 * Helper to fetch and update store
 */
async function fetchAndUpdate(driverId: string, set: any) {
  const [allDocs, expiringDocs] = await Promise.all([
    backendAPI.getDriverDocuments(driverId),
    backendAPI.getExpiringDocuments(driverId),
  ]);
  
  // Calculate nearest expiry
  let nearestDays: number | null = null;
  for (const doc of allDocs) {
    if (doc.expiry_date) {
      const days = daysUntil(doc.expiry_date);
      if (days >= 0 && (nearestDays === null || days < nearestDays)) {
        nearestDays = days;
      }
    }
  }
  
  set({ 
    documents: allDocs,
    expiringDocuments: expiringDocs,
    nearestExpiryDays: nearestDays,
    lastFetched: Date.now(),
    isLoading: false,
    isRefreshing: false,
  });
}

/**
 * Helper function to get document type label
 */
export function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'license': 'Driving License',
    'emirates_id': 'Emirates ID',
    'passport': 'Passport',
    'visa': 'Visa',
    'medical_certificate': 'Medical Certificate',
    'rta_permit': 'RTA Permit',
    'vehicle_registration': 'Vehicle Registration',
    'insurance': 'Insurance',
    'other': 'Other Document',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get expiry status color
 */
export function getExpiryStatusColor(daysUntilExpiry: number): string {
  if (daysUntilExpiry < 0) return '#EF4444'; // Expired - Red
  if (daysUntilExpiry <= 7) return '#EF4444'; // Critical - Red
  if (daysUntilExpiry <= 30) return '#F59E0B'; // Warning - Orange
  return '#10B981'; // OK - Green
}
