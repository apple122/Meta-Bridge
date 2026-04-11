// MetaStock Push Notification Service
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = 'BD-PNFuLrwk-TomSuT-HVkqfhWbhj0HtHv6_iz2CDAyK5ayUTEIAP09ZdNBV3EROLgx7zJhYF6rZf8t5b_UIkYc';

// Helper to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushNotificationService = {
  /**
   * Initialize and request permission for push notifications
   */
  async init(userId: string) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Push messaging is not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[Push] Notification permission denied.');
        return;
      }

      await this.subscribeUser(userId);
    } catch (err) {
      console.error('[Push] Initialization error:', err);
    }
  },

  /**
   * Subscribe the user to Push notifications
   */
  async subscribeUser(userId: string) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        console.log('[Push] New subscription created.');
      }

      // Send subscription to backend (Supabase)
      await this.saveSubscriptionToDb(userId, subscription);
      
    } catch (err) {
      console.error('[Push] Subscription failed:', err);
    }
  },

  /**
   * Save the subscription object to our database
   */
  async saveSubscriptionToDb(userId: string, subscription: PushSubscription) {
    try {
      // Remove any existing subscriptions for this same user + device identifier (handled by DB UNIQUE constraint)
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: subscription.toJSON(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,subscription'
        });

      if (error) {
        if (error.code !== '23505') { // Ignore unique constraint violations
          throw error;
        }
      } else {
        console.log('[Push] Subscription saved to DB.');
      }
    } catch (err) {
      console.error('[Push] Error saving subscription to DB:', err);
    }
  }
};
