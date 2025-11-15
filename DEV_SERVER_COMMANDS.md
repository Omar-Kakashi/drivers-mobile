# Development Server Commands

## Mobile App (React Native)

### Option 1: Tailscale (Recommended) ⭐
**Use when:** You want a fixed IP that works on any network (WiFi, cellular, anywhere)

```powershell
# PowerShell - Use this for presentations/demos
cd "C:\Users\omarm\Desktop\STSC New App\drivers-mobile"
$env:REACT_NATIVE_PACKAGER_HOSTNAME="100.99.182.57"
npx expo start --dev-client
```

**Or use the shortcut:**
```powershell
.\start-tailscale.ps1
```

**Metro URL:** `http://100.99.182.57:8081` (fixed IP)
**Requirements:** Tailscale running on both laptop and phone

---

### Option 2: Expo Tunnel
**Use when:** Tailscale is not available

```powershell
cd "C:\Users\omarm\Desktop\STSC New App\drivers-mobile"
npx expo start --host tunnel
```

**Metro URL:** Changes each time (e.g., `https://gp-kjpw-omarkakashi-8083.exp.direct`)
**Requirements:** None - works anywhere

---

### Option 3: Local WiFi Only
**Use when:** Phone and laptop are on the same WiFi network

```powershell
cd "C:\Users\omarm\Desktop\STSC New App\drivers-mobile"
npx expo start --dev-client
```

**Metro URL:** `http://192.168.0.111:8081` (WiFi IP - changes per network)
**Requirements:** Both devices on same WiFi

---

## Backend API (FastAPI)

### Start Backend Containers
```powershell
cd "C:\Users\omarm\Desktop\STSC New App\stsc-app"
docker-compose up -d
```

**Backend URLs:**
- Localhost: `http://localhost:5000`
- WiFi: `http://192.168.0.111:5000`
- **Tailscale: `http://100.99.182.57:5000`** (works anywhere)

### Check Backend Status
```powershell
docker ps
curl http://localhost:5000/health
```

---

## Web App

```powershell
cd "C:\Users\omarm\Desktop\STSC New App\stsc-app"
npm start
```

**Web URL:** `http://localhost:19006`

---

## Quick Start (Everything)

```powershell
# 1. Start backend
cd "C:\Users\omarm\Desktop\STSC New App\stsc-app"
docker-compose up -d

# 2. Start mobile app (Tailscale)
cd "C:\Users\omarm\Desktop\STSC New App\drivers-mobile"
.\start-tailscale.ps1

# 3. Start web app (optional)
cd "C:\Users\omarm\Desktop\STSC New App\stsc-app"
npm start
```

---

## Troubleshooting

### Mobile app can't connect to backend?
1. Check Tailscale is running on both devices
2. Verify backend: `docker ps` (should show `stsc-backend-api` healthy)
3. Test backend: `curl http://100.99.182.57:5000/health`

### Metro bundler connection issues?
1. Make sure you used Tailscale command: `$env:REACT_NATIVE_PACKAGER_HOSTNAME="100.99.182.57"`
2. On phone, shake device → Enter URL manually → `http://100.99.182.57:8081`
3. Or scan QR code shown in terminal

### Port already in use?
```powershell
# Kill all Node processes
Get-Process -Name "node" | Stop-Process -Force

# Try again
.\start-tailscale.ps1
```

---

## Network Configuration Summary

| Device | WiFi IP | Tailscale IP | Notes |
|--------|---------|--------------|-------|
| Laptop (kakashi) | 192.168.0.111 | 100.99.182.57 | Fixed Tailscale IP |
| Phone (Samsung) | 192.168.0.x | 100.107.38.43 | Fixed Tailscale IP |

**For presentations:** Always use Tailscale IPs - they work on ANY network!
