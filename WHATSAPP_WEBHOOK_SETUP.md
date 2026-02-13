# WhatsApp Cloud API Webhook Setup Guide

This guide explains how to properly configure your WhatsApp Business Cloud API integration with your Node.js application following Facebook's official documentation.

## Overview

Your application now includes:
- ✅ **Webhook Verification Endpoint** (`GET /webhook`) - For Facebook to verify your server
- ✅ **Webhook Handler** (`POST /webhook`) - For receiving incoming WhatsApp messages
- ✅ **Message Sending Functions** - To send text and media messages
- ✅ **Environment Configuration** - Secure token management via `.env`

## Prerequisites

### 1. Meta Developer Account
- Create account at [developers.facebook.com](https://developers.facebook.com)
- Enable two-factor authentication on your account
- Create a Meta App

### 2. WhatsApp Business Account Setup
- Connect your Meta App to WhatsApp product
- Associate your app with a Business Manager account
- Create or configure a System User with app permissions
- Generate an access token from your System User

## Environment Variables

Your `.env` file should contain:

```env
# WhatsApp Cloud API Credentials
WHATSAPP_TOKEN=<YOUR_SYSTEM_USER_ACCESS_TOKEN>
WHATSAPP_PHONE_NUMBER_ID=<YOUR_PHONE_NUMBER_ID>
WHATSAPP_BUSINESS_ID=<YOUR_BUSINESS_ACCOUNT_ID>
GRAPH_API_VERSION=v17.0

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=msl_pakistan_whatsapp_webhook_secret_verify_token
```

**Important:** Replace placeholders with your actual credentials from Meta Business Manager.

## Step 1: Get Your Phone Number ID

1. Go to [Facebook Business Manager](https://business.facebook.com)
2. Navigate to **WhatsApp > Getting Started**
3. Select your phone number
4. Copy the **Phone Number ID** (e.g., `833737016486503`)
5. Add to `.env` as `WHATSAPP_PHONE_NUMBER_ID`

## Step 2: Generate System User Access Token

1. In Business Manager, go to **Settings > System Users**
2. Create a new System User for your app
3. Click the user and select **Generate New Token**
4. Assign all available permissions to your app
5. Copy the token and add to `.env` as `WHATSAPP_TOKEN`

**Note:** Tokens expire! Set reminder to regenerate them periodically.

## Step 3: Configure Webhook in Meta App Dashboard

### Access App Dashboard
1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Select your app
3. Go to **WhatsApp > Configuration**

### Set Webhook URL
1. Find the **Webhook URL** field
2. Enter your webhook endpoint:
   ```
   https://yourdomain.com/webhook
   ```
   
   For **local development** with ngrok:
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 3001
   # This gives you: https://xxxx-xx-xxx-xxx-xx.ngrok-free.app
   # Use: https://xxxx-xx-xxx-xxx-xx.ngrok-free.app/webhook
   ```

### Set Verify Token
1. Find the **Verify Token** field
2. Enter the token from your `.env`:
   ```
   msl_pakistan_whatsapp_webhook_secret_verify_token
   ```

### Subscribe to Webhook Fields
1. Click **Verify and Save**
2. Facebook will call your `GET /webhook` endpoint with parameters:
   - `hub.mode=subscribe`
   - `hub.verify_token=<your_token>`
   - `hub.challenge=<challenge_string>`
3. Your endpoint echoes back the challenge to confirm verification
4. Once verified, select which webhook events to subscribe to:
   - ✅ **messages** - Receive incoming messages
   - ✅ **message_status** - Receive delivery/read receipts
   - ✅ **message_template_status_update** - Template approvals

## Step 4: Test Your Webhook

### Using curl from Terminal

1. **Test webhook verification:**
   ```bash
   curl -X GET "http://localhost:3001/webhook?hub.mode=subscribe&hub.verify_token=msl_pakistan_whatsapp_webhook_secret_verify_token&hub.challenge=test_challenge"
   ```
   
   Expected response: `test_challenge`

2. **Test message sending:**
   ```bash
   curl -X POST http://localhost:3001/whatsapp/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phone":"+923001234567","language":"en"}'
   ```

### Using Postman

1. Create new `POST` request to `http://localhost:3001/whatsapp/send-otp`
2. Set Headers:
   - `Content-Type: application/json`
3. Set Body (raw JSON):
   ```json
   {
     "phone": "+923001234567",
     "language": "en"
   }
   ```
4. Click **Send**

## API Endpoints Available

### Send OTP
```
POST /whatsapp/send-otp
Body: { phone: "+923001234567", language: "en" }
```

### Verify OTP
```
POST /whatsapp/verify-otp
Body: { phone: "+923001234567", code: "123456" }
```

### Notify Approval (Text Message)
```
POST /whatsapp/notify-approval
Body: { 
  phone: "+923001234567", 
  membership_id: "MEMBER123",
  language: "en"
}
```

### Send Registration Notification
```
POST /whatsapp/send-registration
Body: { 
  phone: "+923001234567", 
  member_name: "John Doe",
  language: "en"
}
```

### Check Download Allowance
```
POST /whatsapp/check-download-allowed
Body: { membership_id: "MEMBER123" }
Response: { success: true, allowed: true, downloadsThisWeek: 0, limit: 1 }
```

### Record Download
```
POST /whatsapp/record-download
Body: { membership_id: "MEMBER123" }
```

## Webhook Events Received

Your application now handles:

### Incoming Messages
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "+923001234567",
          "text": { "body": "User message content" }
        }]
      }
    }]
  }]
}
```

### Message Status Updates
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "message_id",
          "status": "delivered|read|failed|sent"
        }]
      }
    }]
  }]
}
```

