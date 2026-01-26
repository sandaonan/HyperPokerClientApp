import type { LogtoConfig } from '@logto/react';

export const logtoConfig: LogtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT || '',
  appId: import.meta.env.VITE_LOGTO_APP_ID || '',
  scopes: ['openid', 'profile', 'email', 'phone'],
};

export const redirectUris = {
  signIn: import.meta.env.VITE_LOGTO_CALLBACK_URI || 'http://localhost:3000/callback',
  signOut: import.meta.env.VITE_LOGTO_SIGNOUT_URI || 'http://localhost:3000/',
};
