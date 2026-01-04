/**
 * Haptics Utility
 * Provides subtle haptic feedback for better UX
 * Gracefully degrades on devices that don't support haptics
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Light impact - for button presses, selections
 */
export const lightHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
};

/**
 * Medium impact - for confirmations, toggles
 */
export const mediumHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }
};

/**
 * Heavy impact - for significant actions
 */
export const heavyHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }
};

/**
 * Success notification - for successful submissions
 */
export const successHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
};

/**
 * Warning notification - for warnings
 */
export const warningHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }
};

/**
 * Error notification - for errors
 */
export const errorHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }
};

/**
 * Selection feedback - for list item selection, tab changes
 */
export const selectionHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync().catch(() => {});
  }
};

export default {
  light: lightHaptic,
  medium: mediumHaptic,
  heavy: heavyHaptic,
  success: successHaptic,
  warning: warningHaptic,
  error: errorHaptic,
  selection: selectionHaptic,
};
