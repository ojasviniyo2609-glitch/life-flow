# LifeFlow iOS Prototype

Optimized for iPhone/iPad with safe-area support, touch controls, mobile bottom navigation, responsive layouts, PWA manifest, offline caching, and Apple Home Screen metadata.

## Install on iPhone
Host these files on an HTTPS website, open the site in Safari, tap Share → Add to Home Screen, then open LifeFlow from the Home Screen.

Directly opening index.html works for basic testing, but PWA installation/offline service workers require HTTPS.

For a production iOS app, connect the frontend to a secure backend and optionally wrap it with Capacitor/Xcode to create an App Store IPA.

## Notifications
Open Settings → Enable notifications. Reminders and daily schedule items then show a system notification, sound and vibration when their time arrives.
- iPhone: requires iOS 16.4+ and the app added to the Home Screen.
- Web pages can only fire these while the app/tab is open or running in the background. For alerts when the app is fully closed, a backend with Web Push is needed.
