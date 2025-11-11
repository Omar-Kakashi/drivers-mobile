# 🔔 Backend Push Notification Integration Guide

## Overview
The mobile app now uses **Expo Push Notifications** which work immediately in Expo Go without requiring a custom build.

## How It Works

```
┌─────────────────┐
│  Mobile App     │ 1. User opens app
│  (Expo Go)      │ ──────────────────────────┐
└─────────────────┘                           │
                                              ▼
                                   ┌─────────────────────┐
                                   │ Request Push Token  │
                                   │ from Expo           │
                                   └─────────────────────┘
                                              │
                                              ▼
                                   ┌─────────────────────┐
                                   │ Expo Push Token:    │
                                   │ "ExponentPushToken  │
                                   │  [xxxxxx...]"       │
                                   └─────────────────────┘
                                              │
                                              │ 2. Send token to backend
                                              ▼
┌──────────────────────────────────────────────────────────┐
│  Your Backend (FastAPI)                                  │
│  https://ostol.stsc.ae/api                              │
│                                                          │
│  POST /push-tokens/register                             │
│  ├── Receives token from app                            │
│  ├── Stores in database                                 │
│  └── Links to user account                              │
└──────────────────────────────────────────────────────────┘
                    │
                    │ 3. Event happens (new assignment, leave approved, etc.)
                    ▼
┌──────────────────────────────────────────────────────────┐
│  Your Backend                                            │
│  ├── Looks up user's Expo Push Token                    │
│  ├── Sends HTTP POST to Expo API                        │
│  └── https://exp.host/--/api/v2/push/send              │
└──────────────────────────────────────────────────────────┘
                    │
                    │ 4. Expo delivers notification
                    ▼
┌─────────────────┐
│  Mobile App     │ 5. User receives notification
│  (Any device)   │ ────────────────────────────
└─────────────────┘
```

---

## 📋 Backend Implementation

### Step 1: Create Database Table for Push Tokens

**SQL (PostgreSQL):**
```sql
CREATE TABLE push_tokens (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    expo_push_token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(50), -- 'ios' or 'android'
    device_brand VARCHAR(100),
    device_model VARCHAR(100),
    os_name VARCHAR(50),
    os_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES drivers(id) ON DELETE CASCADE
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active);
```

---

### Step 2: Create Backend Endpoint to Register Tokens

