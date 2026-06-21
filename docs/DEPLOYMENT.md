# TrainrHub - App Store Deployment Guide

## Your App is Ready for Mobile Deployment!

Capacitor has been configured to convert your React web app into native mobile applications for both iOS and Android.

## What Was Added

### 1. Capacitor Configuration (`capacitor.config.json`)
- App ID: `com.trainrhub.app`
- App Name: `TrainrHub`
- Dark theme status bar and splash screen
- Keyboard handling for forms

### 2. Native Plugins
- **StatusBar**: Automatically adapts to dark/light mode
- **SplashScreen**: Shows on app launch
- **Keyboard**: Handles keyboard appearance on mobile

### 3. Mobile-Safe Styling
- Safe area insets for iPhone notch/dynamic island
- Proper viewport for mobile browsers
- Touch-friendly interactions

### 4. Setup Scripts
- `npm run setup:native` - Complete one-command setup
- `npm run cap:sync` - Rebuild and sync to native
- `npm run cap:open:ios` - Open Xcode
- `npm run cap:open:android` - Open Android Studio

## Quick Deployment Steps

### For iOS (requires macOS with Xcode)

```bash
# 1. Run the native setup
npm run setup:native

# 2. Open in Xcode
npm run cap:open:ios

# 3. In Xcode:
#    - Set your Apple team for signing
#    - Add your app icons (drag to Assets.xcassets)
#    - Product > Archive > Distribute App
#    - Upload to App Store Connect
```

### For Android

```bash
# 1. Run the native setup
npm run setup:native

# 2. Open in Android Studio
npm run cap:open:android

# 3. In Android Studio:
#    - Build > Generate Signed Bundle/APK
#    - Create or use existing keystore
#    - Choose Android App Bundle (AAB)
#    - Upload to Google Play Console
```

## Requirements Summary

| Platform | Cost | Tools Required |
|----------|------|----------------|
| iOS | $99/year | macOS + Xcode 15+ |
| Android | $25 one-time | Android Studio |

## App Store Guidelines

Both Apple and Google review apps before publishing. Key requirements:

1. **App must not crash** - Test thoroughly
2. **Working functionality** - All features must work
3. **Privacy policy** - Required for apps with user accounts
4. **App icons** - Multiple sizes required
5. **Screenshots** - For store listing

## After Publishing

Once your app is live:
- Users can download from App Store / Play Store
- Updates are pushed automatically via app stores
- You control release timing and rollout

## Need Professional Icons?

Generate app icons at: https://icon.kitchen or https://www.appicon.co

Upload your logo/design, and they'll output all required sizes for both platforms.

## Support Resources

- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [Capacitor Docs](https://capacitorjs.com/docs)
