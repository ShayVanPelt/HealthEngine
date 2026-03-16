/**
 * Email service — currently mocked for local development.
 *
 * To switch to AWS SES:
 *   1. Install: npm install @aws-sdk/client-ses
 *   2. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, SES_FROM_EMAIL in .env
 *   3. Uncomment the SES block below and remove the console.log mock.
 */

interface SendVerificationEmailOptions {
  to: string;
  code: string;
}

export async function sendVerificationEmail({
  to,
  code,
}: SendVerificationEmailOptions): Promise<void> {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.SES_FROM_EMAIL
  ) {
    // ── AWS SES (production) ──────────────────────────────────────────
    // const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
    // const client = new SESClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
    // await client.send(
    //   new SendEmailCommand({
    //     Source: process.env.SES_FROM_EMAIL,
    //     Destination: { ToAddresses: [to] },
    //     Message: {
    //       Subject: { Data: 'Your HealthEngine sign-in code' },
    //       Body: {
    //         Text: {
    //           Data: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, you can safely ignore this email.`,
    //         },
    //       },
    //     },
    //   })
    // );
    // return;
    throw new Error('AWS SES is not yet configured. Uncomment the SES block in src/lib/email.ts');
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
