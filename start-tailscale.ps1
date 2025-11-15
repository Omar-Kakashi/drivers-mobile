# Start Expo Metro on Tailscale IP
# This allows mobile app to connect from anywhere (WiFi, cellular, any network)

$env:REACT_NATIVE_PACKAGER_HOSTNAME="100.99.182.57"
npx expo start --dev-client
