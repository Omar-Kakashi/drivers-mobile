# 📱 Push Notifications Setup Guide

## Current Status
- ✅ Firebase Cloud Messaging configured (google-services.json exists)
- ⚠️ Firebase native modules DON'T work in Expo Go
- ✅ NotificationHandler.tsx ready for native Firebase

## 🎯 Two Options for Push Notifications

---

## Option 1: Expo Push Notifications (✅ RECOMMENDED - Works NOW in Expo Go)

**Advantages:**
- ✅ Works immediately in Expo Go (no build required)
- ✅ Free up to 1000 push notifications/day
- ✅ Simple setup (10 minutes)
- ✅ Cross-platform (iOS, Android, Web)
- ✅ Managed by Expo (no server maintenance)

**How it works:**
1. User opens app → App gets Expo Push Token
2. App sends token to your backend → Backend stores token
3. Backend wants to notify user → Sends request to Expo API
4. Expo delivers notification to user's device

**Implementation Steps:**

### Step 1: Install Expo Notifications
```bash
cd "c:\Users\omarm\Desktop\STSC New App\drivers-mobile"
npx expo install expo-notifications expo-device expo-constants
```

### Step 2: Update app.json (add notification permissions)
```json
{
  "expo": {
    "plugins": [
      "expo-font",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ],
    "android": {
      "permissions": [
        "NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

### Step 3: Create ExpoNotificationHandler.tsx (already prepared)

### Step 4: Backend Integration
Your backend at `https://ostol.stsc.ae/api` needs to:
1. Add endpoint to receive/store Expo Push Tokens
2. Send notifications via Expo API when events happen

**Backend Example (Python FastAPI):**
```python
import requests

def send_push_notification(expo_token: str, title: str, body: str, data: dict = None):
    url = "https://exp.host/--/api/v2/push/send"
    payload = {
        "to": expo_token,
        "title": title,
        "body": body,
        "data": data or {},
        "sound": "default",
        "priority": "high"
    }
    response = requests.post(url, json=payload)
    return response.json()

# Example usage:
send_push_notification(
    expo_token="ExponentPushToken[xxxxxx]",
    title="New Assignment",
    body="Vehicle ABC123 assigned to you",
    data={"type": "assignment", "id": "123"}
)
```

---

## Option 2: Firebase Cloud Messaging (Native)

**Advantages:**
- ✅ More control over notification behavior
- ✅ Works offline (FCM handles delivery)
- ✅ No daily limits
- ✅ Already configured (google-services.json exists)

**Disadvantages:**
- ❌ Doesn't work in Expo Go
- ❌ Requires building custom development client (20 minutes first time)
- ❌ Need to install APK on device

**Implementation Steps:**

### Step 1: Build Development Client
```bash
cd "c:\Users\omarm\Desktop\STSC New App\drivers-mobile"
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```

This creates a custom APK (~50MB) with Firebase native modules included.

### Step 2: Install APK on Device
After build completes (~10-20 min), download APK and install on device.

### Step 3: Test Firebase Notifications
Your existing `NotificationHandler.tsx` will automatically work once running in the development client.

---

## 🚀 Recommended Implementation: Expo Push Notifications

Since you need notifications **working NOW** and want to avoid build complexity, I recommend **Option 1: Expo Push Notifications**.

**What I'll do:**
1. Install expo-notifications packages
2. Create ExpoNotificationHandler component
3. Update app.json with notification config
4. Add permission request on app startup
5. Create backend integration guide
6. Test notification immediately in Expo Go

**Timeline:** 15 minutes setup + 30 minutes backend integration

---

## 📊 Comparison Table

| Feature | Expo Push | Firebase Native |
|---------|-----------|-----------------|
| **Works in Expo Go** | ✅ Yes | ❌ No |
| **Setup Time** | 15 min | 45 min (with build) |
| **Daily Limit** | 1000 free | ∞ |
| **Offline Delivery** | ✅ Yes | ✅ Yes |
| **Custom Sounds** | ✅ Yes | ✅ Yes |
| **Build Required** | ❌ No | ✅ Yes (dev client) |
| **Backend Complexity** | Simple HTTP | Firebase SDK |
| **Cost** | Free tier | Free |

---

## 🎯 Next Steps

**Choose one:**

**A) Expo Push Notifications (Fast - Recommended):**
- I'll implement it now (15 min)
- Test immediately in Expo Go
- Works for production launch

**B) Firebase Native (Complete - More Control):**
- Build development client (20 min)
- Install APK on device
- Existing NotificationHandler.tsx works automatically

**Which would you prefer?**
