# MancioTech contact form — Google Apps Script

The **AI services** page at `/services` uses a Google Apps Script web app to send contact requests to `andrea@manciotech.net`. There is **no SMTP password, Gmail password, service-account JSON, or API key in the website**.

The script uses `MailApp.sendEmail` and runs under the Google account that owns/deploys it. Google asks that account to authorize the **Send email as you** permission the first time. The visitors do not need a Google account.

## One-time setup (required)

1. Sign into the **Google account you want to use as the sender** at [script.google.com](https://script.google.com). This account must have access to `MailApp`; it can differ from the receiving `andrea@manciotech.net` mailbox.
2. Create a **New project**, call it `MancioTech contact`, and replace its default `Code.gs` with the complete contents of [Code.gs](./Code.gs).
3. Save. In Apps Script select a function requiring authorization (you may run `authorizeMail` from the editor after adding it temporarily: `function authorizeMail(){ MailApp.getRemainingDailyQuota(); }`), then follow the Google authorization screens. **Do not enter any credentials into the website.** The first real `MailApp.sendEmail` may also trigger a consent prompt during setup, so explicitly grant the required permission before testing public requests.
4. Click **Deploy → New deployment**. Select **Web app**, set **Execute as: Me**, **Who has access: Anyone**, and deploy. Authorize the permissions if asked.
5. Copy the deployment's exact URL ending with `/exec`, such as `https://script.google.com/macros/s/AKfycb.../exec`.
6. Configure your React website build with this environment variable:

   ```env
   REACT_APP_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

   If using a CI/CD build, set this variable **in the build environment**. If building locally, place it in `.env.production.local` (don't commit local environment files). React `REACT_APP_*` variables are embedded at build time; rebuild and deploy Firebase Hosting after setting/changing the URL.
7. Test on `https://manciotech.net/services` with a non-sensitive request. Verify an email arrives at `andrea@manciotech.net`. Replying to the notification should address the visitor.

**Until step 6 is complete, the form intentionally shows a configuration notice and the Send button stays disabled.** This prevents presenting a form that falsely claims to send messages.

### Editing the script later

In Apps Script use **Deploy → Manage deployments → Edit → New version → Deploy** for script changes. Keep the same deployment URL whenever possible. If the URL changes, update the build variable and redeploy the website.

### How sending works

- The React page does a regular HTML POST directly to the Apps Script web app, targeting a hidden iframe. A native POST avoids browser CORS failures from `fetch` to Google.
- Apps Script validates the fields, checks the consent and honeypot, applies a basic 60-second per-email rate limit, and calls `MailApp.sendEmail` addressed to `andrea@manciotech.net`.
- The Apps Script HTML response uses `postMessage` to report success or failure to the website. The frontend accepts acknowledgement only from expected Google origins, with a matching request ID.
- Without confirmation, the page shows an error rather than claiming success. Timeouts can happen after an email has already been sent; advise visitors to avoid immediately resubmitting.

### Privacy and anti-abuse

The endpoint is **public** so anonymous website visitors can submit requests. Only store or transmit data you are comfortable processing with Google's services. No personal data of third parties or confidential documents should be submitted to this public form.

The honeypot and per-email throttle are **basic protections, not a substitute for robust abuse prevention**. Consider CAPTCHA, quotas and monitoring if the form attracts spam. Google MailApp uses the sender's quota. Google limits include approximately 100 recipients/day on a personal Google account and 1,500/day for eligible Workspace accounts, subject to change.

**Important:** Since submissions are public, a hostile actor can bypass browser-side checks, consume sending quota and impersonate email fields. The backend checks inputs but cannot guarantee the sender's identity. Consider a server-side gateway and CAPTCHA if abuse becomes significant.

### Troubleshooting

- **Form unavailable / Send disabled**: the website was built without a valid `REACT_APP_GOOGLE_APPS_SCRIPT_URL` ending in `/exec`.
- **No email / no confirmation**: verify deployment permissions (`Anyone`, `Execute as: Me`), Apps Script authorization, execution logs, account quota, and spam folder. Ensure `ALLOWED_SITE` in the script matches the public origin exactly.
- **20-second timeout**: the hidden iframe may be blocked or the response couldn't send a `postMessage`; check browser console/network and Google Executions. Do not assume the message was not sent.
- **Quota exhausted**: `MailApp.getRemainingDailyQuota()` returns zero; wait until Google resets the account quota.
- **Avoid extra services**: do **not** enable paid Google Cloud services or store private credentials in client-side code.

Sources: [Apps Script Web apps](https://developers.google.com/apps-script/guides/web), [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app), [Google quotas](https://developers.google.com/apps-script/guides/services/quotas).
