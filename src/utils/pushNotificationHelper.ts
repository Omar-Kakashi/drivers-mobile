/**
 * Push Notification Helper
 * Re-register FCM token after login to link token with user_id
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Detect available backend - production server via nginx
 */
async function detectBackendUrl(): Promise<string> {
  const POSSIBLE_BACKENDS = [
    'https://ostoldev.stsc.ae/api',  // Production server via nginx (Cloudflare HTTPS)
  ];

  for (const url of POSSIBLE_BACKENDS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const healthUrl = `${url}/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 404) {
        return url;
      }
    } catch (error) {
      // Try next URL
    }
  }

  // Default to Tailscale nginx
  return 'http://100.99.182.57/api';
}

/**
 * Re-register FCM token with user_id after login
 * Call this function AFTER successful login
 */
export async function registerPushTokenAfterLogin(userId: string, userType: 'driver' | 'admin') {
  try {
    // Check if device supports push notifications
    if (!Device.isDevice) {
      console.log('⏭️ Skipping push token registration - not a physical device');
      return;
    }

    // Get existing FCM token from device
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const fcmToken = deviceToken.data;

    if (!fcmToken) {
      console.warn('⚠️ No FCM token available to register');
      return;
    }

    // Detect backend URL
    const BACKEND_URL = await detectBackendUrl();
    
    console.log('📱 Re-registering FCM token with user_id:', userId);

    // Register token with backend - attempt with detected URL, then try without '/api' suffix if it exists and first attempt fails
    const attemptRegister = async (url: string) => {
      return await fetch(`${url}/fcm-tokens/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          'X-User-Type': userType,
        },
        body: JSON.stringify({
          token: fcmToken,
          device_type: Platform.OS,
          device_name: `${Device.brand} ${Device.modelName}`,
        }),
      });
    };

    // First attempt - use detected backend URL
    let response = await attemptRegister(BACKEND_URL);
    if (!response.ok && response.status === 404 && BACKEND_URL.endsWith('/api')) {
      // Likely local backend doesn't serve under '/api' path. Try without '/api'
      const stripped = BACKEND_URL.replace(/\/api\/?$/, '');
      console.log('⚠️ Detected /api path returned 404 - retrying without /api using:', stripped);
      response = await attemptRegister(stripped);
    }
    

    if (response.ok) {
      console.log('✅ Push token successfully registered with user_id');
    } else {
      const errorText = await response.text();
      console.warn('⚠️ Failed to register push token:', response.status);
      console.warn('📄 Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error re-registering push token:', error);
    // Non-critical error - don't block login
  }
}
