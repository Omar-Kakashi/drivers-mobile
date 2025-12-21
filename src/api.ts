/**
 * Backend API Client - Mobile App
 * Connects to FastAPI backend with auto-detection support
 * Development: Auto-detects network IP, Production: ostoldev.stsc.ae/api
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

// Production backend URL - HTTPS via nginx
const PROD_BASE_URL = 'https://ostoldev.stsc.ae/api';

// Environment switcher - __DEV__ is a global set by React Native
// DO NOT shadow the global __DEV__ - use it directly or create a different name
const IS_DEV_MODE = typeof global.__DEV__ !== 'undefined' ? global.__DEV__ : false;

// API Version - increment this to force cache clear on breaking changes
const API_VERSION = '13'; // AWS Lightsail Static IP

// Auto-detect working backend URL (cached in AsyncStorage)
let detectedUrl: string | null = null;

/**
 * Generate possible backend URLs based on common network patterns
 * Automatically scans for backend on any network (home, work, hotspot, etc.)
 */
function generatePossibleUrls(): string[] {
  const urls: string[] = [];
  
  // All requests go through production nginx server
  // Cloudflare handles HTTPS, nginx routes to backend
  
  // 1. Production - HTTPS via nginx (only option)
  urls.push('https://ostoldev.stsc.ae/api');
  
  return urls;
}

/**
 * Test multiple URLs in parallel batches for faster detection
 */
async function testUrlBatch(urls: string[], batchSize: number = 10): Promise<string | null> {
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(url => 
        axios.get(`${url}/health`, { timeout: 3000 })
          .then(res => res.status === 200 ? url : null)
          .catch(() => null)
      )
    );
    
    // Return first successful URL
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }
  }
  
  return null;
}

async function detectBackendUrl(): Promise<string> {
  // Return cached URL if already detected
  if (detectedUrl) {
    return detectedUrl;
  }

  // Check API version - clear cache if version changed
  const cachedVersion = await AsyncStorage.getItem('api_version');
  if (cachedVersion !== API_VERSION) {
    console.log('🔄 API version changed - clearing backend cache');
    await AsyncStorage.removeItem('backend_url');
    await AsyncStorage.setItem('api_version', API_VERSION);
  }

  // Try to get from AsyncStorage
  const cachedUrl = await AsyncStorage.getItem('backend_url');
  if (cachedUrl) {
    // Verify cached URL still works
    try {
      const response = await axios.get(`${cachedUrl}/health`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('📦 Using cached backend URL:', cachedUrl);
        detectedUrl = cachedUrl;
        return cachedUrl;
      }
    } catch (error) {
      console.log('⚠️ Cached URL no longer works, re-scanning...');
      await AsyncStorage.removeItem('backend_url');
    }
  }

  console.log('🔍 Auto-detecting backend URL (smart network scan)...');
  
  // Generate and test URLs
  const possibleUrls = generatePossibleUrls();
  const foundUrl = await testUrlBatch(possibleUrls, 15); // Test 15 URLs at a time
  
  if (foundUrl) {
    console.log(`✅ Backend detected at: ${foundUrl}`);
    detectedUrl = foundUrl;
    await AsyncStorage.setItem('backend_url', foundUrl);
    return foundUrl;
  }

  // No backend found - inform user
  console.error('❌ No backend found! Make sure Docker backend is running.');
  throw new Error('Backend not reachable. Please start the backend server (docker-compose up).');
}

// Reset backend detection (call when network changes or to force rescan)
export const resetBackendDetection = async () => {
  detectedUrl = null;
  await AsyncStorage.removeItem('backend_url');
  console.log('🔄 Backend detection reset - will rescan on next API call');
};

// Get current backend URL (useful for debugging)
export const getCurrentBackendUrl = () => detectedUrl || 'Not detected yet';

// Force use of specific backend URL (useful for manual testing)
export const forceBackendUrl = async (url: string) => {
  detectedUrl = url;
  await AsyncStorage.setItem('backend_url', url);
  console.log('🔧 Forced backend URL:', url);
};

class BackendAPI {
  private client: AxiosInstance;
  private baseUrlInitialized = false;

