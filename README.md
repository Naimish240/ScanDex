# ScanDex

Private, offline-first business card scanner and indexer built with TanStack Start, React, Tailwind CSS, and Capacitor.

## Getting Started

First, install the project dependencies:

```sh
npm install
```

## Running for Web Development

To run the local development server for testing the web UI:

```sh
npm run dev
```

## Building & Running on Android

This project uses **Capacitor** to wrap the web app into a native Android application. This is required for testing native features like the device camera.

1. **Build the web assets:**
   ```sh
   npm run build
   ```

2. **Sync changes to the Android project:**
   ```sh
   npx cap sync
   ```

3. **Open the project in Android Studio:**
   ```sh
   npx cap open android
   ```
   *(Alternatively, you can run `npx cap run android` to launch directly to a connected device or emulator).*

4. **Run the App:** 
   Once Android Studio opens, let Gradle sync, then press the **Run** (Play) button to install it on your connected device or emulator.

## Features

- **Intelligent Offline OCR:** Extracts business card text using on-device ML Kit (Android) or Tesseract.js (Web).
- **Secure Local Storage:** Uses Dexie.js (IndexedDB) to store high-res images and contact details securely without cloud sync.
- **Multiple Voice Notes:** Record multiple audio notes per contact directly from the app.
- **Full ZIP Export:** Generate a `.zip` archive containing a CSV of contacts alongside raw images and audio files, with native Android Share Sheet integration to bypass email limits.

## Tech Stack

- **Capacitor** (Native Mobile Wrapper)
- **TanStack Start**
- **TypeScript & React**
- **Tailwind CSS**
- **Dexie.js** (Offline IndexedDB Storage)
- **Tesseract.js & ML Kit** (Offline OCR)
- **Vite**
