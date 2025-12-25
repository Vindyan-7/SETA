import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 1. Configure how notifications appear when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function scheduleDailyReminder() {
  // 2. Request Permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Permission not granted for notifications');
    return;
  }

  // 3. Cancel existing notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 4. Schedule for 8:00 PM daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "📝 Track your expenses!",
      body: "Don't forget to log your spending for today.",
      sound: 'default',
    },
    trigger: {
      hour: 20, // 8 PM
      minute: 0,
      repeats: true,
    },
  });

  console.log("Daily reminder scheduled for 8:00 PM");
}
