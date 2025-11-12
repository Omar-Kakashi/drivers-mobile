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

  // Get Expo Push Token
  try {
    // For Expo Go, we can get token without projectId
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (projectId) {
      // Custom build with EAS projectId
      token = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;
    } else {
      // Expo Go - no projectId needed
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }
    
    console.log('✅ Successfully generated Expo Push Token');
  } catch (error) {
    console.error('❌ Error getting Expo Push Token:', error);
    
    // Last resort: try with manifest ID
    try {
      const manifestId = (Constants.manifest as any)?.id || (Constants.manifest2 as any)?.extra?.eas?.projectId;
      if (manifestId) {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: manifestId,
          })
        ).data;
      }
    } catch (fallbackError) {
      console.warn('⚠️ Could not generate push token. This is normal in Expo Go without a project ID.');
      console.warn('Push notifications will work once you build a custom development client.');
      return undefined;
    }
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
 * Send Expo Push Token to your backend
 * TODO: Replace with your actual backend endpoint
 */
async function sendTokenToBackend(expoPushToken: string) {
  try {
    const BACKEND_URL = 'https://ostol.stsc.ae/api'; // Your production backend
    // const BACKEND_URL = 'http://localhost:5000'; // Development backend

    const response = await fetch(`${BACKEND_URL}/fcm-tokens/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: expoPushToken,
        device_type: Platform.OS,
        device_name: `${Device.brand} ${Device.modelName}`,
      }),
    });

    if (response.ok) {
      console.log('✅ Push token registered with backend');
    } else {
      console.warn('⚠️ Failed to register push token:', response.status);
    }
  } catch (error) {
    console.error('❌ Error sending token to backend:', error);
    // Non-critical error - app continues working
  }
}

export default ExpoNotificationHandler;
