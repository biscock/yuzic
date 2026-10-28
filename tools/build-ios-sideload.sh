#!/usr/bin/env bash
# Personal device build only: no store upload, signing identity or store counters.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "$(uname -s)" != Darwin ]]; then
  echo "This build requires macOS and Xcode." >&2
  exit 1
fi

export CI=1
export EXPO_NO_TELEMETRY=1
version=$(node -p "require('./package.json').version")
output="$PWD/build/sideload"
mkdir -p "$output"

xcodebuild \
  -workspace ios/Yuzic.xcworkspace \
  -scheme Yuzic \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$output/DerivedData" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY='' \
  DEVELOPMENT_TEAM='' \
  MARKETING_VERSION="$version" \
  DEBUG_INFORMATION_FORMAT=dwarf \
  build

app="$output/DerivedData/Build/Products/Release-iphoneos/Yuzic.app"
test -d "$app"
staging=$(mktemp -d "$output/package.XXXXXX")
trap 'rm -rf "$staging"' EXIT
mkdir "$staging/Payload"
ditto "$app" "$staging/Payload/Yuzic.app"
rm -f "$output/Yuzic-unsigned.ipa"
(cd "$staging" && /usr/bin/zip -qry "$output/Yuzic-unsigned.ipa" Payload)
echo "IPA for signing: $output/Yuzic-unsigned.ipa"
