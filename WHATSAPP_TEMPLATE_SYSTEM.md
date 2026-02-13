# WhatsApp Template System Documentation

## Overview

The WhatsApp template system provides structured, reusable message templates for member communications including approval notifications, OTP verification, and registration welcome messages. Each template is language-aware and includes metadata about its structure.

## Template Structure

Each template contains:

```typescript
{
  id: string;                    // Unique identifier (e.g., 'approval_en')
  name: string;                  // Display name
  language: string;              // Language code ('en' or 'ur')
  type: 'approval' | 'otp' | 'registration' | 'custom';
  content: {
    file?: {                      // Optional file (document/image/video/audio)
      type: string;
      url?: string;
      caption?: string;
    };
    text: string;                 // Main message text (supports {{variables}})
    button?: {                    // Optional button
      type: 'url' | 'phone' | 'quick_reply';
      text: string;
      payload?: string;
    };
  };
  description?: string;           // Template description
  createdAt: string;
}
```

## Available Templates

### 1. Approval Templates

Sent when a member is approved by admin.

#### approval_en (English)
- **When**: Member status changed to 'approved'
- **Content**: Congratulation message with membership ID and card download CTA
- **File**: Membership card PDF attachment
- **Button**: View Dashboard button

#### approval_ur (Urdu)
- **When**: Member status changed to 'approved'
- **Content**: Same as English but in Urdu
- **File**: Membership card PDF
- **Button**: Dashboard button in Urdu

### 2. OTP Templates

Sent for card download verification when member hasn't been pre-approved.

#### otp_en (English)
- **When**: Member attempts to download card before approval
- **Content**: OTP code with 5-minute expiry warning
- **Variables**: `{{otp_code}}`, `{{membership_id}}`
- **Button**: Quick reply "Got it"

#### otp_ur (Urdu)
- **When**: Member attempts to download card before approval
- **Content**: Same as English in Urdu
- **Variables**: Same as English
- **Button**: Quick reply in Urdu

### 3. Registration Templates

Sent when a new member registers.

#### registration_en (English)
- **When**: Member completes registration form
- **Content**: Welcome message explaining approval process
- **Button**: Check Status button

#### registration_ur (Urdu)
- **When**: Member completes registration form
- **Content**: Same as English in Urdu
- **Button**: Status check button in Urdu

## API Endpoints

### Get All Templates

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
    "registration": [...]
  }
}
```

### Get Templates by Type

```http
GET /whatsapp/templates/:type
```

**Parameters:**
- `type`: 'approval', 'otp', or 'registration'

**Response:**
```json
{
  "success": true,
  "type": "approval",
  "templates": [...]
}
```

### Send Approval Notification

```http
POST /whatsapp/notify-approval
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "923176227245",
  "membership_id": "MSL2026-01",
  "card_url": "http://localhost:3001/uploads/card-123.pdf",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "template": "approval_en",
  "textResult": {...},
  "mediaResult": {...}
}
```

### Send OTP

```http
POST /whatsapp/send-otp
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "923176227245",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "template": "otp_en",
  "result": {...}
}
```

### Send Registration Welcome

```http
POST /whatsapp/send-registration
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "923176227245",
  "member_name": "John Doe",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "template": "registration_en",
  "result": {...}
}
```

## Template Variables

Templates support variable substitution using `{{variable_name}}` syntax:

### Approval Template Variables
- `{{membership_id}}` - Member's membership ID

### OTP Template Variables
- `{{otp_code}}` - Generated 6-digit OTP code
- `{{membership_id}}` - Member's membership ID

### Registration Template Variables
- `{{member_name}}` - Member's full name

## Usage Examples

### From Admin Dashboard (Approval)

```typescript
// When admin approves a member
const notifyResp = await fetch('http://localhost:3001/whatsapp/notify-approval', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: member.whatsapp_number,
    membership_id: member.membership_id,
    card_url: uploadedCardUrl,
    language: 'en'  // or 'ur'
  })
});

