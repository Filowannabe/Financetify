# 📆 Incomes Calculator — React Native (Expo + Firebase)

A subscription‑tracking mobile app with **offline** (AsyncStorage) and **online** (Cloud Firestore) storage.  
Create, edit, delete, import/export CSV, and sync data between local and cloud.

---

## ✨ Features

| Local (AsyncStorage) | Firebase (Firestore) | UI |
|----------------------|----------------------|----|
| Full CRUD            | Full CRUD            | React Native Paper |
| CSV export / import  | Copy Local → Cloud   | Bottom Tabs |
|                      | Copy Cloud → Local   | Dark mode |
| Offline persistence  | Auto‑refresh on focus | Material icons |


## 🚀 Quick Start

```bash
git clone https://github.com/USERNAME/incomes-calculator.git
cd incomes-calculator

yarn            # or npm install

cp .env.example .env
cp .env.example .env.local   # fill in Firebase keys

npx expo start -c
```

---

## 🔑 Firebase Setup

1. Open **Firebase Console** → create project → enable **Cloud Firestore**  
2. Get your Web app keys and place them in `.env` / `.env.local`:

```
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=my-app.firebaseapp.com
FIREBASE_PROJECT_ID=my-app
FIREBASE_STORAGE_BUCKET=my-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:1234567890:web:abcdef654321
```

3. Temporary open rules for testing:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /{doc=**} {
      allow read, write: if true;
    }
  }
}
```

---

## ⚙️ Environment Variables (`react-native-dotenv`)

*babel.config.js*

```js
plugins: [
  ['module:react-native-dotenv', {
    moduleName: '@env',
    path: '.env',
    allowUndefined: true,
  }],
]
```

*env.d.ts*

```ts
declare module '@env' {
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
}
```

---

## 🔄 Sync Workflow

| Action                | Flow |
|-----------------------|------|
| Create/Edit **Local** | Save → AsyncStorage → context updates → List refreshes |
| Create/Edit **Cloud** | Save → Firestore → `goBack()` → List auto‑reloads |
| Copy Local → Cloud    | Adds non‑duplicate records|
| Copy Cloud → Local    | Merges missing items locally |

---

## 🏃‍♂️ Screen Overview

| Screen               | Purpose |
|----------------------|---------|
| **Home**             | Welcome page |
| **Create Subscription** | Quick add form (defaults to local) |
| **Subscriptions**    | List, filters, sync buttons |
| **Settings**         | Language, region, theme |

---

## 📦 Building & Installing on Real Devices (Expo EAS)

> Prerequisites   
> • Node ≥ 16  • Expo CLI • **EAS CLI** (`npm i -g eas-cli`) • Expo account (`eas login`)

### 1 . Configure EAS

```bash
eas build:configure        # creates eas.json
```

Choose the platforms you plan to build (Android and/or iOS).

---

### 2 . Android Builds

| Goal | Command | Result |
|------|---------|--------|
| ⚡ Debug APK   | `eas build -p android --profile preview`     | `app-debug.apk` |
| 🏪 Play Store  | `eas build -p android --profile production` | `app-release.aab` |

After build completes, download the file from the console link.

**Install APK on device**

```bash
adb install app-debug.apk   # enable USB‑debugging on phone
```

---

### 3 . iOS Builds (macOS + Xcode)

| Goal | Command | Result |
|------|---------|--------|
| ⚡ Ad Hoc / TestFlight | `eas build -p ios --profile preview`     | `.ipa` file |
| 🏪 App Store          | `eas build -p ios --profile production` | uploaded to App Store Connect |

- For Ad Hoc, download the `.ipa` and install via **Apple Configurator** or **TestFlight**.

---

### 4 . Local Dev Builds (no EAS)

```bash
npx expo run:android   # debug on connected Android / emulator
npx expo run:ios       # debug on iOS simulator (macOS)
```

---

### 🔐 Signing Tips

| Platform | Notes |
|----------|-------|
| Android  | EAS auto‑generates a keystore on first production build — save the backup file! |
| iOS      | Provide certificates yourself **or** let EAS manage them automatically. |

---

## 🛡️ Production Checklist

- Harden Firestore security rules before release  
- Do **not** commit `.env` / `.env.local`  
- Consider adding Firebase Auth for multi‑device sync  

---

Happy coding & happy budgeting! 💸
