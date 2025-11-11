/**
 * Ostol Mobile - TypeScript Type Definitions
 */

// User Types
export interface Driver {
  id: string;
  driver_id: string;
  name: string;
  phone: string;
  phone_number?: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  current_vehicle_id: string | null;
  balance: number;
  daily_rent: number | null;
  password?: string;
  is_first_login: boolean;
  profile_picture_url?: string;
  created_at?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  is_first_login: boolean;
}

export type UserType = 'driver' | 'admin';

// Assignment Types
export interface Assignment {
  id: string;
  vehicle_id: string;
  vehicle_license_plate?: string;
  primary_driver_id: string;
  secondary_driver_id: string | null;
  assignment_date: string;
  return_date: string | null;
  status: 'active' | 'pending_settlement' | 'completed' | 'on_hold' | 'disputed' | 'cancelled';
  daily_rent: number;
  days_count: number | null;
  total_rent: number | null;
  is_shared: boolean;
}

// Financial Types
export interface Balance {
  current_balance: number;
  total_rent_due: number;
  total_payments: number;
  total_credits: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'rent' | 'payment' | 'credit' | 'penalty' | 'refund';
  amount: number;
  description: string;
  balance_after: number;
}

export interface Settlement {
  id?: string;
  driver_id: string;
  driver_name?: string;
  settlement_month: number;
  settlement_year: number;
  settlement_date: string;
  total_uber: number;
  total_rent: number;
  total_salik: number;
  total_fines: number;
  total_other_deductions: number;
  workshop_credit: number;
  other_credits: number;
  net_balance: number;
  total_paid: number;
  balance_after_payment: number;
  status: string;
  settlement_type: string;
  created_at?: string;
  updated_at?: string;
}

// HR Types
export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type_id: string;
  leave_type_name?: string;
  start_date: string;
  end_date: string;
  days_count?: number; // Add this field
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  employee_signature_url?: string;
  signature_employee?: string; // Add MinIO signature field
  manager_signature_url?: string;
  hr_signature_url?: string;
  created_at: string;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'leave_request' | 'payment' | 'system';
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  created_at: string;
}

// Auth Types
export interface AuthResponse {
  token: string;
  user: Driver | AdminUser;
  user_type: UserType;
}

export interface ApiError {
  message: string;
  status?: number;
}
