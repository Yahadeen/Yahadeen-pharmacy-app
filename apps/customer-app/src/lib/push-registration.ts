import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

type ExpoConstantsWithProjectId = typeof Constants & {
  expoConfig?: { extra?: { eas?: { projectId?: string } } };
  easConfig?: { projectId?: string };
};

export type PushRegistrationPayload = {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceInfo: Record<string, unknown>;
};

export async function requestPushRegistration(): Promise<PushRegistrationPayload | null> {
  if (Constants.appOwnership === 'expo' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0036B6',
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  let finalStatus = permission.status;
  if (finalStatus !== 'granted') {
    finalStatus = (await Notifications.requestPermissionsAsync()).status;
  }
  if (finalStatus !== 'granted') return null;

  const expoConstants = Constants as ExpoConstantsWithProjectId;
  const projectId =
    expoConstants.expoConfig?.extra?.eas?.projectId ??
    expoConstants.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;

  if (!projectId) return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return {
    token: token.data,
    platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
    deviceInfo: {
      platform: Platform.OS,
      osVersion: Platform.Version,
      manufacturer: Device.manufacturer,
      model: Device.modelName,
    },
  };
}

export async function getPushPermissionStatus(): Promise<Notifications.PermissionStatus | 'unavailable'> {
  if (Constants.appOwnership === 'expo' || !Device.isDevice) return 'unavailable';
  return (await Notifications.getPermissionsAsync()).status;
}
