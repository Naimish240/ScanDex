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

## Tech Stack

- **Capacitor** (Native Mobile Wrapper)
- **TanStack Start**
- **TypeScript & React**
- **Tailwind CSS**
- **Dexie.js** (Offline IndexedDB Storage)
- **Tesseract.js & ML Kit** (Offline OCR)
- **Vite**
