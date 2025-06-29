# 📱 Subscription Manager App (React Native + Expo + Firebase)

This is a React Native mobile app (built with Expo) to manage monthly subscriptions. Users can:

- Track local subscriptions (using AsyncStorage)
- Sync and store subscriptions in Firebase Firestore
- Switch between local and cloud data
- Import/export subscriptions via CSV
- Automatically refresh due dates
- Full offline support

---

## 🚀 Stack & Features

- **React Native (Expo)**
- **React Navigation** (Tabs + Stack)
- **Firebase Firestore** for cloud storage
- **AsyncStorage** for local persistence
- **Date-fns** for date calculations
- **CSV Export/Import** (via Filesystem)
- **Material Design UI** via `react-native-paper`


## 🔐 Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project
3. In **Project settings > General > Your apps**, create a new **Web App**
4. Copy your config:

```ts
// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

5. Create `.env` in your project root:

```
FIREBASE_API_KEY=xxxxx
FIREBASE_AUTH_DOMAIN=xxxxx
FIREBASE_PROJECT_ID=xxxxx
FIREBASE_STORAGE_BUCKET=xxxxx
FIREBASE_MESSAGING_SENDER_ID=xxxxx
FIREBASE_APP_ID=xxxxx
```

6. Install `expo-env` support (via Babel config):

```bash
npm install react-native-dotenv
```

Update `babel.config.js`:

```js
plugins: [
  [
    "module:react-native-dotenv",
    {
      moduleName: "@env",
      path: ".env",
      safe: false,
      allowUndefined: true,
    },
  ],
];
```

7. Restart Metro bundler

---

## ✅ Functionality Overview

| Feature      | Description                                  |
| ------------ | -------------------------------------------- |
| 🔄 Sync      | Manually copy data between local ↔ Firebase  |
| 🔁 Refresh   | Recalculate next payment dates               |
| 🗑️ Delete    | Delete locally or from Firestore             |
| ✏️ Edit      | Edit and persist changes                     |
| 🔍 Filter    | By name or by current month                  |
| ⬆️ Export    | Save subscriptions to CSV                    |
| ⬇️ Import    | Import subscriptions from CSV                |
| ☁️ Save Mode | Choose between local or Firebase on creation |

---

## 🧪 Firebase Sync Strategy

- A `fromFirebase: true` flag is passed when editing a subscription coming from Firestore.
- On **update**, the app:
  - Saves changes to Firestore via `updateSubscriptionFirebase`
  - Then re-fetches the entire collection with `loadSubscriptionsFromFirebase()`
  - Then navigates back to the List screen (now updated)

---

## 🛠 Build & Install on a Physical Device (Expo EAS)

> Requirements: Node ≥ 16, Expo CLI, **EAS CLI** (`npm i -g eas-cli`), an Expo account.

### 1. Configure EAS

```bash
# inside project root
eas build:configure     # creates eas.json and sets expo-build profiles
```

### 2. Build for **Android**

| Goal                          | Command                                     | Output             |
| ----------------------------- | ------------------------------------------- | ------------------ |
| ⚡ Debug APK (quick sideload) | `eas build -p android --profile preview`    |  `app-debug.apk`   |
| 🏪 Play Store (AAB)           | `eas build -p android --profile production` |  `app-release.aab` |

After finish, download the file shown in the console (or from Expo Website) and:

```bash
adb install app-debug.apk          # sideload on a connected device
```

### 3. Build for **iOS** (macOS + Xcode)

| Goal                   | Command                                 | Output                         |
| ---------------------- | --------------------------------------- | ------------------------------ |
| ⚡ Ad Hoc / TestFlight | `eas build -p ios --profile preview`    |  `*.ipa`                       |
| 🏪 App Store           | `eas build -p ios --profile production` |  Uploaded to App Store Connect |

For Ad Hoc, download the `.ipa` and install via **Apple Configurator** or **TestFlight**.

### 4. Run Locally without EAS (dev only)

```bash
npx expo run:android   # installs debug build on an emulator / device
npx expo run:ios       # installs on iOS simulator (macOS only)
```

---

### 🔑 Signing Notes

- **Android**: EAS generates a keystore on first build (save the backup!).
- **iOS**: Provide Distribution Certificate + Provisioning Profile or let EAS manage them.

---

Happy tracking! 📆💸
