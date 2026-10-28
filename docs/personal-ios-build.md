# Personal iOS build

The `hex-input` branch adds a HEX field above each colour picker in
Settings → Appearance → Colours. Paste `#RRGGBB` or `RRGGBB` and press Apply
or the keyboard's Done key. Three-digit shorthand is also accepted. Invalid
or incomplete input stays in the field without changing the saved theme.
The panel and field stay in sync, and the existing text contrast guard remains.

## GitHub Actions

The **iOS Sideload (unsigned IPA)** workflow builds on a push to `hex-input`,
or manually from Actions. Download the `Yuzic-unsigned` artifact after it
succeeds and extract `Yuzic-unsigned.ipa`.

This is an unsigned physical-device Release build with an embedded JS bundle,
not an App Store or TestFlight upload. No developer credentials or Expo login
are needed to build it. Installation requires signing the IPA with your own
certificate/provisioning profile using a sideloading tool. CarPlay and multicast
entitlements in the upstream app may need to be removed if your profile does
not support them. The build alone does not prove installation or playback works
on a physical iPhone.

## On a Mac

Install Xcode (including its iOS SDK), Node 22, Ruby 3.3 and CocoaPods, then:

```sh
npm ci --omit=dev
(cd ios && pod install --repo-update)
bash tools/build-ios-sideload.sh
```

The output is `build/sideload/Yuzic-unsigned.ipa`. Dependencies and native
projects are the checked-in upstream versions; this does not run Expo prebuild.
Use a separate checkout with a full `npm ci` to run lint, TypeScript or Jest.

This workflow bypasses the upstream publishing lanes entirely. It does not
change App Store build counters, use the author's signing repository or publish
anything to either store. The existing store workflows remain unchanged.
