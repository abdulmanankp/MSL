# WhatsApp Integration - Complete Setup & Template Manager Guide

## Overview

The MSL Pakistan system now includes a complete WhatsApp messaging system with:
- **Automatic WhatsApp notifications** on member approval and registration
- **OTP verification** for card downloads before official approval
- **Template management system** allowing admins to create, edit, and customize message templates
- **Multi-language support** (English and Urdu)
- **Persistent template storage** in JSON files

---

## WhatsApp Configuration

### Required Credentials

You need three WhatsApp credentials from the Meta/Facebook Business dashboard:

1. **WHATSAPP_BUSINESS_ID** - Your WhatsApp Business Account ID
   - Value: `2193069461137001`
   - Location: `.env` file

2. **WHATSAPP_PHONE_NUMBER_ID** - Your WhatsApp Phone Number ID
   - Format: 10-digit number (e.g., `1234567890`)
   - Location: `.env` file
   - Provided by Facebook Business account setup

3. **WHATSAPP_TOKEN** - Your Bearer token for Graph API
   - Format: Long alphanumeric string
   - Location: `.env` file
   - Generated in Meta Developers console

### Setup Steps

1. **Create `.env` file** in project root with:
```env
# WhatsApp Cloud API (Facebook) credentials
WHATSAPP_TOKEN=your_facebook_graph_api_token_here
WHATSAPP_BUSINESS_ID=2193069461137001
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id_here
GRAPH_API_VERSION=v17.0

# Server
PORT=3001
```

