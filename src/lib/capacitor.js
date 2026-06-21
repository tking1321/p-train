let isNative = false
let platform = 'web'

function detectPlatform() {
  if (typeof window === 'undefined') return { isNative: false, platform: 'web' }

  const ua = window.navigator.userAgent
  if (/android/i.test(ua)) {
    return { isNative: true, platform: 'android' }
  }
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return { isNative: true, platform: 'ios' }
  }
  return { isNative: false, platform: 'web' }
}

export async function initCapacitor() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    isNative = Capacitor.isNativePlatform()
    platform = Capacitor.getPlatform()
  } catch {
    // Running in web context without Capacitor
    const detected = detectPlatform()
    isNative = detected.isNative
    platform = detected.platform
    return
  }

  if (!isNative) return

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    if (SplashScreen) {
      await SplashScreen.hide()
    }
  } catch {}

  try {
    const isDark = document.documentElement.classList.contains('dark')
    const { StatusBar, Style } = await import('@capacitor/status-bar')

    if (StatusBar && Style && (platform === 'ios' || platform === 'android')) {
      await StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light,
      })

      await StatusBar.setBackgroundColor({
        color: isDark ? '#000000' : '#ffffff',
      })
    }
  } catch {}

  document.body.classList.add(`platform-${platform}`)
  document.body.classList.add(isNative ? 'capacitor-native' : 'capacitor-web')

  try {
    const { Keyboard } = await import('@capacitor/keyboard')
    if (Keyboard) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`)
        document.body.classList.add('keyboard-visible')
      })

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.removeProperty('--keyboard-height')
        document.body.classList.remove('keyboard-visible')
      })
    }
  } catch {}
}

export function getSafeAreaInsets() {
  return {
    top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0'),
    bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0'),
    right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0'),
  }
}

export { isNative, platform }
