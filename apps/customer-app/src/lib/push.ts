import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification handler (lazy - only called when needed)
let notificationHandlerConfigured = false;

function configureNotificationHandler() {
  if (notificationHandlerConfigured) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  } catch (error) {
    console.error('Error configuring notification handler:', error);
  }
}

export interface PushTokenResponse {
  token: string;
  success: boolean;
}

/**
 * Request push notification permissions
 */
export async function requestPushNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  // Check if running in Expo Go (push notifications not supported in Expo Go Android SDK 53+)
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo && Platform.OS === 'android') {
    console.log('Push notifications not supported in Expo Go on Android. Use a development build instead.');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return false;
  }

  return true;
}

/**
 * Get the Expo push token
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Get projectId from Constants (as per Expo SDK 57 docs)
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;

  if (!projectId) {
    console.log('Project ID not found - push notifications require EAS Build configuration');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

/**
 * Register push token with backend
 */
export async function registerPushToken(): Promise<PushTokenResponse> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { token: '', success: false };
    }

    // Set up Android notification channel (required for Android 13+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#022EAD',
      });
    }

    // Request permissions
    const hasPermission = await requestPushNotificationPermissions();
    if (!hasPermission) {
      return { token: '', success: false };
    }

    // Get push token
    const expoToken = await getExpoPushToken();
    if (!expoToken) {
      return { token: '', success: false };
    }

    // Determine platform
    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    // Get device info
    const deviceInfo = {
      platform: Platform.OS,
      osVersion: Platform.Version,
      manufacturer: Device.manufacturer,
      model: Device.modelName,
    };

    // Send to backend
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/push/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        token: expoToken,
        platform,
        device_info: deviceInfo,
      }),
    });

    if (response.ok) {
      console.log('Push token registered successfully');
      return { token: expoToken, success: true };
    } else {
      console.error('Failed to register push token:', response.status);
      return { token: '', success: false };
    }
  } catch (error) {
    console.error('Error registering push token:', error);
    return { token: '', success: false };
  }
}

/**
 * Remove push token from backend
 */
export async function removePushToken(token: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/push/tokens`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ token }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error removing push token:', error);
    return false;
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners() {
  // Listen for notifications received while app is in foreground
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Listen for user tapping on a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    // Handle navigation based on notification data
    const data = response.notification.request.content.data;
    if (data?.screen) {
      // Navigate to the screen specified in the notification
      // router.push(data.screen);
    }
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Initialize push notifications
 */
export async function initializePushNotifications(): Promise<void> {
  try {
    // Check if running in Expo Go - skip push notifications
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo && Platform.OS === 'android') {
      console.log('Skipping push notifications initialization in Expo Go (Android)');
      return;
    }

    // Configure notification handler
    configureNotificationHandler();

    // Request permissions and register token
    await registerPushToken();

    // Setup listeners
    setupNotificationListeners();

    // Listen for push token changes (token refresh)
    const tokenSubscription = Notifications.addPushTokenListener(async (token) => {
      console.log('Push token changed:', token);
      // Re-register the new token with backend
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
        const deviceInfo = {
          platform: Platform.OS,
          osVersion: Platform.Version,
          manufacturer: Device.manufacturer,
          model: Device.modelName,
        };

        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;

        await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/push/tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            token: token.data,
            platform,
            device_info: deviceInfo,
          }),
        });
      }
    });

    console.log('Push notifications initialized');
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}