2. **Verify your WhatsApp setup**:
   - Visit [Meta Developers Console](https://developers.facebook.com)
   - Go to your app → WhatsApp → API Setup
   - Copy your Phone Number ID and Business Account ID
   - Generate access token with `whatsapp_business_messaging` permission

3. **Test the configuration**:
```bash
# Start the backend server
node server.js

# Test WhatsApp endpoint
curl -X POST http://localhost:3001/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "923176227245",
    "language": "en"
  }'
```

---

## Template Manager - Admin UI

### Accessing Template Manager

1. Log in to **Admin Dashboard** (`/admin`)
2. Click the **Message Square icon** (💬) in the top right header
3. The **WhatsApp Template Manager** dialog will open

### Template Manager Features

#### View Templates by Type

The manager has 4 tabs:
- **Approval** - Sent when member is approved
- **OTP** - Sent for card download verification
- **Registration** - Sent when member registers
- **Custom** - User-created templates

#### Create New Template

1. Click **"New Template"** button
2. Fill in template details:
   - **Template Name** - Display name (e.g., "Member Approved")
   - **Type** - Select from: Approval, OTP, Registration, Custom
   - **Language** - English or اردو (Urdu)
   - **Description** (optional) - Brief description
   - **Message Text** - Main message body
     - Use `{{variable_name}}` for placeholders (e.g., `{{membership_id}}`, `{{otp_code}}`)

3. Click **"Create Template"**

#### Edit Template

1. Find template in appropriate tab
2. Click **"Edit"** button
3. Modify template name, description, or message text
4. Click **"Update Template"**

#### Delete Template

1. Find template in appropriate tab
2. Click **"Delete"** button
3. Confirm deletion

#### Copy Template Text

1. Find template in appropriate tab
2. Click **"Copy Text"** button
3. Template text is copied to clipboard

#### Reset to Defaults

1. Click **"Reset to Defaults"** button in top right
2. Confirm the action
3. All templates revert to default values

---

## Available Templates & Variables

### Approval Templates

Used when admin approves a member. Includes membership card PDF attachment.

#### approval_en (English)
```
✅ *Congratulations!* Your membership with MSL Pakistan has been approved.

Your membership ID: {{membership_id}}
Status: Approved

Download your membership card now to get started.
```

**Variables Available:**
- `{{membership_id}}` - Member's unique ID (e.g., MSL2026-001)

**Attachments:**
- Membership card PDF (generated automatically)

---

#### approval_ur (Urdu)
```
✅ *مبارک ہو!* آپ کی رکنیت MSL Pakistan میں منظور ہو گئی۔

رکنیت ID: {{membership_id}}
حالت: منظور

اپنا رکنیت کارڈ ڈاؤن لوڈ کریں۔
```

**Variables Available:**
- `{{membership_id}}` - Member's membership ID

---

### OTP Templates

Used when member attempts to download card before official approval. OTP is valid for 5 minutes.

#### otp_en (English)
```
🔐 *OTP Verification*

Your One-Time Password (OTP) is: {{otp_code}}

This code will expire in 5 minutes. Do not share this code with anyone.

Membership ID: {{membership_id}}
```

**Variables Available:**
- `{{otp_code}}` - 6-digit OTP code
- `{{membership_id}}` - Member's membership ID

---

#### otp_ur (Urdu)
```
🔐 *ای ٹی پی تصدیق*

آپ کا ایک بار استعمال ہونے والا پاس ورڈ (OTP): {{otp_code}}

یہ کوڈ 5 منٹ میں ختم ہو جائے گا۔ یہ کوڈ کسی سے شیئر نہ کریں۔

رکنیت ID: {{membership_id}}
```

**Variables Available:**
- `{{otp_code}}` - 6-digit OTP code
- `{{membership_id}}` - Member's membership ID

---

### Registration Templates

Sent automatically when a new member completes registration.

#### registration_en (English)
```
👋 *Welcome to MSL Pakistan!*

Thank you for registering with us. Your application is being reviewed.

We'll notify you once your membership is approved.

📧 Questions? Contact us anytime!
```

**Variables Available:**
- None (greeting is generic)

---

#### registration_ur (Urdu)
```
👋 *MSL Pakistan میں خوش آمدید!*

ہمارے ساتھ رجسٹر کرنے کے لیے شکریہ۔ آپ کی درخواست کا جائزہ لیا جا رہا ہے۔

جب آپ کی رکنیت منظور ہو جائے تو ہم آپ کو مطلع کریں گے۔

📧 سوالات؟ کسی بھی وقت ہم سے رابطہ کریں!
```

**Variables Available:**
- None (greeting is generic)

---

## API Endpoints for Template Management

All endpoints are available at `http://localhost:3001/whatsapp/...`

### List All Templates
```http
GET /whatsapp/templates
```

**Response:**
```json
{
  "success": true,
  "templates": {
    "approval": [...],
    "otp": [...],
    "registration": [...],
    "custom": [...]
  },
  "all": {
    "approval_en": {...},
    "approval_ur": {...},
    ...
  }
}
```

### Get Templates by Type
```http
GET /whatsapp/templates/{type}
```

**Path Parameters:**
- `type` - 'approval', 'otp', 'registration', or 'custom'

**Response:**
```json
{
  "success": true,
  "type": "approval",
  "templates": [...]
}
```

### Get Single Template
```http
GET /whatsapp/template/{id}
```

**Path Parameters:**
- `id` - Template ID (e.g., 'approval_en')

### Create New Template
```http
POST /whatsapp/templates
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Custom Template",
  "language": "en",
  "type": "custom",
  "description": "A custom template for testing",
  "content": {
    "text": "Hello {{member_name}}!",
    "file": {
      "type": "image",
      "caption": "Optional caption"
    },
    "button": {
      "type": "url",
      "text": "Click here",
      "payload": "https://example.com"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "custom_en_1739276800000",
    "name": "Custom Template",
    "language": "en",
    "type": "custom",
    ...
  }
}
```

### Update Template
```http
PUT /whatsapp/templates/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Template",
  "description": "Updated description",
  "content": {
    "text": "Updated message text"
  }
}
```

### Delete Template
```http
DELETE /whatsapp/templates/{id}
```

### Reset to Defaults
```http
POST /whatsapp/templates/reset/defaults
```

---

## How Templates Are Used

### On Member Approval

1. Admin clicks "Approve" button in dashboard
2. System automatically:
   - ✅ Generates membership card PDF
   - ✅ Uploads card to server
   - ✅ Retrieves `approval_en` or `approval_ur` template
   - ✅ Substitutes `{{membership_id}}` variable
   - ✅ Sends WhatsApp message with card attachment
   - ✅ Console logs: "✅ Approval: Sending template [approval_en] to 923176227245"

### On Member Registration

When member completes registration form:
1. System retrieves `registration_en` or `registration_ur` template
2. Sends welcome WhatsApp message
3. No variables substituted (generic welcome)
4. Console logs: "📝 Registration: Sending template [registration_en] to 923176227245"

### On Card Download (Pre-Approval)

If member tries to download card before approval:
1. System retrieves `otp_en` or `otp_ur` template
2. Generates random 6-digit OTP code
3. Substitutes `{{otp_code}}` and `{{membership_id}}`
4. Sends OTP via WhatsApp
5. Member enters OTP in modal to download card
6. Console logs: "📱 OTP: Sending template [otp_en] to 923176227245"

---

## Console Logging for Debugging

Look for these messages in server logs to verify template sending:

```
✅ Approval: Sending template [approval_en] to 923176227245
📄 Approval: Sending card (media) for template [approval_en]

📝 Registration: Sending template [registration_en] to 923176227245

📱 OTP: Sending template [otp_en] to 923176227245

❌ OTP send failed [otp_en]: Error details...
❌ Approval send failed: Error details...
```

---

## Storage & Persistence

Templates are stored in: `storage/whatsapp_templates.json`

**Example file structure:**
```json
{
  "approval_en": {
    "id": "approval_en",
    "name": "Membership Approved",
    "language": "en",
    "type": "approval",
    "content": { ... },
    "createdAt": "2025-02-05T10:30:00Z"
  },
  "custom_en_1739276800000": {
    "id": "custom_en_1739276800000",
    "name": "Custom Template",
    "language": "en",
    "type": "custom",
    ...
  }
}
```

To reset to defaults:
1. Delete `storage/whatsapp_templates.json`
2. Restart server
3. Or use "Reset to Defaults" button in Template Manager UI

---

## Troubleshooting

### Templates Not Sending

1. **Check environment variables:**
   ```bash
   echo $WHATSAPP_TOKEN
   echo $WHATSAPP_BUSINESS_ID
   echo $WHATSAPP_PHONE_NUMBER_ID
   ```

2. **Verify WhatsApp is enabled:**
   - Check Admin Dashboard → Settings → "Enable WhatsApp" toggle

3. **Check server logs:**
   ```bash
   node server.js
   # Look for: ✅ or ❌ messages
   ```

4. **Test phone number format:**
   - Must be international format: `92XXXXXXXXXX`
   - Example: `923176227245` (not `03176227245`)

### Wrong Template Being Used

1. Check console logs for template ID: `[approval_en]` vs `[approval_ur]`
2. Verify language parameter in request
3. Confirm template exists in `storage/whatsapp_templates.json`

### Template Variables Not Substituting

1. Check variable names match exactly (case-sensitive)
2. Use `{{variable_name}}` format (double curly braces)
3. Example: `{{otp_code}}` NOT `{otp_code}` or `$otp_code`

### Templates Reset to Defaults

Reasons:
- Server restart with missing `storage/whatsapp_templates.json`
- Admin clicked "Reset to Defaults" button
- Manual deletion of JSON file

**Fix:** Use Template Manager to recreate custom templates or run "Reset to Defaults"

---

## Best Practices

1. **Always test before deployment:**
   - Use Template Manager to create test template
   - Verify it sends via WhatsApp
   - Check console logs for template ID

2. **Use consistent formatting:**
   - Bold: `*text*`
   - Italic: `_text_`
   - Code: `` `text` ``
   - Emojis for quick scans (✅ 🔐 📱 ❌)

3. **Keep messages concise:**
   - WhatsApp has character limits
   - Avoid very long messages
   - Use line breaks for readability

4. **Test both languages:**
   - Create templates in English AND Urdu
   - Test that language parameter correctly selects template

5. **Backup important templates:**
   - Export `storage/whatsapp_templates.json` regularly
   - Keep copies of custom templates

6. **Monitor logs:**
   - Check `[templateId]` in logs to verify correct template sent
   - Look for ❌ errors and address them immediately

---

## Integration with Frontend

### GenerateCard.tsx (Member Download)

When member tries to download before approval:
```typescript
await fetch('http://localhost:3001/whatsapp/send-otp', {
  method: 'POST',
  body: JSON.stringify({
    phone: member.whatsapp_number,
    language: 'en'  // Can be made dynamic
  })
});
```

### Admin.tsx (On Approval)

When admin approves member:
```typescript
await fetch('http://localhost:3001/whatsapp/notify-approval', {
  method: 'POST',
  body: JSON.stringify({
    phone: memberBefore.whatsapp_number,
    card_url: cardUrl,
    membership_id: memberBefore.membership_id,
    language: 'en'  // Can be made dynamic
  })
});
```

---

## Future Enhancements

Potential improvements for WhatsApp integration:

1. **Dynamic language selection** - Let user choose language in UI
2. **Template preview** - Show how message will look before sending
3. **Delivery receipts** - Track when/if messages are delivered
4. **Scheduled sending** - Send messages at specific times
5. **A/B testing** - Try different message variations
6. **Personalization** - Use member data in templates
7. **Bulk messaging** - Send templates to multiple members
8. **Media templates** - Support more file types (video, documents)
9. **Database storage** - Store templates in Supabase instead of JSON
10. **Template categories** - Organize templates by business use case

---

## Support & Questions

For issues or questions about WhatsApp integration:

1. Check server logs for error messages
2. Verify credentials in `.env` file
3. Review this guide's troubleshooting section
4. Test API endpoints using curl or Postman
5. Check Meta Developers console for API status

---

## Quick Reference

| Feature | File | Location |
|---------|------|----------|
| Backend API | `server.js` | Lines 101-115 (helpers), 286-375 (endpoints) |
| Template Manager UI | `WhatsAppTemplateManager.tsx` | `src/components/` |
| Admin Integration | `Admin.tsx` | Lines 40, 182, 684-691 |
| Member OTP | `GenerateCard.tsx` | Lines 120-148 |
| Template Definitions | `whatsappTemplates.ts` | `src/lib/` |
| Template Manager Class | `templateManager.js` | `server/` |
| Templates Storage | `storage/whatsapp_templates.json` | Project root |
| Config | `.env` | Project root |

