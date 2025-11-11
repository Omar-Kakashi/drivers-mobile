/**
 * Toast Helper Functions
 * 
 * Centralized toast notifications for consistent UX across the app.
 * Import these helpers instead of calling Toast.show() directly.
 */

import Toast from 'react-native-toast-message';

interface ToastOptions {
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  message?: string;
  /** How long to show (milliseconds), default 3000 */
  duration?: number;
  /** Position: 'top' or 'bottom', default 'top' */
  position?: 'top' | 'bottom';
}

// ============================================
// SUCCESS TOASTS (Green ✅)
// ============================================

export const showSuccess = ({ title, message, duration = 3000, position = 'top' }: ToastOptions) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position,
    visibilityTime: duration,
  });
};

// Common success messages
export const toastSaveSuccess = (itemName: string) => {
  showSuccess({
    title: 'Saved Successfully',
    message: `${itemName} has been saved`,
  });
};

export const toastDeleteSuccess = (itemName: string) => {
  showSuccess({
    title: 'Deleted Successfully',
    message: `${itemName} has been removed`,
  });
};

export const toastAddSuccess = (itemName: string) => {
  showSuccess({
    title: 'Added Successfully',
    message: `${itemName} has been added`,
  });
};

export const toastUpdateSuccess = (itemName: string) => {
  showSuccess({
    title: 'Updated Successfully',
    message: `${itemName} has been updated`,
  });
};

export const toastApproveSuccess = (itemName: string) => {
  showSuccess({
    title: 'Approved',
    message: `${itemName} has been approved`,
  });
};

export const toastRejectSuccess = (itemName: string) => {
  showSuccess({
    title: 'Rejected',
    message: `${itemName} has been rejected`,
  });
};

// ============================================
// ERROR TOASTS (Red ❌)
// ============================================

export const showError = ({ title, message, duration = 4000, position = 'top' }: ToastOptions) => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position,
    visibilityTime: duration,
  });
};

// Smart error detection
export const toastError = (error: any, context?: string) => {
  const errorMessage = error?.message || String(error);
  
  let friendlyMessage = 'Something went wrong. Please try again.';
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    friendlyMessage = 'Connection lost. Check your internet and try again.';
  }
  // Validation errors
  else if (errorMessage.includes('required') || errorMessage.includes('invalid')) {
    friendlyMessage = 'Please check your input and try again.';
  }
  // Permission errors
  else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    friendlyMessage = 'You do not have permission for this action.';
  }
  // Duplicate errors
  else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
    friendlyMessage = 'This record already exists.';
  }
  // Assigned/in-use errors
  else if (errorMessage.includes('assigned') || errorMessage.includes('in use')) {
    friendlyMessage = 'Cannot delete - item is currently in use.';
  }
  
  showError({
    title: context || 'Error',
    message: friendlyMessage,
  });
};

export const toastSaveError = () => {
  showError({
    title: 'Save Failed',
    message: 'Could not save. Please try again.',
  });
};

export const toastDeleteError = (reason?: string) => {
  showError({
    title: 'Delete Failed',
    message: reason || 'Could not delete. Please try again.',
  });
};

export const toastLoadError = () => {
  showError({
    title: 'Load Failed',
    message: 'Could not load data. Check your connection.',
  });
};

export const toastNetworkError = () => {
  showError({
    title: 'Connection Problem',
    message: 'No internet connection. Check your WiFi or cellular data.',
    duration: 5000,
  });
};

export const toastPermissionError = (action?: string) => {
  showError({
    title: 'Permission Denied',
    message: action ? `You cannot ${action}` : 'You do not have permission for this action.',
  });
};

export const toastValidationError = (field?: string) => {
  showError({
    title: 'Invalid Input',
    message: field ? `Please check the ${field} field` : 'Please check your input and try again.',
  });
};

// ============================================
// INFO TOASTS (Blue ℹ️)
// ============================================

export const showInfo = ({ title, message, duration = 3000, position = 'top' }: ToastOptions) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position,
    visibilityTime: duration,
  });
};

export const toastInfo = (title: string, message?: string) => {
  showInfo({ title, message });
};

export const toastLoading = (action: string) => {
  showInfo({
    title: 'Please Wait',
    message: `${action}...`,
    duration: 2000,
  });
};

export const toastNoData = (itemType?: string) => {
  showInfo({
    title: 'No Data Found',
    message: itemType ? `No ${itemType} found` : 'No results match your search.',
  });
};

// ============================================
// WARNING TOASTS (Yellow ⚠️)
// ============================================

export const showWarning = ({ title, message, duration = 4000, position = 'top' }: ToastOptions) => {
  Toast.show({
    type: 'error', // Using error type for warnings (react-native-toast-message doesn't have 'warning')
    text1: `⚠️ ${title}`,
    text2: message,
    position,
    visibilityTime: duration,
  });
};

export const toastWarning = (title: string, message?: string) => {
  showWarning({ title, message });
};

export const toastOfflineWarning = () => {
  showWarning({
    title: 'You are offline',
    message: 'Changes will sync when connection is restored.',
  });
};

// ============================================
// EXAMPLE USAGE IN SCREENS:
// ============================================

/*
import { 
  toastSaveSuccess, 
  toastError, 
  toastDeleteSuccess,
  toastPermissionError
} from '../../utils/toastHelpers';

// In a save function:
try {
  await saveData();
  toastSaveSuccess('Vehicle ABC-123');
  navigation.goBack();
} catch (error) {
  toastError(error, 'Save Failed');
}

// In a delete function:
try {
  await deleteItem();
  toastDeleteSuccess('Driver Ahmed Ali');
} catch (error) {
  if (error.message.includes('assigned')) {
    toastDeleteError('Cannot delete - item is currently assigned');
  } else {
    toastError(error);
  }
}

// Permission check:
if (!hasPermission) {
  toastPermissionError('delete vehicles');
  return;
}
*/