**File:** `backend/app/routers/push_notifications.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import requests
from datetime import datetime

router = APIRouter(prefix="/push-tokens", tags=["Push Notifications"])

# ============================================================================
# MODELS
# ============================================================================

class PushTokenRegister(BaseModel):
    token: str
    platform: str
    deviceInfo: Optional[dict] = None

class PushNotification(BaseModel):
    title: str
    body: str
    data: Optional[dict] = None
    sound: str = "default"
    priority: str = "high"

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/register")
async def register_push_token(
    token_data: PushTokenRegister,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Register or update a user's Expo Push Token
    Called automatically when user opens the app
    """
    try:
        user_id = current_user["id"]
        
        # Check if token already exists
        existing = db.query(PushToken).filter(
            PushToken.expo_push_token == token_data.token
        ).first()
        
        if existing:
            # Update existing token
            existing.user_id = user_id
            existing.platform = token_data.platform
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
            
            if token_data.deviceInfo:
                existing.device_brand = token_data.deviceInfo.get("brand")
                existing.device_model = token_data.deviceInfo.get("modelName")
                existing.os_name = token_data.deviceInfo.get("osName")
                existing.os_version = token_data.deviceInfo.get("osVersion")
        else:
            # Create new token
            new_token = PushToken(
                user_id=user_id,
                expo_push_token=token_data.token,
                platform=token_data.platform,
                device_brand=token_data.deviceInfo.get("brand") if token_data.deviceInfo else None,
                device_model=token_data.deviceInfo.get("modelName") if token_data.deviceInfo else None,
                os_name=token_data.deviceInfo.get("osName") if token_data.deviceInfo else None,
                os_version=token_data.deviceInfo.get("osVersion") if token_data.deviceInfo else None,
            )
            db.add(new_token)
        
        db.commit()
        return {"success": True, "message": "Push token registered"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to register token: {str(e)}")

@router.delete("/unregister")
async def unregister_push_token(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Deactivate user's push tokens (e.g., when they log out)
    """
    try:
        db.query(PushToken).filter(
            PushToken.user_id == current_user["id"]
        ).update({"is_active": False})
        
        db.commit()
        return {"success": True, "message": "Push tokens deactivated"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# HELPER FUNCTIONS (Used by other routers)
# ============================================================================

def send_push_notification(
    db: Session,
    user_id: str,
    title: str,
    body: str,
    data: dict = None
) -> dict:
    """
    Send push notification to a specific user
    
    Usage in other routers:
    ```python
    from .push_notifications import send_push_notification
    
    # When assigning vehicle:
    send_push_notification(
        db=db,
        user_id=driver.id,
        title="New Assignment",
        body=f"Vehicle {vehicle.license_plate} assigned to you",
        data={"type": "assignment", "vehicle_id": vehicle.id}
    )
    ```
    """
    try:
        # Get active push tokens for user
        tokens = db.query(PushToken).filter(
            PushToken.user_id == user_id,
            PushToken.is_active == True
        ).all()
        
        if not tokens:
            return {"success": False, "message": "No active push tokens"}
        
        # Expo Push API endpoint
        expo_url = "https://exp.host/--/api/v2/push/send"
        
        results = []
        for token in tokens:
            payload = {
                "to": token.expo_push_token,
                "title": title,
                "body": body,
                "data": data or {},
                "sound": "default",
                "priority": "high",
                "channelId": "default"
            }
            
            try:
                response = requests.post(expo_url, json=payload, timeout=5)
                result = response.json()
                results.append(result)
                
                # Handle errors (invalid token, etc.)
                if result.get("data", {}).get("status") == "error":
                    error_type = result.get("data", {}).get("details", {}).get("error")
                    
                    if error_type in ["DeviceNotRegistered", "InvalidCredentials"]:
                        # Deactivate invalid token
                        token.is_active = False
                        db.commit()
                        
            except Exception as send_error:
                print(f"Failed to send notification: {send_error}")
                continue
        
        return {"success": True, "results": results}
        
    except Exception as e:
        print(f"Error sending push notification: {e}")
        return {"success": False, "error": str(e)}

def send_bulk_notifications(
    db: Session,
    user_ids: list[str],
    title: str,
    body: str,
    data: dict = None
) -> dict:
    """
    Send push notification to multiple users at once
    More efficient for broadcasting to many users
    """
    try:
        # Get all active tokens for specified users
        tokens = db.query(PushToken).filter(
            PushToken.user_id.in_(user_ids),
            PushToken.is_active == True
        ).all()
        
        if not tokens:
            return {"success": False, "message": "No active push tokens"}
        
        # Build batch payload
        messages = []
        for token in tokens:
            messages.append({
                "to": token.expo_push_token,
                "title": title,
                "body": body,
                "data": data or {},
                "sound": "default",
                "priority": "high"
            })
        
        # Send batch request to Expo
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=messages,
            timeout=10
        )
        
        return {"success": True, "sent": len(messages), "results": response.json()}
        
    except Exception as e:
        return {"success": False, "error": str(e)}
```

---

### Step 3: Integrate Notifications into Existing Routers

**Example: Vehicle Assignment** (`backend/app/routers/assignments.py`)

```python
from .push_notifications import send_push_notification

@router.post("/assign")
async def assign_vehicle(
    assignment_data: AssignmentCreate,
    db: Session = Depends(get_db)
):
    # ... existing assignment logic ...
    
    # NEW: Send push notification
    send_push_notification(
        db=db,
        user_id=assignment.driver_id,
        title="New Vehicle Assignment",
        body=f"Vehicle {vehicle.license_plate} has been assigned to you",
        data={
            "type": "assignment",
            "assignment_id": assignment.id,
            "vehicle_id": vehicle.id
        }
    )
    
    return assignment
```

**Example: Leave Request Approval** (`backend/app/routers/leave_requests.py`)

