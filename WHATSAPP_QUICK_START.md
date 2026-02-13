# WhatsApp Integration - Quick Checklist & Configuration

## ✅ Pre-Launch Checklist

### 1. Environment Configuration
- [ ] `.env` file contains all required WhatsApp credentials:
  ```env
  WHATSAPP_TOKEN=<TOKEN>
  WHATSAPP_PHONE_NUMBER_ID=<PHONE_ID>
  WHATSAPP_BUSINESS_ID=<BUSINESS_ID>
  GRAPH_API_VERSION=v17.0
  WEBHOOK_VERIFY_TOKEN=<SECURE_TOKEN>
  ```
- [ ] Credentials are from same Business Manager account
- [ ] Token is not expired (check Business Manager > System Users)

### 2. Server Files
- [ ] `server.js` includes webhook endpoints (GET/POST `/webhook`)
- [ ] `server.js` loads `WEBHOOK_VERIFY_TOKEN` from environment
- [ ] Constants at top of `server.js` are correct:
  ```javascript
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
  const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN
  ```

### 3. Meta Dashboard Configuration
- [ ] App is created in [developers.facebook.com](https://developers.facebook.com)
- [ ] WhatsApp product is connected to app
- [ ] Business Manager account is linked
- [ ] Phone number is configured in WhatsApp section
- [ ] System User created with all app permissions
- [ ] Access token generated and stored in `.env`

### 4. Webhook Setup
- [ ] Webhook URL is set in Meta Dashboard (WhatsApp > Configuration)
- [ ] Webhook URL is publicly accessible (not localhost in production)
- [ ] Verify Token matches `.env` value exactly
- [ ] Webhook events subscribed: `messages`, `message_status`

### 5. Testing
- [ ] Server runs without errors: `node server.js`
- [ ] Webhook verification works (test below)
- [ ] Can send OTP message successfully
- [ ] Can receive incoming messages (logs appear)

---

## 🚀 Quick Start - Local Development

### Step 1: Install & Configure
```bash
# Install dependencies
npm install

# Copy environment template and fill credentials
cat > .env << 'EOF'
WHATSAPP_TOKEN=<paste_your_token>
WHATSAPP_PHONE_NUMBER_ID=<paste_phone_id>
WHATSAPP_BUSINESS_ID=<paste_business_id>
GRAPH_API_VERSION=v17.0
WEBHOOK_VERIFY_TOKEN=my_secure_webhook_token
EOF

# Start server
node server.js
```

### Step 2: Setup ngrok Tunnel (for local webhook testing)
```bash
# Install from https://ngrok.com/download
# Then:
ngrok http 3001

# This gives you: https://xxxxx.ngrok-free.app
# Use this URL in Meta Dashboard > Webhook URL field
```

### Step 3: Verify Webhook
```bash
# Test webhook endpoint
curl "http://localhost:3001/webhook?hub.mode=subscribe&hub.verify_token=my_secure_webhook_token&hub.challenge=TEST"

# Expected output: TEST (echoed back)
```

### Step 4: Send Test Message
```bash
# Send OTP (requires valid WhatsApp number with country code)
curl -X POST http://localhost:3001/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+923001234567"}'
```

---

## 📊 API Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/webhook` | GET | Facebook verification challenge |
| `/webhook` | POST | Receive incoming messages |
| `/whatsapp/send-otp` | POST | Send OTP to phone |
| `/whatsapp/verify-otp` | POST | Verify OTP code |
| `/whatsapp/notify-approval` | POST | Send approval notification |
| `/whatsapp/send-registration` | POST | Send registration welcome |
| `/whatsapp/check-download-allowed` | POST | Check weekly download limit |
| `/whatsapp/record-download` | POST | Record member download |

---

## 🔧 Environment Variables Reference

```env
# WhatsApp Cloud API Credentials (from Meta Business Manager)
WHATSAPP_TOKEN=EAAJ4dEc94MEBQSGEaWXsxNWZAcij3FGtXsanlhY48lSPItZA2oZCmaJ0...
  # System User Access Token
  # Location: Business Manager > Settings > System Users > [User] > Tokens
  # Expiration: Set reminder to regenerate regularly

WHATSAPP_PHONE_NUMBER_ID=833737016486503
  # Your WhatsApp Business phone number ID
  # Location: WhatsApp Business Account > Getting Started > Select Phone

WHATSAPP_BUSINESS_ID=2193069461137001
  # Your Business Account ID
  # Location: Business Settings > Account > Identifier

GRAPH_API_VERSION=v17.0
  # Facebook Graph API version (current: v17.0 as of 2024)
  # Check for updates at: developers.facebook.com/docs

WEBHOOK_VERIFY_TOKEN=msl_pakistan_whatsapp_webhook_secret_verify_token
  # Custom token for securing webhook
  # Should be cryptographically secure in production
  # Keep same in .env and Meta Dashboard
```

---

## 🔍 Message Flow Diagram

```
User Action                    Backend                  WhatsApp API
─────────────────────────────────────────────────────────────────
  Register
      │                          │
      ├──POST /join-us────────>  │
      │                          │
      │                    save to DB
      │                          │
      │                          ├──POST /send-registration──>
      │<── Show success ─────────┤                          │
      │                          │<── Message sent ──────────┤
      │                          │
      │                   (WhatsApp notifies:
      │                    incoming message)
      │                          │
      │                          ├──POST /webhook ◄────────┤
      │                    (log incoming msg)
      │
    Admin Approves
      │
      ├──POST /admin/members────>
      │                          │
      │                    update status
      │                          │
      │                          ├──POST /notify-approval──>
      │<── Refresh ────────────<─┤                        │
      │                          │<── Message sent ──────────┤
      │
    User Download Card
      │
      ├──GET /generate-card────>
      │                          │
      │                    check download limit
      │<── Send OTP ◄────────────┤
      │                          ├──POST /send-otp ─────────>
      │                          │                       │
      │                          │<── OTP sent ━━━━━━━━━━━━>
      │
      ├──POST /verify-otp────────>
      │                    validate OTP
      │<── Download link ────────┤
      │                          ├──POST /record-download─>
      │
```

---

## ⚠️ Common Issues & Solutions

### Issue: Webhook Verification Fails
**Error:** `hub.verify_token mismatch`
```
✗ Token in Meta Dashboard ≠ .env WEBHOOK_VERIFY_TOKEN
```
**Solution:**
1. Copy exact token from `.env`
2. Paste into Meta Dashboard
3. No typos or extra spaces

### Issue: Messages Not Sending
**Error:** `Invalid OAuth token`
```
✗ Token expired or invalid
```
**Solution:**
1. Go to Business Manager > System Users
2. Click your system user
3. Generate new token
4. Update `.env` file
5. Restart server

### Issue: Webhook Not Receiving Messages
**Error:** Logs show no incoming messages
```
✗ ngrok tunnel closed or URL not updated
```
**Solution:**
1. Restart ngrok: `ngrok http 3001`
2. Copy new URL
3. Update webhook URL in Meta Dashboard
4. Re-test verification
5. Send message and check logs

### Issue: Rate Limiting
**Error:** Messages fail with 429 status
```
✗ Exceeded 60 msgs/sec rate limit
```
**Solution:**
1. Implement message queue
2. Add exponential backoff
3. Batch messages by time
4. Check Meta rate limits documentation

---

## 📱 Testing Workflow

### Manual Test with Real Number
```bash
# 1. Send OTP
curl -X POST http://localhost:3001/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+923001234567"}'

# 2. Check your phone for WhatsApp message

# 3. Verify OTP
curl -X POST http://localhost:3001/whatsapp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+923001234567","code":"123456"}'

# 4. Record download
curl -X POST http://localhost:3001/whatsapp/record-download \
  -H "Content-Type: application/json" \
  -d '{"membership_id":"MEMBER123"}'
```

### Using Postman
1. Import webhook test collection (create new requests):
   - **GET** `/webhook` with query params
   - **POST** `/whatsapp/send-otp` with JSON body
   - **POST** `/webhook` with webhook event payload

2. Test each endpoint in sequence

3. Verify logs in terminal show processing

---

## 📚 Additional Resources

- [Meta WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Webhook Events Reference](https://developers.facebook.com/docs/whatsapp/webhooks)
- [Sample Code](https://github.com/fbsamples/whatsapp-api-examples)
- [Rate Limits](https://developers.facebook.com/docs/whatsapp/cloud-api/rate-limits)

---

## 🎯 When Everything Works

You'll see in server logs:
```
✅ Webhook verified successfully
📨 Incoming message from +923001234567: "User text"
📊 Message status update: msg_123 - delivered
✅ Message delivered: msg_123
```

And users will:
1. ✅ Receive OTP in WhatsApp
2. ✅ Get approval notifications
3. ✅ Have download limits enforced
4. ✅ See message delivery status in your system

---

**Last Updated:** February 2025
**API Version:** v17.0
**Status:** ✅ Production Ready
