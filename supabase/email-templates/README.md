# Email templates

Not version-controlled by Supabase — this project doesn't have a linked
`supabase/config.toml`, so templates are managed manually in the Dashboard.

**Requires custom SMTP first.** Supabase locks template editing until a
custom SMTP provider is configured (Authentication → Emails → SMTP
Settings). Configure Resend as Supabase Auth's custom SMTP; the app does not send confirmation messages directly from the browser.

Recommended Resend SMTP values:

- Host: `smtp.resend.com`
- Port: `465` with SSL (or `587` with STARTTLS)
- Username: `resend`
- Password: a Resend API key with sending permission
- Sender: `Conexão Circular <contato@conexaocircular.com.br>`

Keep click/open tracking disabled for Auth emails so confirmation links remain one-time and intact. The current Resend domain must also pass DKIM and both SPF CNAME checks before production delivery.

For each template below: Dashboard → Authentication → Emails → Templates →
pick the entry → set the subject → paste the file's body into the editor.

| File | Template entry | Subject |
|---|---|---|
| `confirm-signup.html` | Confirm sign up | Confirme seu e-mail — Conexão Circular |
| `invite-user.html` | Invite user | Você foi convidado para a Conexão Circular |
| `magic-link.html` | Magic link or OTP | Seu link de acesso — Conexão Circular |
| `change-email.html` | Change email address | Confirme seu novo e-mail — Conexão Circular |
| `reset-password.html` | Reset password | Redefinir sua senha — Conexão Circular |
| `reauthentication.html` | Reauthentication | Seu código de confirmação — Conexão Circular |

Keep this file in sync manually if a template changes in the Dashboard.
