import { supabase } from '../lib/supabase';

export interface PushNotificationPermission {
  granted: boolean;
  token?: string;
}

export async function requestNotificationPermission(): Promise<PushNotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return { granted: false };
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('This browser does not support service workers');
    return { granted: false };
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const token = await registerServiceWorkerAndGetToken();
      return { granted: true, token };
    }

    return { granted: false };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { granted: false };
  }
}

async function registerServiceWorkerAndGetToken(): Promise<string | undefined> {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    await navigator.serviceWorker.ready;

    const token = generateSimpleToken();

    return token;
  } catch (error) {
    console.error('Error registering service worker:', error);
    return undefined;
  }
}

function generateSimpleToken(): string {
  return `web-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function savePushToken(token: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No user logged in');
      return false;
    }

    const { error } = await supabase
      .from('push_notification_tokens')
      .upsert({
        pet_master_id: user.id,
        token,
        platform: 'web',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'token',
      });

    if (error) {
      console.error('Error saving push token:', error);
      return false;
    }

    console.log('Push token saved successfully');
    return true;
  } catch (error) {
    console.error('Error in savePushToken:', error);
    return false;
  }
}

export async function disablePushToken(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_notification_tokens')
      .update({ is_active: false })
      .eq('token', token);

    if (error) {
      console.error('Error disabling push token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in disablePushToken:', error);
    return false;
  }
}

export async function checkNotificationStatus(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  hasToken: boolean;
}> {
  const supported = 'Notification' in window && 'serviceWorker' in navigator;

  if (!supported) {
    return {
      supported: false,
      permission: 'default',
      hasToken: false,
    };
  }

  const permission = Notification.permission;

  const { data: { user } } = await supabase.auth.getUser();
  let hasToken = false;

  if (user) {
    const { data } = await supabase
      .from('push_notification_tokens')
      .select('id')
      .eq('pet_master_id', user.id)
      .eq('is_active', true)
      .limit(1);

    hasToken = !!data && data.length > 0;
  }

  return {
    supported,
    permission,
    hasToken,
  };
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  options?: {
    icon?: string;
    data?: Record<string, unknown>;
    url?: string;
  }
): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('No active session');
      return false;
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        title,
        body,
        icon: options?.icon,
        data: options?.data,
        url: options?.url,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error sending push notification:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('Push notification sent:', result);
    return true;
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return false;
  }
}
