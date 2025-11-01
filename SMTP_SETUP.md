# SMTP Email Configuration

This application uses SMTP for sending emails (receipt exports, sales reports, etc.).

## Required Secrets

You need to configure the following secrets in the Leap Settings:

1. **SMTPHost** - Your SMTP server hostname (e.g., `smtp.gmail.com`, `smtp.office365.com`)
2. **SMTPPort** - SMTP server port (typically `587` for TLS or `465` for SSL)
3. **SMTPUser** - Your email account username/email address
4. **SMTPPassword** - Your email account password or app-specific password
5. **SMTPFromEmail** - The "from" email address for outgoing emails
6. **SMTPFromName** - The "from" name for outgoing emails (e.g., "My Store POS")

## How to Set Secrets

1. Open the **Settings** page in the Leap sidebar
2. Add each secret with its corresponding value
3. Save the configuration

## Common SMTP Providers

### Gmail
- **SMTPHost**: `smtp.gmail.com`
- **SMTPPort**: `587`
- **SMTPUser**: Your full Gmail address
- **SMTPPassword**: Use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password)
- **SMTPFromEmail**: Your Gmail address
- **SMTPFromName**: Your store name

### Office 365 / Outlook
- **SMTPHost**: `smtp.office365.com`
- **SMTPPort**: `587`
- **SMTPUser**: Your full Office 365 email address
- **SMTPPassword**: Your Office 365 password
- **SMTPFromEmail**: Your Office 365 email address
- **SMTPFromName**: Your store name

### Custom SMTP Server
- Contact your email hosting provider for SMTP settings
- Most providers use port `587` (TLS) or `465` (SSL)
- Ensure SMTP authentication is enabled

## Features Using Email

The following features send emails using this SMTP configuration:

1. **Receipt Export** - Export receipts via email from the Reprint modal
2. **Sales Summary Export** - Export sales reports from the Sales Summary page
3. **Day Closing Report** - Export day closing reports via email

## Testing Email Configuration

After setting up the secrets:

1. Go to **More Menu** → **Reprint**
2. Search for any receipt
3. Click the **Export** button
4. Enter a test email address
5. Click **Send Email**

If configured correctly, the email should be delivered within a few seconds.

## Troubleshooting

### Email not sending
- Verify all secrets are set correctly in Settings
- Check that your SMTP credentials are valid
- Ensure your email provider allows SMTP access
- For Gmail, make sure you're using an App Password
- Check the browser console for error messages

### "Authentication failed" error
- Double-check your SMTPUser and SMTPPassword
- For Gmail, generate a new App Password
- Ensure 2-factor authentication is properly configured

### Emails going to spam
- Configure SPF and DKIM records for your domain
- Use a professional email address (not free providers) for SMTPFromEmail
- Ensure SMTPFromEmail matches your SMTP credentials
