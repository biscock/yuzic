# Personal Android APK

The `android-apk` branch builds the shared app code, including the HEX inputs
and global-player context fix, without changing the Android app sources.

Pushes to this branch run **Android APK (personal build)** on an Ubuntu runner.
Download the `Yuzic-Android-arm64` artifact and extract the APK. It is a Release
build with the JS bundle embedded, so Metro and Expo login are not required.

The build uses the project's existing signing fallback: the checked-in debug
keystore. It is for personal testing, not Play publication. This key is public.
An official Yuzic installation signed with a different certificate cannot be
updated with this APK; Android requires matching signing certificates.
Future builds using the same key can update this personal installation.

Only ARM64 is built, suitable for current ARM64 phones. No Play credentials,
store build-number queries, signing secrets or Fastlane publishing lanes are used.
The app version name comes from package.json; the existing local version-code
fallback remains unchanged. The upstream store workflows are untouched.
