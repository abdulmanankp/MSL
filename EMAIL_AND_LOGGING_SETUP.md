# Email & Logging System Setup

## Installation

### 1. Install nodemailer dependency

```bash
npm install nodemailer
```

## Configuration

### Email Setup (SMTP)

Add these to your `.env` file:

```env
# Email Configuration (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@mslpakistan.org
SMTP_PASS=your_email_password_here
```

**Note:** Replace `your_email_password_here` with your actual Hostinger email password.

### Verify SMTP Credentials

1. Login to your [Hostinger Account](https://www.hostinger.com)
2. Go to Email > Your Email Address
3. Get your SMTP credentials:
   - **Host:** smtp.hostinger.com
   - **Port:** 465 (SSL)
   - **Username:** your_email@domain.com
   - **Password:** Your email password

## Features Implemented

### 1. Email Services

#### Registration Email on Signup
- **Endpoint:** `POST /send-registration-email`
- **Sends:** Welcome email when member registers
- **Includes:** Registration confirmation, next steps, contact info
- **Body:**
  ```json
  {
    "email": "member@example.com",
    "full_name": "John Doe"
  }
  ```

#### Approval Email on Status Change
- **Endpoint:** `POST /send-approval-email`
- **Sends:** Approval notification when admin approves membership
- **Includes:** Membership ID, status, card download instructions
- **Body:**
  ```json
  {
    "email": "member@example.com",
    "full_name": "John Doe",
    "membership_id": "MSL-001"
  }
  ```

#### Auto-send on Member Approval
- Modified `POST /whatsapp/notify-approval` to also send approval email
- **Body:**
  ```json
  {
    "phone": "+923001234567",
    "membership_id": "MSL-001",
    "email": "member@example.com",
    "full_name": "John Doe",
    "language": "en"
  }
  ```

### 2. Logging System

Logs are automatically created in `/logs` directory:

- **main.log** - All application logs (info, warn, error)
- **errors.log** - Error logs only

#### Usage in Code

```javascript
import { logInfo, logError, logWarn } from './server/logger.js';

logInfo('Operation successful', { operationId: '123' });
logError('Operation failed', error);
logWarn('Warning message', { context: 'data' });
```

#### Log Format

```
[2026-02-06T10:30:45.123Z] [INFO] Message description | {"data": "value"}
[2026-02-06T10:30:46.456Z] [ERROR] Error description | {"message": "...", "stack": "..."}
```

#### Get Recent Logs via API

```bash
# Example: Get last 100 lines from main.log
curl http://localhost:3001/logs/recent
```

## Integration with Frontend

### When Member Registers

Add this to your registration form submission (in `JoinUsForm.tsx` or similar):

```javascript
// After successful member registration via Supabase
const response = await fetch('http://localhost:3001/send-registration-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: memberData.email,
    full_name: memberData.full_name
  })
});

if (response.ok) {
  console.log('Registration email sent successfully');
}
```

### When Member is Approved

Add this to your admin approval workflow (in `Admin.tsx`):

```javascript
// After marking member as approved
const response = await fetch('http://localhost:3001/send-approval-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: memberData.email,
    full_name: memberData.full_name,
    membership_id: memberData.membership_id
  })
});

if (response.ok) {
  console.log('Approval email sent successfully');
}
```

## Email Templates

### Registration Email Includes:
- Welcome message
- Registration confirmation
- Status update requirements
- Contact information
- Professional branding

### Approval Email Includes:
- Congratulations message
- Membership ID
- Effective date
- Card download instructions
- Next steps
- Contact information

## Monitoring

### View Logs

```bash
# Check main log in production
tail -f logs/main.log

# Check error log
tail -f logs/errors.log

# Get last 50 lines
tail -50 logs/main.log
```

### Log Examples

```
[2026-02-06T10:30:45.123Z] [INFO] 🚀 Server running on http://localhost:3001
[2026-02-06T10:30:46.456Z] [INFO] 📧 Registration email sent | {"to":"user@example.com","messageId":"<123@localhost>"}
[2026-02-06T10:30:47.789Z] [INFO] 📧 Approval email sent | {"to":"user@example.com","membershipId":"MSL-001"}
[2026-02-06T10:30:48.012Z] [ERROR] Failed to send registration email | {"message":"ECONNREFUSED","stack":"..."}
```

## Troubleshooting

### Email Not Sending

**Error:** `ECONNREFUSED`
- **Solution:** Check SMTP credentials in `.env`
- Verify email/password are correct
- Ensure port 465 is open on your network

**Error:** `Invalid login`
- **Solution:** Check username/password
- Try resetting password in Hostinger
- Ensure email account is active

### Logs Not Created

**Error:** Logs folder missing
- **Solution:** Server will auto-create `/logs` on first run
- Check file permissions if manually created

### SMTP Connection Timeout

- **Solution:** Test connection with these settings:
  ```bash
  telnet smtp.hostinger.com 465
  ```

## Production Deployment

1. Update `.env` with production SMTP credentials
2. Ensure logs directory is writable
3. Monitor `/logs/errors.log` for issues
4. Set up log rotation if logs grow too large

## Files Added/Modified

### New Files:
- `/server/logger.js` - Logging utility
- `/server/emailService.js` - Email sending service
- `/logs/` - Logs directory (auto-created)

### Modified Files:
- `/.env` - Added SMTP configuration
- `/server.js` - Added logging and email integration
- `/package.json` - Add node mailer dependency

## Security Notes

- Keep `SMTP_PASS` secure in `.env`
- Don't commit `.env` to repository
- Logs contain sensitive data (emails), keep secure
- Rotate SMTP password periodically