## Deploying to Production

### 1. Use a Real Domain
Replace `http://localhost:3001` with your actual domain:
- Example: `https://api.mslpakistan.com/webhook`

### 2. Update Environment Variables
In your production server's `.env`:
```env
WHATSAPP_TOKEN=<production_token>
WHATSAPP_PHONE_NUMBER_ID=<production_phone_id>
PORT=3001
WEBHOOK_VERIFY_TOKEN=<secure_random_token>
```

### 3. Update Webhook URL in Meta Dashboard
1. Go to app settings
2. Update Webhook URL to production domain
3. Re-verify with Facebook

### 4. Use HTTPS Only
Facebook requires HTTPS webhooks in production. Ensure:
- Valid SSL certificate
- Webhook URL uses `https://`
- No self-signed certificates (production)

## Troubleshooting

### Webhook Verification Fails
- ✅ Check token matches exactly in `.env` and Meta Dashboard
- ✅ Ensure endpoint is publicly accessible
- ✅ For local testing, use ngrok tunnel
- ✅ Check server logs: `console.log()` statements in webhook handlers

### Messages Not Received
- ✅ Confirm webhook subscribed to `messages` field
- ✅ Test with a real WhatsApp number (test numbers only work initially)
- ✅ Check network connectivity
- ✅ Verify token permissions in System User

### Token Expired
- ✅ Error: `Invalid OAuth token`
- ✅ Solution: Regenerate token in Business Manager > System Users
- ✅ Update `.env` and restart server

### Rate Limiting
- ✅ WhatsApp limit: 60 messages per second per account
- ✅ Implement queue system for bulk sends
- ✅ Add exponential backoff for retries

## Code Examples

### Sending a Message (Backend)
```javascript
const result = await sendWhatsAppText(
  '+923001234567',
  'Hello! This is an automated message.'
);
```

### Handling Incoming Messages
Your webhook POST handler logs all incoming messages. Extend it to:
- Store in database
- Route based on keywords
- Send automated responses
- Update contact lists

## Resources

- [Facebook WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Webhook Events Reference](https://developers.facebook.com/docs/whatsapp/webhooks/incoming)
- [Message Template Reference](https://developers.facebook.com/docs/whatsapp/business-platform/message-templates/guidelines)
- [Official Blog Post](https://developers.facebook.com/blog/post/2022/10/31/sending-messages-with-whatsapp-in-your-nodejs-application/)

## Next Steps

1. ✅ Configure webhook in Meta Dashboard
2. ✅ Test with verification endpoint
3. ✅ Send test OTP message
4. ✅ Verify incoming message handling works
5. 📝 Implement custom business logic in POST webhook handler

## Support

For issues:
1. Check server console logs for error messages
2. Verify all tokens are current in Meta Business Manager  
3. Test endpoints individually with curl/Postman
4. Review Meta's official documentation for API changes
