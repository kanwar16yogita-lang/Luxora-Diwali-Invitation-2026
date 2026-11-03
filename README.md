# Luxora Diwali Soirée — Royal Rose Edition

New generic-invitation design with a burgundy/plum, antique-gold, blush and ivory palette. No preselected invitee name appears anywhere on the site. All user-visible event wording is in `config.js`.

## Deploy on Vercel

1. Upload the full project folder to a GitHub repository.
2. In https://vercel.com/new import that repository and select **Other** framework, root project directory, no build command, and output directory `.`.
3. Set `APPS_SCRIPT_URL` and `RSVP_SHARED_SECRET` in Vercel project Settings → Environment Variables, then redeploy.
4. Your generic invitation is the site root URL, e.g. `https://your-site.vercel.app/`.

## Connect your Google Sheet

1. Make a new Google Sheet in your account; from its URL copy the long spreadsheet ID between `/d/` and `/edit`.
2. Open Extensions → Apps Script and paste the contents of `google-apps-script.gs`.
3. Edit `SHEET_ID` with your spreadsheet ID. Replace `SHARED_SECRET` with a long random secret kept private.
4. From Apps Script, run `setupSheet()` once and approve permission. Deploy → New deployment → Web app → Execute as **Me**, access **Anyone**. Copy the URL ending `/exec`.
5. Set Vercel environment variables `APPS_SCRIPT_URL` = that URL, `RSVP_SHARED_SECRET` = the same secret. Keep the secret server-side, never place it in `config.js`.

The sheet records visit opens with `Guest (not yet identified)` until someone enters a name via the Yes RSVP form. Yes replies record guest name and phone; No replies are recorded without a name because the generic invite intentionally does not identify the visitor. You cannot reliably identify unopened anonymous guests without unique per-guest links; website tracking also cannot detect views when scripts/network requests are blocked.

The No burn/404 animation starts only after the backend confirms the response was saved. The Yes confetti only fires after save confirmation. The standalone HTML preview simulates saving for demonstration and does **not** write to Google Sheets.

**Date note**: 6 November 2026 is a Friday, not Saturday.
