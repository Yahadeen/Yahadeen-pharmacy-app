import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Check if running in Expo Go (push notifications not supported in Expo Go on Android)
const isExpoGo = Constants.appOwnership === 'expo';

// Configure notification handler (lazy - only called when needed)
let notificationHandlerConfigured = false;

function configureNotificationHandler() {
  if (notificationHandlerConfigured) return;
  if (isExpoGo) return; // Skip in Expo Go

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
    console.warn('Failed to set notification handler:', error);
  }
}

export async function registerForPushNotifications() {
  // Skip registration if running in Expo Go
  if (isExpoGo) {
    console.log('Push notifications not available in Expo Go. Use a development build.');
    return null;
  }

  // Configure notification handler
  configureNotificationHandler();

  let token: string | null = null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0036B6',
      });
    }

    const existingStatus = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (String(existingStatus) !== 'granted') {
      const requestedStatus = await Notifications.requestPermissionsAsync();
      finalStatus = requestedStatus;
    }

    if (String(finalStatus) !== 'granted') {
      console.error('Failed to get push token for push notification!');
      return null;
    }

    // Get projectId from Constants
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;

    if (!projectId) {
      console.log('Project ID not found - skipping push token registration');
      return null;
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }

  return token;
}

export async function savePushToken(token: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const platform = Platform.OS as 'ios' | 'android';
    
    // Call the API to register the push token
    await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/me/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({ token, platform }),
    });
  } catch (error) {
    console.error('Failed to save push token:', error);
  }
}

export function setupNotificationListeners() {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification response:', response);
      // Handle notification tap - navigate to relevant screen
      const data = response.notification.request.content.data;
      
      if (data?.order_id) {
        // Navigate to order details
        // This would use your navigation library
        console.log('Navigate to order:', data.order_id);
      }
    }
  );

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
