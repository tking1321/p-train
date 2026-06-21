import { execSync } from 'child_process'
import { existsSync, mkdirSync, cpSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

console.log('🚀 Setting up TrainrHub for native mobile deployment...\n')

// Ensure dist exists
console.log('📦 Building web app...')
try {
  execSync('npm run build', { cwd: root, stdio: 'inherit' })
  console.log('✅ Build complete\n')
} catch (error) {
  console.error('❌ Build failed')
  process.exit(1)
}

// Initialize Capacitor if not already done
if (!existsSync(resolve(root, 'android')) && !existsSync(resolve(root, 'ios'))) {
  console.log('🔧 Initializing Capacitor...')
  try {
    execSync('npx cap init TrainrHub com.trainrhub.app --web-dir dist', { cwd: root, stdio: 'inherit' })
    console.log('✅ Capacitor initialized\n')
  } catch (error) {
    // Already initialized, that's fine
  }
}

// Add Android platform
if (!existsSync(resolve(root, 'android'))) {
  console.log('🤖 Adding Android platform...')
  try {
    execSync('npx cap add android', { cwd: root, stdio: 'inherit' })
    console.log('✅ Android platform added\n')
  } catch (error) {
    console.error('⚠️ Could not add Android platform (may require Android SDK)')
  }
}

// Add iOS platform
if (!existsSync(resolve(root, 'ios'))) {
  console.log('🍎 Adding iOS platform...')
  try {
    execSync('npx cap add ios', { cwd: root, stdio: 'inherit' })
    console.log('✅ iOS platform added\n')
  } catch (error) {
    console.error('⚠️ Could not add iOS platform (requires macOS with Xcode)')
  }
}

// Sync platforms
console.log('🔄 Syncing platforms...')
try {
  execSync('npx cap sync', { cwd: root, stdio: 'inherit' })
  console.log('✅ Platforms synced\n')
} catch (error) {
  console.error('⚠️ Sync failed (platforms may not be configured)')
}

console.log(`
===========================================
📱 Setup Complete!
===========================================

Next steps:

1. For iOS (requires macOS with Xcode):
   npm run cap:open:ios

2. For Android (requires Android Studio):
   npm run cap:open:android

3. To rebuild and sync after changes:
   npm run cap:sync

App Store Requirements:

✅ Bundle ID: com.trainrhub.app
✅ App Name: TrainrHub
✅ Dark theme configured
✅ Safe area handling for notches

Before submitting to App Stores:
- Generate app icons (1024x1024 recommended)
- Create launch screen/splash screen
- Configure signing certificates
- Test on physical devices

Resources:
- iOS: https://developer.apple.com/app-store/submissions/
- Android: https://play.google.com/console/about/requirements/

===========================================
`)
