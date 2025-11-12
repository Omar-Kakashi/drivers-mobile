/**
 * Backend API Client - Mobile App
 * Connects to FastAPI backend with auto-detection support
 * Development: Auto-detects network IP, Production: ostol.stsc.ae/api
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import {
  Driver,
  AdminUser,
  Assignment,
  Balance,
  Transaction,
  Settlement,
  LeaveRequest,
  Notification,
  AuthResponse,
} from './types';

// Backend URL candidates (will auto-detect which works)
const POSSIBLE_DEV_URLS = [
  'http://10.0.0.74:5000',       // Work network (current - auto-updated)
  'http://10.0.0.27:5000',       // Work network (alternative)
  'http://192.168.0.111:5000',  // Home network
  'http://localhost:5000',       // Localhost fallback
];

const PROD_BASE_URL = 'https://ostol.stsc.ae/api';

// Environment switcher - __DEV__ is a global set by React Native
const __DEV__ = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

// Auto-detect working backend URL (cached in AsyncStorage)
let detectedUrl: string | null = null;

async function detectBackendUrl(): Promise<string> {
  // Return cached URL if already detected
  if (detectedUrl) {
    return detectedUrl;
  }

  // Try to get from AsyncStorage
  const cachedUrl = await AsyncStorage.getItem('backend_url');
  if (cachedUrl) {
    console.log('📦 Using cached backend URL:', cachedUrl);
    detectedUrl = cachedUrl;
    return cachedUrl;
  }

  console.log('🔍 Auto-detecting backend URL...');
  
  // Test each URL
  for (const url of POSSIBLE_DEV_URLS) {
    try {
      const response = await axios.get(`${url}/health/`, { timeout: 2000 });
      if (response.status === 200) {
        console.log(`✅ Backend detected at: ${url}`);
        detectedUrl = url;
        await AsyncStorage.setItem('backend_url', url);
        return url;
      }
    } catch (error) {
      console.log(`⏭️  ${url} not reachable, trying next...`);
    }
  }

  // Fallback to first URL if none respond
  console.warn('⚠️  No backend responded, using:', POSSIBLE_DEV_URLS[0]);
  detectedUrl = POSSIBLE_DEV_URLS[0];
  return detectedUrl;
}

// Reset backend detection (call when network changes)
export const resetBackendDetection = async () => {
  detectedUrl = null;
  await AsyncStorage.removeItem('backend_url');
  console.log('🔄 Backend detection reset');
};

class BackendAPI {
  private client: AxiosInstance;
  private baseUrlInitialized = false;

  constructor() {
    // Initialize with placeholder - will be set dynamically
    this.client = axios.create({
      baseURL: __DEV__ ? POSSIBLE_DEV_URLS[0] : PROD_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize backend URL detection in development
    if (__DEV__) {
      this.initializeBackendUrl();
    }

    // Request interceptor - Add JWT token & ensure correct baseURL
    this.client.interceptors.request.use(
      async (config) => {
        // Ensure baseURL is set (for first request)
        if (__DEV__ && !this.baseUrlInitialized) {
          await this.initializeBackendUrl();
        }
        
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle 401 (auto logout) and network errors (re-detect backend)
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear storage
          await AsyncStorage.multiRemove(['authToken', 'user', 'userType']);
        } else if (error.message === 'Network Error' && __DEV__) {
          // Network error in development - cached URL might be wrong
          console.log('⚠️  Network error detected - clearing cached backend URL');
          await resetBackendDetection();
          // Don't retry automatically here to avoid infinite loops
          // Next API call will re-detect
        }
        return Promise.reject(error);
      }
    );
  }

  // Initialize backend URL with auto-detection
  private async initializeBackendUrl() {
    if (this.baseUrlInitialized) return;
    
    const url = await detectBackendUrl();
    this.client.defaults.baseURL = url;
    this.baseUrlInitialized = true;
    console.log('✅ Mobile API initialized with backend:', url);
  }

  // Get current backend URL
  async getBackendUrl(): Promise<string> {
    if (__DEV__) {
      return await detectBackendUrl();
    }
    return PROD_BASE_URL;
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Driver Login - Simple password (default "123456789", hashed after first change)
   * Returns is_first_login: true if password never changed
   */
  async driverLogin(identifier: string, password: string): Promise<AuthResponse> {
    // Ensure backend URL is initialized before login
    await this.initializeBackendUrl();
    
    const { data } = await this.client.post('/auth/driver-login', { identifier, password });
    return data;
  }

  /**
   * Admin Login - Already has strong bcrypt-hashed password
   * is_first_login should always be false (no password change needed)
   */
  async adminLogin(email: string, password: string): Promise<AuthResponse> {
    // Ensure backend URL is initialized before login
    await this.initializeBackendUrl();
    
    console.log('🔐 Admin Login Request:', { 
      email, 
      baseURL: this.client.defaults.baseURL,
      url: '/auth/admin-login'
    });
    try {
      const { data } = await this.client.post('/auth/admin-login', { email, password });
      console.log('✅ Admin Login Success');
      return data;
    } catch (error: any) {
      console.error('❌ Admin Login Failed:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    }
  }

  /**
   * Change Password - Only for drivers (admins change password on web)
   * Hashes new password and sets is_first_login = false
   */
  async changePassword(userId: string, userType: 'driver' | 'admin', newPassword: string): Promise<void> {
    await this.client.put('/auth/mobile-change-password', { user_id: userId, user_type: userType, new_password: newPassword });
  }

  // ==================== DRIVER ENDPOINTS ====================

  async getDriverDashboard(driverId: string): Promise<{
    driver: Driver;
    current_assignment: Assignment | null;
    balance: Balance;
    notifications_count: number;
  }> {
    const { data } = await this.client.get(`/drivers/${driverId}/dashboard`);
    return data;
  }

  async getDriverAssignment(driverId: string): Promise<{
    assignment: Assignment | null;
    vehicle: any | null;
  }> {
    const { data } = await this.client.get(`/drivers/${driverId}/assignment`);
    return data;
  }

  async getDriverAssignmentHistory(driverId: string): Promise<Assignment[]> {
    const { data } = await this.client.get(`/assignments/`, { params: { driver_id: driverId } });
    return data;
  }

  async getDriverBalance(driverId: string): Promise<Balance> {
    const { data } = await this.client.get(`/drivers/${driverId}/balance`);
    return data;
  }

  async getDriverTransactions(driverId: string): Promise<Transaction[]> {
    const { data } = await this.client.get(`/driver-balance/${driverId}/transactions`);
    return data;
  }

  // ==================== SETTLEMENTS ====================

  async getSettlements(params: {
    driver_id?: string;
    month?: number;
    year?: number;
    status?: string;
  }): Promise<Settlement[]> {
    const { data } = await this.client.get('/settlements/', { params });
    return data;
  }

  async getSettlementById(id: string): Promise<Settlement> {
    const { data } = await this.client.get(`/settlements/${id}`);
    return data;
  }

  // ==================== ADMIN ENDPOINTS ====================

  async getAdminDashboard(adminId: string): Promise<{
    user: AdminUser;
    notifications_count: number;
    pending_approvals_count: number;
  }> {
    const { data } = await this.client.get(`/admin-users/${adminId}/dashboard`);
    return data;
  }

  async getNotifications(userId: string, userType: 'driver' | 'admin'): Promise<Notification[]> {
    // Ensure backend URL is initialized
    await this.initializeBackendUrl();
    
    const { data } = await this.client.get('/notifications/', { 
      params: { 
        user_id: userId, 
        user_role: userType  // Backend expects user_role not user_type
      } 
    });
    return data;
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    // Ensure backend URL is initialized
    await this.initializeBackendUrl();
    
    await this.client.put(`/notifications/${notificationId}/read`, null, {
      params: { user_id: userId }
    });
  }

  // ==================== LEAVE REQUESTS ====================

  async getLeaveRequests(userId: string, userType: 'driver' | 'admin'): Promise<LeaveRequest[]> {
    const { data } = await this.client.get('/leave-requests', { params: { user_id: userId, user_type: userType } });
    return data;
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    const { data } = await this.client.get('/leave-requests/pending-approval');
    return data;
  }

  async approveLeaveRequest(requestId: string, signatureData: string): Promise<void> {
    const formData = new FormData();
    formData.append('signature', {
      uri: signatureData,
      type: 'image/png',
      name: 'signature.png',
    } as any);

    await this.client.put(`/leave-requests/${requestId}/approve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async rejectLeaveRequest(requestId: string, reason: string): Promise<void> {
    await this.client.put(`/leave-requests/${requestId}/reject`, { reason });
  }

  async submitLeaveRequest(
    userId: string,
    userType: 'driver' | 'admin',
    leaveTypeId: string,
    startDate: string,
    endDate: string,
    reason: string,
    signatureData: string
  ): Promise<void> {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('user_type', userType);
    formData.append('leave_type_id', leaveTypeId);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    formData.append('reason', reason);
    formData.append('signature', {
      uri: signatureData,
      type: 'image/png',
      name: 'signature.png',
    } as any);

    await this.client.post('/leave-requests/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  // ==================== DOCUMENT UPLOAD ====================

  async uploadDocument(
    file: { uri: string; type: string; name: string }, 
    category: string,
    driverId: string
  ): Promise<{ file_url: string }> {
    const formData = new FormData();
    formData.append('file', file as any);
    formData.append('document_type', category);
    formData.append('driver_id', driverId);

    const { data } = await this.client.post('/documents/upload/driver-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  // ==================== LEAVE RETURN FORMS ====================

  async submitLeaveReturn(
    userId: string,                    // Changed from employeeId to userId (polymorphic)
    userType: 'driver' | 'employee',   // NEW: Specify user type
    leaveRequestId: string,
    actualReturnDate: string,
    signatureData: string
  ): Promise<void> {
    const formData = new FormData();
    formData.append('employee_id', userId);  // Backend still expects 'employee_id' parameter name
    formData.append('leave_request_id', leaveRequestId);
    formData.append('actual_return_date', actualReturnDate);
    formData.append('signature', {
      uri: signatureData,
      type: 'image/png',
      name: 'signature.png',
    } as any);

    await this.client.post('/leave-return-forms/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async getLeaveReturnForms(userId?: string): Promise<any[]> {  // Changed from employeeId to userId
    const { data } = await this.client.get('/leave-return-forms/', {
      params: { user_id: userId }  // Changed to user_id parameter
    });
    return data;
  }

  // ==================== PASSPORT HANDOVER ====================

  async submitPassportHandover(
    userId: string,                    // Changed from employeeId to userId (polymorphic)
    userType: 'driver' | 'employee',   // NEW: Specify user type
    handoverDate: string,
    expectedReturnDate: string,
    reason: string,                    // vacation, visa_renewal, medical, emergency, other
    notes: string,
    signatureData: string
  ): Promise<void> {
    const formData = new FormData();
    formData.append('employee_id', userId);
    formData.append('user_type', userType);
    formData.append('handover_type', 'to_employee');  // Always to_employee for driver requests
    formData.append('handover_date', handoverDate);
    formData.append('expected_return_date', expectedReturnDate);
    formData.append('reason', reason);
    formData.append('notes', notes || '');
    
    // Pass signature URI directly (same as leave request)
    formData.append('employee_signature', {
      uri: signatureData,
      type: 'image/png',
      name: 'signature.png',
    } as any);

    await this.client.post('/passport-handover/', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getPassportHandovers(userId?: string): Promise<any[]> {  // Changed from employeeId to userId
    const { data } = await this.client.get('/passport-handover/', {
      params: { user_id: userId }  // Changed to user_id parameter
    });
    return data;
  }
}

export const backendAPI = new BackendAPI();
