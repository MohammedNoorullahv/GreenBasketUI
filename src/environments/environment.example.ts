// Template for keeping real Firebase credentials OUT of git.
//
// Setup for a fresh clone / new machine:
//   1. Copy this file to `environment.ts` and `environment.development.ts`
//   2. Fill in the real apiKey and any other project-specific values
//   3. The files above are gitignored, so the real key stays local
//
// When replacing the placeholder, run `npx ng build --configuration development`
// locally to confirm the config compiles.
//
// NOTE: If an apiKey is ever exposed, rotate it in Firebase Console >
// Project Settings > General > API keys and restrict it
// (Google Cloud Console > APIs & Services > Credentials).
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7082',
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.firebasestorage.app',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'G-XXXXXXXXXX'
  }
};