```python
@router.patch("/{request_id}/approve")
async def approve_leave_request(
    request_id: str,
    db: Session = Depends(get_db)
):
    # ... existing approval logic ...
    
    # Send notification to employee
    send_push_notification(
        db=db,
        user_id=leave_request.employee_id,
        title="Leave Request Approved ✅",
        body=f"Your leave request for {leave_request.leave_days} days has been approved",
        data={
            "type": "leave_approved",
            "request_id": request_id
        }
    )
    
    return leave_request
```

---

### Step 4: Add to FastAPI Main App

**File:** `backend/app/main.py`

```python
from app.routers import push_notifications

app.include_router(push_notifications.router)
```

---

## 🧪 Testing Push Notifications

### Test 1: Register Token (Automatic)
Just open the mobile app - the token is registered automatically when the app starts.

### Test 2: Send Test Notification (Manual)

**Using curl:**
```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
    "title": "Test Notification",
    "body": "This is a test from backend",
    "data": {"type": "test"}
  }'
```

**Using Python:**
```python
import requests

def test_notification(expo_token: str):
    url = "https://exp.host/--/api/v2/push/send"
    payload = {
        "to": expo_token,
        "title": "🧪 Test Notification",
        "body": "If you see this, push notifications are working!",
        "data": {"type": "test"},
        "sound": "default",
        "priority": "high"
    }
    
    response = requests.post(url, json=payload)
    print(response.json())

# Get token from database and test
token = "ExponentPushToken[xxxxx]"  # From your database
test_notification(token)
```

---

## 📊 Notification Types & Data Structure

| Event | Title | Body | Data |
|-------|-------|------|------|
| **Vehicle Assignment** | "New Vehicle Assignment" | "Vehicle ABC123 assigned to you" | `{"type": "assignment", "vehicle_id": "123"}` |
| **Leave Approved** | "Leave Request Approved ✅" | "Your 3-day leave has been approved" | `{"type": "leave_approved", "request_id": "456"}` |
| **Leave Rejected** | "Leave Request Declined ❌" | "Your leave request was not approved" | `{"type": "leave_rejected", "request_id": "456"}` |
| **Passport Return** | "Passport Return Reminder" | "Please return passport by [date]" | `{"type": "passport_return", "handover_id": "789"}` |
| **Payment Settlement** | "Payment Processed" | "AED 1,500 settlement completed" | `{"type": "settlement", "settlement_id": "321"}` |
| **Job Card** | "Vehicle Maintenance Required" | "Vehicle ABC123 needs service" | `{"type": "job_card", "vehicle_id": "123"}` |

---

## 🚨 Error Handling

Common Expo Push errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `DeviceNotRegistered` | Token expired/invalid | Deactivate token in database |
| `InvalidCredentials` | Malformed token | Remove token from database |
| `MessageTooBig` | Notification exceeds 4KB | Reduce message size |
| `MessageRateExceeded` | Sending too fast | Implement rate limiting |

---

## 📈 Production Considerations

### 1. Rate Limits
- **Expo free tier**: 1,000 notifications/day
- **For higher volume**: Use Expo EAS (paid) or switch to Firebase

### 2. Delivery Tracking
Store notification delivery status:
```python
@router.get("/delivery-status/{notification_id}")
async def check_delivery_status(notification_id: str):
    # Query Expo receipts API
    url = "https://exp.host/--/api/v2/push/getReceipts"
    response = requests.post(url, json={"ids": [notification_id]})
    return response.json()
```

### 3. Analytics
Track notification performance:
- Delivery rate
- Open rate (when user taps notification)
- Opt-out rate

---

## 🎯 Next Steps

1. ✅ Mobile app ready (already integrated)
2. ⏳ Create database table (`push_tokens`)
3. ⏳ Add `/push-tokens/register` endpoint
4. ⏳ Add `send_push_notification()` helper
5. ⏳ Integrate into assignment/leave/settlement routers
6. ⏳ Test with real device

**Estimated Time:** 1-2 hours backend work

---

## 📞 Support

**Expo Push Notification Docs:**
https://docs.expo.dev/push-notifications/overview/

**Test Tool (Send Manual Notification):**
https://expo.dev/notifications

**Your Mobile App:**
- Already configured ✅
- Automatically requests permission ✅
- Sends token to backend ✅
- Handles notification taps ✅
