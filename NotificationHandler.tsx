/**
 * Mobile Push Notification Handler
 * Handles foreground and background notifications on iOS/Android
 * 
 * USAGE: Import and add to mobile/App.tsx
 * import NotificationHandler from './NotificationHandler';
 * <NotificationHandler />
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

// Conditionally import Firebase (won't work in Expo Go)
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (e) {
  console.warn('⚠️ Firebase not available (Expo Go doesn\'t support native modules)');
}

const NotificationHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    if (Platform.OS === 'web' || !messaging) {
      // Web notifications handled in App.tsx via firebaseConfig
      // Or Firebase not available (Expo Go)
      return;
    }

    // ============================================================================
    // FOREGROUND NOTIFICATIONS (when app is open)
    // ============================================================================
    const unsubscribeForeground = messaging!().onMessage(async (remoteMessage) => {
      console.log('📬 Foreground notification received:', remoteMessage);

      // Show toast notification
      Toast.show({
        type: 'info',
        text1: remoteMessage.notification?.title || 'New Notification',
        text2: remoteMessage.notification?.body || '',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 60,
        onPress: () => {
          // Navigate based on notification type
          handleNotificationNavigation(remoteMessage.data);
        },
      });
    });

    // ============================================================================
    // BACKGROUND NOTIFICATIONS (when app is closed or in background)
    // ============================================================================
    messaging!().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📦 Background notification received:', remoteMessage);
      // iOS: Background notifications are handled automatically
      // Android: Can perform background tasks here
    });

    // ============================================================================
    // NOTIFICATION OPENED (user tapped notification)
    // ============================================================================
    
    // Handle notification tap when app is in background
    messaging!().onNotificationOpenedApp((remoteMessage) => {
      console.log('📲 Notification opened app from background:', remoteMessage);
      handleNotificationNavigation(remoteMessage.data);
    });

    // Check if app was opened from a notification (killed state)
    messaging!()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('📲 App opened from notification (killed state):', remoteMessage);
          handleNotificationNavigation(remoteMessage.data);
        }
      });

    // Cleanup
    return () => {
      unsubscribeForeground();
    };
  }, []);

  /**
   * Navigate to appropriate screen based on notification data
   */
  const handleNotificationNavigation = (data: any) => {
    if (!data) return;

    try {
      switch (data.type) {
        case 'assignment':
          navigation.navigate('AssignmentHistory' as never);
          break;
        case 'leave_request':
          navigation.navigate('LeaveRequests' as never);
          break;
        case 'passport_handover':
          navigation.navigate('PassportHandover' as never);
          break;
        case 'job_card':
          navigation.navigate('Maintenance' as never);
          break;
        case 'settlement':
          navigation.navigate('Settlements' as never);
          break;
        default:
          navigation.navigate('Notifications' as never);
      }
    } catch (navError) {
      console.warn('⚠️ Navigation error from notification:', navError);
    }
  };

  return null; // This component doesn't render anything
};

export default NotificationHandler;