const result = await notifyResp.json();
console.log(`Sent template: ${result.template}`);
// Output: "Sent template: approval_en"
```

### From Member Card Download (OTP)

```typescript
// When member attempts to download before approval
const otpResp = await fetch('http://localhost:3001/whatsapp/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: member.whatsapp_number,
    language: 'en'  // or 'ur'
  })
});

const result = await otpResp.json();
console.log(`OTP template: ${result.template}`);
// Output: "OTP template: otp_en"
```

### From Registration (Welcome)

```typescript
// When member registers
const welcomeResp = await fetch('http://localhost:3001/whatsapp/send-registration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: formData.whatsapp_number,
    member_name: formData.full_name,
    language: 'en'  // or 'ur'
  })
});

const result = await welcomeResp.json();
console.log(`Welcome template: ${result.template}`);
// Output: "Welcome template: registration_en"
```

## Console Logging

The system provides detailed console logging for debugging:

```
✅ Approval: Sending template [approval_en] to 923176227245
📄 Approval: Sending card (media) for template [approval_en]

📱 OTP: Sending template [otp_en] to 923176227245

📝 Registration: Sending template [registration_en] to 923176227245

❌ OTP send failed [otp_en]: Error details...
```

## Environment Configuration

Required environment variables:

```env
WHATSAPP_TOKEN=your_bearer_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
GRAPH_API_VERSION=v17.0
PORT=3001
```

## Language Support

Current supported languages:
- **en** - English
- **ur** - Urdu

To add a new language:
1. Create new template definitions for each type (approval, otp, registration)
2. Use language code (e.g., 'fr' for French) in template ID
3. Pass language parameter in API requests

Example: For French support, create `approval_fr`, `otp_fr`, `registration_fr` templates.

## Template Customization

To modify template content:

1. **Server Templates** (`server.js`):
   - Edit template text in `/whatsapp/templates` or `/whatsapp/templates/:type` endpoints
   - Update in both places to keep in sync

2. **Frontend Templates** (`GenerateCard.tsx`, `Admin.tsx`):
   - These call the API endpoints, which return templates
   - Modify messages on the server, not client

3. **Database Storage** (Optional):
   - Current templates are in-memory on server
   - For production, consider storing in database for dynamic management

## Best Practices

1. **Always include language parameter** when calling endpoints
2. **Use template IDs** in logs for debugging: `console.log('Template:', result.template)`
3. **Test with both languages** before deployment
4. **Keep template text concise** for better WhatsApp display
5. **Use emojis sparingly** for international compatibility
6. **Store API credentials** in environment variables, never hardcode
7. **Log template info** for audit trails and troubleshooting

## Testing Templates

### Test Approval Template
```bash
curl -X POST http://localhost:3001/whatsapp/notify-approval \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "923176227245",
    "membership_id": "MSL2026-TEST",
    "language": "en"
  }'
```

### Test OTP Template
```bash
curl -X POST http://localhost:3001/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "923176227245",
    "language": "en"
  }'
```

### Test Registration Template
```bash
curl -X POST http://localhost:3001/whatsapp/send-registration \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "923176227245",
    "member_name": "John Doe",
    "language": "en"
  }'
```

### View All Templates
```bash
curl http://localhost:3001/whatsapp/templates
```

## Troubleshooting

### Template not sent?
- Check server logs for `Sending template [template_id]` messages
- Verify WHATSAPP_TOKEN is valid
- Check phone number format (should be international: 92xxxxxxxxxx)

### Wrong language sent?
- Verify language parameter is passed: `"language": "ur"` or `"language": "en"`
- Check server logs for which template was used: `[approval_en]` vs `[approval_ur]`

### Missing template name?
- API response should include `"template": "template_id"`
- Check network response in browser DevTools
- Server might not be returning template info in response

## Future Enhancements

1. Store templates in Supabase for dynamic management
2. Admin UI to edit templates
3. Template preview before sending
4. A/B testing for different message variants
5. Personalization with member data
6. Scheduled bulk sending
7. Delivery/read receipts tracking

