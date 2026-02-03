import { useEffect, useState } from 'react';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  isPushNotificationSupported,
  getNotificationPermission
} from '../services/pushNotification';

interface NotificationManagerProps {
  userId: string | null;
}

export function NotificationManager({ userId }: NotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = isPushNotificationSupported();
    setIsSupported(supported);
    
    if (!supported) {
      console.log('[NotificationManager] Push notifications not supported');
      return;
    }

    // Get current permission status
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Register Service Worker and subscribe if user is logged in
    const initializeNotifications = async () => {
      try {
        // Register Service Worker
        const registration = await registerServiceWorker();
        if (!registration) {
          return;
        }
        setIsRegistered(true);

        // If user is logged in and permission is granted, subscribe
        if (userId && currentPermission === 'granted') {
          const memberId = parseInt(userId);
          if (!isNaN(memberId)) {
            try {
              await subscribeToPush(memberId, registration);
              console.log('[NotificationManager] Successfully subscribed to push notifications');
            } catch (error) {
              console.error('[NotificationManager] Failed to subscribe:', error);
            }
          }
        }
      } catch (error) {
        console.error('[NotificationManager] Failed to initialize:', error);
      }
    };

    initializeNotifications();
  }, [userId]);

  // Auto-request permission when user logs in (if not already granted/denied)
  useEffect(() => {
    if (userId && isSupported && permission === 'default') {
      // Optionally auto-request permission
      // For now, we'll let the user manually enable it
      // You can uncomment this to auto-request:
      // requestNotificationPermission().then(setPermission).catch(console.error);
    }
  }, [userId, isSupported, permission]);

  // This component doesn't render anything
  // It just manages the notification setup in the background
  return null;
}


