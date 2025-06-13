import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return null;
    }

    // ✅ Pass projectId manually here
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: '1f44c973-d31b-494a-8a02-e9e5efa3034f', // <- same as in app.config.js
    })).data;

    console.log('✅ Expo Push Token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}