  constructor() {
    // Production builds use HTTPS domain directly, dev builds use auto-detection
    const initialUrl = IS_DEV_MODE ? 'http://100.99.182.57:5000' : 'https://ostoldev.stsc.ae/api';
    
    this.client = axios.create({
      baseURL: initialUrl,
      timeout: 15000, // Increased timeout for slower networks
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Only run auto-detection in development mode
    if (IS_DEV_MODE) {
      this.initializeBackendUrl();
    } else {
      // Production: Mark as initialized with static URL
      this.baseUrlInitialized = true;
      detectedUrl = initialUrl;
    }

    // Request interceptor - Add JWT token & ensure correct baseURL & trailing slashes
    this.client.interceptors.request.use(
      async (config) => {
        // ALWAYS ensure baseURL is set before making any request
        if (!this.baseUrlInitialized) {
          await this.initializeBackendUrl();
        }
        
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // GLOBAL FIX: Ensure trailing slash on GET requests for nginx compatibility
        // This fixes the issue where nginx routes /api/endpoint to web app instead of backend
        // IMPORTANT: Only add trailing slash for GET requests - POST/PUT/DELETE break with trailing slash
        // Only add trailing slash if:
        // 1. Method is GET
        // 2. URL doesn't already end with /
        // 3. URL doesn't have a file extension (like .json)
        // 4. URL path exists
        const method = (config.method || 'get').toLowerCase();
        if (method === 'get' && config.url && !config.url.endsWith('/') && !config.url.includes('.')) {
          // Don't add trailing slash to URLs with path parameters at the end (like /users/123)
          // These work fine without trailing slash
          const lastSegment = config.url.split('/').pop() || '';
          const looksLikeId = lastSegment.match(/^[0-9a-f-]{8,}$/i); // UUID or numeric ID
          
          if (!looksLikeId) {
            config.url = config.url + '/';
          }
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
        } else if (error.message === 'Network Error') {
          // Network error - cached URL might be wrong, reset for next attempt
          console.log('⚠️  Network error detected - will re-detect backend on next request');
          this.baseUrlInitialized = false;
          await resetBackendDetection();
        }
        return Promise.reject(error);
      }
    );
  }

  // Initialize backend URL with auto-detection (ONLY IN DEV MODE)
  private async initializeBackendUrl() {
    if (this.baseUrlInitialized) return;
    
    // PRODUCTION: Never run auto-detection - use static URL
    if (!IS_DEV_MODE) {
      this.client.defaults.baseURL = PROD_BASE_URL;
      this.baseUrlInitialized = true;
      detectedUrl = PROD_BASE_URL;
      console.log('✅ Production mode: Using static URL:', PROD_BASE_URL);
      return;
    }
    
    // DEV MODE: Run auto-detection
    const url = await detectBackendUrl();
    this.client.defaults.baseURL = url;
    this.baseUrlInitialized = true;
    console.log('✅ Mobile API initialized with backend:', url);
    console.log('🔍 Axios baseURL is now:', this.client.defaults.baseURL);
  }

  // Get current backend URL
  async getBackendUrl(): Promise<string> {
    if (IS_DEV_MODE) {
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
    // Only run auto-detection in dev mode - production uses static URL set in constructor
    if (IS_DEV_MODE && !this.baseUrlInitialized) {
      await this.initializeBackendUrl();
    }
    
    console.log('🔐 Driver Login Request:', { 
      identifier: String(identifier), 
      baseURL: this.client.defaults.baseURL,
      url: '/auth/driver-login',
      IS_DEV_MODE,
      detectedUrl
    });
    try {
      // Ensure identifier is always sent as a string - Pydantic expects a string
      const payload = { identifier: String(identifier), password };
      const { data } = await this.client.post('/auth/driver-login', payload);
      console.log('✅ Driver Login Success');
      return data;
    } catch (error: any) {
      console.error('❌ Driver Login Failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url
      });
      throw error;
    }
  }

  /**
   * Admin Login - Already has strong bcrypt-hashed password
   * is_first_login should always be false (no password change needed)
   */
  async adminLogin(email: string, password: string): Promise<AuthResponse> {
    // Only run initialization in dev mode (production already set in constructor)
    if (IS_DEV_MODE && !this.baseUrlInitialized) {
      await this.initializeBackendUrl();
    }
    
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
    // Ensure backend URL is initialized before API call
    if (IS_DEV_MODE) {
      await this.initializeBackendUrl();
    }
    console.log('🔗 Full Request URL:', this.client.defaults.baseURL + `/drivers/${driverId}/dashboard`);
    console.log('🔗 Axios baseURL at request time:', this.client.defaults.baseURL);
    
    try {
      const { data } = await this.client.get(`/drivers/${driverId}/dashboard`);
      return data;
    } catch (error: any) {
      console.error('❌ Dashboard API Error:', error.message);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
      } else if (error.request) {
        console.error('❌ No response received - network issue');
        console.error('❌ Request config:', JSON.stringify({
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          timeout: error.config?.timeout
        }));
      }
      throw error;
    }
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

  async getDriverBalance(driverId: string): Promise<any> {
    // Backend routes driver balance under /driver-balance prefix
    const { data } = await this.client.get(`/driver-balance/${driverId}/balance/detailed`);
    
    // Return both raw backend fields AND mapped fields for compatibility
    // Dashboard uses: total_rent_due, total_payments, total_credits
    // MyBalanceScreen uses: total_uber_income, total_rent_charged, total_traffic_fines, etc.
    return {
      // Raw backend fields (for MyBalanceScreen)
      ...data,
      
      // Mapped fields (for Dashboard)
      current_balance: data.current_balance || 0,
      total_rent_due: data.total_rent_charged || 0,
      total_payments: data.total_payments_received || 0,
      total_credits: data.total_uber_income || 0,
      total_salik: data.total_salik || 0,
      total_fines: (data.total_traffic_fines || 0) + (data.total_internal_fines || 0),
    };
  }

  async getDriverTransactions(
    driverId: string,
    month?: number,
    year?: number,
    transactionType?: string
  ): Promise<any> {
    // ✅ FIXED: Use correct endpoint with filters (matches web app)
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    if (transactionType) params.transaction_type = transactionType;
    
    const { data } = await this.client.get(`/driver-balance/${driverId}/transactions`, { params });
    return data; // Returns { transactions, total_count, opening_balance, total_income, total_expenses, net_change, current_balance }
  }

  async getDriverAssignments(driverId: string): Promise<any[]> {
    // Backend uses primary_driver_id, not driver_id
    const { data } = await this.client.get(`/assignments/`, { params: { primary_driver_id: driverId } });
    return data;
  }

  // ==================== RENT DISCOUNTS (Share Adjustments) ====================

  async getDriverRentDiscounts(driverId: string): Promise<any[]> {
    const { data } = await this.client.get('/rent-discounts/', { 
      params: { driver_id: driverId } 
    });
    return data;
  }

  async requestRentDiscount(request: {
    driver_id: string;
    vehicle_id: string;
    discount_type: string;
    discount_date: string;
    discount_days: number;
    daily_rate: number;
    reason: string;
    notes?: string;
    job_card_picture_url?: string;
    requested_by?: string;
  }): Promise<any> {
    const { data } = await this.client.post('/rent-discounts/request', request);
    return data;
  }

  async uploadDriverDocument(
    driverId: string,
    documentType: string,
    fileUri: string
  ): Promise<string> {
    const formData = new FormData();
    
    // Get file extension and mime type
    const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileExtension === 'pdf' ? 'application/pdf' : `image/${fileExtension}`;
    
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: `document.${fileExtension}`,
    } as any);
    formData.append('driver_id', driverId);
    formData.append('document_type', documentType);

    const { data } = await this.client.post('/documents/upload/driver-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return data.file_url;
  }

  // ==================== TRAFFIC FINES (Actual RTA/Police fines) ====================

  async getDriverTrafficFines(driverId: string): Promise<any> {
    // Traffic fines from CSV imports (RTA/Police violations)
    const { data } = await this.client.get(`/driver-balance/${driverId}/traffic-fines`);
    return data; // Returns { driver_id, total_count, total_amount, fines: [] }
  }

  // ==================== INTERNAL FINES (Company-imposed fines) ====================

  async getDriverInternalFines(driverId: string): Promise<any[]> {
    const { data } = await this.client.get('/internal-fines/', { 
      params: { driver_id: driverId } 
    });
    return data.fines || [];
  }

  // ==================== HR REQUESTS ====================

  async getHRRequests(userId: string, requestType?: string): Promise<any[]> {
    const { data } = await this.client.get('/hr-requests/', { 
      params: { user_id: userId, request_type: requestType } 
    });
    return data;
  }

  async createHRRequest(request: {
    request_type: string;
    user_id: string;
    user_type: string;
    data: Record<string, any>;
  }): Promise<any> {
    const { data } = await this.client.post('/hr-requests/', request);
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
    // Only run initialization in dev mode
    if (IS_DEV_MODE && !this.baseUrlInitialized) {
      await this.initializeBackendUrl();
    }
    
    const { data } = await this.client.get('/notifications/', { 
      params: { 
        user_id: userId, 
        user_role: userType  // Backend expects user_role not user_type
      } 
    });
    return data;
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    // Only run initialization in dev mode
    if (IS_DEV_MODE && !this.baseUrlInitialized) {
      await this.initializeBackendUrl();
    }
    
    await this.client.put(`/notifications/${notificationId}/read`, null, {
      params: { user_id: userId }
    });
  }

  // ==================== LEAVE REQUESTS ====================

  async getLeaveRequests(userId: string, userType: 'driver' | 'admin'): Promise<LeaveRequest[]> {
    const { data } = await this.client.get('/leave-requests/', { params: { user_id: userId, user_type: userType } });
    return data;
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    const { data } = await this.client.get('/leave-requests/pending-approval/');
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
