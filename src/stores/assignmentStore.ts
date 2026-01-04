/**
 * Assignment Store - Zustand
 * Caches current assignment and assignment history
 * Provides instant loading with background refresh
 */

import { create } from 'zustand';
import { backendAPI } from '../api';
import { Assignment } from '../types';

/**
 * Merge vehicle info into assignment object for easy dashboard access
 */
function mergeAssignmentWithVehicle(assignment: any, vehicle: any): Assignment | null {
  if (!assignment) return null;
  
  return {
    ...assignment,
    // Add vehicle fields that the dashboard expects
    vehicle_license_plate: vehicle?.license_plate || '',
    license_plate: vehicle?.license_plate || '',
    make_model: vehicle?.make_model || '',
    vehicle_image_url: vehicle?.image_url || null,
    daily_rent: vehicle?.daily_rental_rate ? parseFloat(vehicle.daily_rental_rate) : (assignment.daily_rent || 0),
  };
}

interface AssignmentState {
  // Data
  currentAssignment: Assignment | null;
  assignmentHistory: Assignment[];
  vehicle: any | null;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetched: number | null;
  
  // Error state
  error: string | null;
  
  // Actions
  fetchCurrentAssignment: (driverId: string, forceRefresh?: boolean) => Promise<void>;
  fetchAssignmentHistory: (driverId: string) => Promise<void>;
  clearCache: () => void;
}

// Cache duration: 10 minutes (assignments don't change often)
const CACHE_DURATION = 10 * 60 * 1000;

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  currentAssignment: null,
  assignmentHistory: [],
  vehicle: null,
  isLoading: false,
  isRefreshing: false,
  lastFetched: null,
  error: null,

  fetchCurrentAssignment: async (driverId: string, forceRefresh = false) => {
    const { currentAssignment, lastFetched, isLoading } = get();
    
    // If already loading, skip
    if (isLoading) return;
    
    // Check if cache is still valid
    const now = Date.now();
    const isCacheValid = lastFetched && (now - lastFetched) < CACHE_DURATION;
    
    // If we have cached data and not forcing refresh
    if (currentAssignment !== undefined && isCacheValid && !forceRefresh) {
      // Background refresh
      set({ isRefreshing: true });
      try {
        const data = await backendAPI.getDriverAssignment(driverId);
        // Merge vehicle info into assignment for easy access
        const mergedAssignment = mergeAssignmentWithVehicle(data.assignment, data.vehicle);
        set({ 
          currentAssignment: mergedAssignment,
          vehicle: data.vehicle,
          lastFetched: Date.now(),
          isRefreshing: false,
          error: null 
        });
      } catch (error: any) {
        console.warn('Background assignment refresh failed:', error.message);
        set({ isRefreshing: false });
      }
      return;
    }
    
    // No cache or expired - show loading
    set({ isLoading: true, error: null });
    
    try {
      const data = await backendAPI.getDriverAssignment(driverId);
      // Merge vehicle info into assignment for easy access
      const mergedAssignment = mergeAssignmentWithVehicle(data.assignment, data.vehicle);
      set({ 
        currentAssignment: mergedAssignment,
        vehicle: data.vehicle,
        lastFetched: Date.now(),
        isLoading: false,
        isRefreshing: false,
        error: null 
      });
    } catch (error: any) {
      console.error('Failed to fetch assignment:', error);
      set({ 
        isLoading: false, 
        isRefreshing: false,
        error: error.message || 'Failed to load assignment' 
      });
    }
  },

  fetchAssignmentHistory: async (driverId: string) => {
    try {
      const data = await backendAPI.getDriverAssignments(driverId);
      set({ assignmentHistory: data });
    } catch (error: any) {
      console.error('Failed to fetch assignment history:', error);
    }
  },

  clearCache: () => {
    set({ 
      currentAssignment: null, 
      assignmentHistory: [],
      vehicle: null,
      lastFetched: null,
      error: null 
    });
  },
}));
