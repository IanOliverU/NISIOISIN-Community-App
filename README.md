# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Manga CBZ not in Git

`*.cbz` are in **.gitignore** so the repo stays small (CBZ files are often large). Add your manga CBZ files locally into **src/manga/** and run `npm run generate-manga`. PDFs for light novels are committed in the repo as usual.

## Light novel content

- Put series in **src/lightnovels/** as folders (e.g. `Monogatari Series/`).
- Each volume: one `.webp` cover and one `.pdf` with the **same base filename** (e.g. `Monogatari Series v01 - Bakemonogatari Part 1.webp` and `.pdf`).
- Regenerate manifest and asset map:

  ```bash
  npm run generate-lightnovels
  ```

## Building for distribution (offline app)

All PDF and CBZ in **src/lightnovels/** and **src/manga/** are **bundled inside the app** when you create a production build. No server or download is required after install.

- **Development** (`npx expo start`): Metro serves assets from your PC, so the device fetches them over the network (same Wi‑Fi or tunnel).
- **Production build**: Run a build (see below). The built APK/IPA contains all required assets; the app reads them from local storage. No internet needed for reading.

### Create a build with everything included

1. Install EAS CLI (one-time): `npm install -g eas-cli`
2. Log in: `eas login`
3. Build:
   - Android APK: `eas build --platform android --profile preview` (or create a profile in `eas.json`)
   - Or: `npx expo run:android --variant release` for a local release build

The CBZ and PDF files you’ve added and registered in the asset maps (via `npm run generate-lightnovels` and `npm run generate-manga`) are included automatically. Share the built APK/IPA with your community; once installed, all content is available offline.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
Update: working on app today
