# 📆 Financetify — Incomes Calculator

_React Native (Expo) + Firebase + AsyncStorage_

Track your income and subscriptions with **local** (offline) and **cloud** (online) support.

---

## 🧰 Tech Stack

| Area          | Tool                         |
| ------------- | ---------------------------- |
| Frontend      | React Native + Expo          |
| Design System | React Native Paper           |
| Local Storage | AsyncStorage                 |
| Cloud Storage | Firebase Firestore           |
| State Mgmt    | React Context                |
| Dev Tools     | TypeScript, ESLint, Prettier |

---

## ✨ Features

### 📦 Local (AsyncStorage)

- Full CRUD (Create, Read, Update, Delete)
- CSV Import / Export
- Works offline by default

### ☁️ Cloud (Firestore)

- Full CRUD synced with Firebase
- Copy data from/to local
- Realtime updates from the cloud

### 🎨 UI / UX

- Bottom Tab Navigation
- Dark Mode Support
- Material Icons
- Error Handling and Snackbar Notifications

---

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/incomes-calculator.git
cd incomes-calculator
npm install
# or yarn
```

### 2. Start the App

| Command             | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `npx expo start`    | Run app in development mode                             |
| `npx expo start -c` | Start with cache reset (use after .env or config edits) |

---

## 🔐 Firebase Setup

### 1. Create Firebase Project

- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a project and enable **Cloud Firestore**
- Add a **Web App** and copy config keys

### 2. Add to `.env` file

```env
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=my-app.firebaseapp.com
FIREBASE_PROJECT_ID=my-app
FIREBASE_STORAGE_BUCKET=my-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:1234567890:web:abcdef654321
```

### 3. Set Firestore Rules (dev only)

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## ⚙️ Environment Config (Dotenv)

### babel.config.js

```js
plugins: [
  [
    "module:react-native-dotenv",
    {
      moduleName: "@env",
      path: ".env",
      allowUndefined: false,
    },
  ],
];
```

### env.d.ts

```ts
declare module "@env" {
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
}
```

---

## 🔄 Data Sync Flow

| Action              | Result                                              |
| ------------------- | --------------------------------------------------- |
| Create/Edit (Local) | Save → AsyncStorage → update context → refresh list |
| Create/Edit (Cloud) | Save → Firestore → goBack() → auto-refresh          |
| Sync Local → Cloud  | Uploads missing items to Firebase                   |
| Sync Cloud → Local  | Merges cloud items into local storage               |

---

## 🧭 Screens Overview

| Screen Name             | Function                                     |
| ----------------------- | -------------------------------------------- |
| **Home**                | Welcome and quick summary                    |
| **Create Subscription** | Adds a new subscription (defaults to local)  |
| **Subscriptions**       | List with filters, local/cloud sync, CRUD UI |
| **Settings**            | Change language, region, theme               |

---

## 🧪 Test Firebase is Working

1. Add a subscription using the "Create Subscription" tab
2. Use the sync button to send it to Firebase
3. Modify it on another device or emulator
4. Observe real-time updates in the Subscriptions list

---

## ✅ Requirements

- Node.js ≥ 16
- Expo CLI
- Firebase Project (Cloud Firestore enabled)

---