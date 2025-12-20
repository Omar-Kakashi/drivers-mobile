/**
 * Expo Push Notification Handler
 * ✅ Works in Expo Go immediately (no build required)
 * ✅ Cross-platform (iOS, Android, Web)
 * ✅ Free up to 1000 notifications/day
 * 
 * USAGE: Import in App.tsx
 * import ExpoNotificationHandler from './ExpoNotificationHandler';
 * <ExpoNotificationHandler />
 */

import { useEffect, useRef, useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior (how they appear when app is open)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,      // Show notification banner
    shouldPlaySound: true,       // Play sound
    shouldSetBadge: true,        // Update app icon badge count
  }),
});

const ExpoNotificationHandler = () => {
  const navigation = useNavigation();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Register for push notifications and get token
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        console.log('📱 Expo Push Token:', token);
        console.log('✅ Push notifications ready!');
        
        // Send this token to your backend
        sendTokenToBackend(token);
      } else {
        console.log('ℹ️ Push notifications not available in this environment');
        console.log('ℹ️ For full push notification support, build a custom development client:');
        console.log('   npx eas-cli build --profile development --platform android');
      }
    });

    // Listener for notifications received while app is OPEN (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received (foreground):', notification);
        
        // Show toast instead of system notification
        const { title, body } = notification.request.content;
        Toast.show({
          type: 'info',
          text1: title || 'New Notification',
          text2: body || '',
          visibilityTime: 5000,
          autoHide: true,
          topOffset: 60,
          onPress: () => {
            handleNotificationNavigation(notification.request.content.data);
          },
        });
      }
    );

    // Listener for notification TAPS (user clicked notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('📲 Notification tapped:', response);
        handleNotificationNavigation(response.notification.request.content.data);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  /**
   * Navigate to appropriate screen based on notification data
   */
  const handleNotificationNavigation = (data: any) => {
    if (!data) {
      navigation.navigate('Notifications' as never);
      return;
    }

    try {
      switch (data.type) {
        case 'assignment':
          navigation.navigate('AssignmentHistory' as never);
          break;
        case 'leave_request':
        case 'leave_approved':
        case 'leave_rejected':
          navigation.navigate('MyRequests' as never);
          break;
        case 'passport_handover':
        case 'passport_return':
          navigation.navigate('PassportHandover' as never);
          break;
        case 'job_card':
        case 'maintenance':
          navigation.navigate('Dashboard' as never);
          break;
        case 'settlement':
        case 'payment':
          navigation.navigate('Settlements' as never);
          break;
        default:
          navigation.navigate('Notifications' as never);
      }
    } catch (navError) {
      console.warn('⚠️ Navigation error from notification:', navError);
      navigation.navigate('Notifications' as never);
    }
  };

  return null; // This component doesn't render anything
};

/**
 * Register device for push notifications and get Expo Push Token
 */
async function registerForPushNotificationsAsync() {
  let token: string | undefined;

  // Check if running on physical device (push notifications don't work on emulator)
  if (!Device.isDevice) {
    console.warn('⚠️ Push notifications only work on physical devices');
    return undefined;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Ask for permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Permission denied
  if (finalStatus !== 'granted') {
    Alert.alert(
      'Notifications Disabled',
      'Please enable notifications in Settings to receive important updates about assignments, leave requests, and payments.',
      [{ text: 'OK' }]
    );
    return undefined;
  }

  // Get FCM Token (actual Firebase token, not Expo token)
  try {
    // Get native device push token (FCM for Android, APNs for iOS)
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    token = deviceToken.data;
    
    console.log('✅ Successfully generated FCM Push Token');
    console.log('📱 Token type:', deviceToken.type); // 'fcm' for Android, 'apns' for iOS
  } catch (error) {
    console.error('❌ Error getting FCM Token:', error);
    console.warn('⚠️ FCM tokens require google-services.json and custom build');
    console.warn('⚠️ Make sure you ran: eas build --profile development --platform android');
    return undefined;
  }

  // Android-specific: Create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }

  return token;
}

/**
 * Detect available backend (tries local networks first, then production)
 */
async function detectBackendUrl(): Promise<string> {
  const POSSIBLE_BACKENDS = [
    'http://100.99.182.57:5000',     // Tailscale (works anywhere) - PRIORITY
    'http://192.168.0.111:5000',     // Home/Office WiFi
    'http://192.168.1.111:5000',     // Alternative WiFi
    'http://10.0.0.111:5000',        // Work network
    'http://13.205.49.11/api',       // Production backend (AWS Lightsail Static IP)
  ];

  console.log('🔍 Detecting backend network...');

  for (const url of POSSIBLE_BACKENDS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch(`${url}/`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 404) {
        // 404 is OK - means backend is reachable (just no root route)
        console.log(`✅ Backend found at: ${url}`);
        return url;
      }
    } catch (error) {
      // Try next URL
      console.log(`⏭️ ${url} not reachable, trying next...`);
    }
  }

  // Fallback to production
  console.log('⚠️ No local backend found, using production');
  return 'http://13.205.49.11/api';
}

/**
 * Send Expo Push Token to your backend
 */
async function sendTokenToBackend(expoPushToken: string) {
  try {
    const BACKEND_URL = await detectBackendUrl();
    
    // Get user info from AsyncStorage
    const userJson = await AsyncStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    
    console.log('👤 User from storage:', user ? `ID: ${user.id}` : 'Not logged in');
    
    // If user not logged in, skip registration
    if (!user?.id) {
      console.log('⏭️ Skipping push token registration - user not logged in');
      console.log('💡 Token will be registered automatically after login');
      return;
    }
    
    // Prepare headers with user info
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-ID': user.id,
      'X-User-Type': 'driver', // Mobile app = driver
    };

    const response = await fetch(`${BACKEND_URL}/fcm-tokens/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token: expoPushToken,
        device_type: Platform.OS,
        device_name: `${Device.brand} ${Device.modelName}`,
      }),
    });

    if (response.ok) {
      console.log('✅ Push token registered with backend');
    } else {
      const errorText = await response.text();
      console.warn('⚠️ Failed to register push token:', response.status);
      console.warn('📄 Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error sending token to backend:', error);
    // Non-critical error - app continues working
  }
}

export default ExpoNotificationHandler;
