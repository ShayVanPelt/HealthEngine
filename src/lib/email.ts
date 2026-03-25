/**
 * Email service — uses Resend in production, console mock in dev.
 *
 * To enable Resend:
 *   1. npm install resend (already done)
 *   2. Set RESEND_API_KEY and RESEND_FROM_EMAIL in .env
 *   3. Verify your domain in the Resend dashboard and add the DNS records
 *
 * Domain verification DNS records (add to your DNS provider):
 *   - TXT  @ / resend._domainkey   (DKIM)
 *   - TXT  @                        (SPF)
 *   - CNAME tracking                (optional open/click tracking)
 * All records are shown in Resend dashboard → Domains → your domain.
 */

interface SendVerificationEmailOptions {
  to: string;
  code: string;
}

export async function sendVerificationEmail({
  to,
  code,
}: SendVerificationEmailOptions): Promise<void> {
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    // ── Resend ────────────────────────────────────────────────────────
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: 'Your HealthEngine sign-in code',
      text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, you can safely ignore this email.`,
    });
    return;
  }

  // ── Mock mailer (development) ─────────────────────────────────────
  console.log('\n========================================');
  console.log('  MOCK EMAIL — Verification Code');
  console.log('========================================');
  console.log(`  To:   ${to}`);
  console.log(`  Code: ${code}`);
  console.log('  (expires in 10 minutes)');
  console.log('========================================\n');
}
