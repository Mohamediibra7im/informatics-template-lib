import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const from = process.env.SMTP_FROM || "CP-Base <noreply@cp-base.net>";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://cp-base.vercel.app");

function wrap(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
</head>

<body style="margin:0;padding:0;background:#06141B;color:#CCD0CF;font-family:'Courier New',monospace">
    <div style="max-width:600px;margin:0 auto;padding:32px 24px">
        <div style="border:1px solid #9BA8AB;padding:16px 20px;margin-bottom:24px;background:#11212D">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span style="color:#9BA8AB;font-weight:bold;font-size:14px">CP-Base</span>
                <span style="color:#555;font-size:11px">// mainframe notification</span>
            </div>
            <h2 style="color:#9BA8AB;margin:0;font-size:18px">${title}</h2>
        </div>
        <div style="border:1px solid #333;padding:20px;background:#111;font-size:14px;line-height:1.7">
            ${body}
        </div>
        <div style="margin-top:20px;text-align:center;font-size:11px;color:#555">
            <a href="${baseUrl}" style="color:#9BA8AB;text-decoration:none">cp-base</a>
            <span style="margin:0 8px">|</span>
            <span>Automated system notification</span>
        </div>
    </div>
</body>
</html>`;
}

export async function sendApprovalEmail(
  to: string,
  contributorName: string,
  templateTitle: string,
  templateSlug: string,
  type: "new" | "edit"
) {
  const action = type === "new" ? "new template submission" : "edit request";
  const link = `${baseUrl}/template/${templateSlug}`;

  const html = wrap(
    "Contribution Approved",
    `<p>Hey <strong style="color:#9BA8AB">${contributorName}</strong>,</p>
    <p>Your ${action} for <strong>"${templateTitle}"</strong> has been <span style="color:#9BA8AB;font-weight:bold">approved</span> and is now live on CP-Base.</p>
    <p style="margin-top:16px">
      <a href="${link}" style="display:inline-block;padding:8px 20px;border:1px solid #9BA8AB;color:#9BA8AB;text-decoration:none;font-weight:bold;font-size:12px;letter-spacing:1px">[ VIEW TEMPLATE ]</a>
    </p>
    <p style="color:#888;font-size:12px;margin-top:20px">Thanks for contributing to the CP community!</p>`
  );

  await transporter.sendMail({
    from,
    to,
    subject: `[CP-Base] Your ${action} was approved!`,
    html,
  });
}

export async function sendRejectionEmail(
  to: string,
  contributorName: string,
  templateTitle: string,
  adminNote?: string
) {
  const noteBlock = adminNote
    ? `<div style="border-left:3px solid #ef4444;padding:8px 12px;margin:12px 0;background:#11212D">
        <span style="color:#ef4444;font-size:11px;font-weight:bold">ADMIN NOTE:</span>
        <p style="margin:4px 0 0;color:#ccc">${adminNote}</p>
      </div>`
    : "";

  const html = wrap(
    "Contribution Not Accepted",
    `<p>Hey <strong style="color:#ef4444">${contributorName}</strong>,</p>
    <p>Your submission for <strong>"${templateTitle}"</strong> was <span style="color:#ef4444;font-weight:bold">not accepted</span> at this time.</p>
    ${noteBlock}
    <p style="color:#888;font-size:12px;margin-top:16px">Feel free to revise and resubmit. We appreciate your effort!</p>`
  );

  await transporter.sendMail({
    from,
    to,
    subject: `[CP-Base] Update on your submission "${templateTitle}"`,
    html,
  });
}

export async function sendVerificationEmail(
  to: string,
  username: string,
  code: string
) {
  const html = wrap(
    "Verify Your Email",
    `<p>Welcome to <strong style="color:#9BA8AB">CP-Base</strong>, ${username}!</p>
    <p>Please verify your email address to activate your account. Use the following 6-digit verification code:</p>
    <div style="margin:24px 0;text-align:center">
      <span style="display:inline-block;padding:12px 32px;background:#11212D;border:2px solid #9BA8AB;color:#9BA8AB;font-size:24px;font-weight:bold;letter-spacing:4px">${code}</span>
    </div>
    <p style="font-size:12px;color:#888">This code will expire in 1 hour. If you did not sign up for this account, please ignore this email.</p>`
  );

  await transporter.sendMail({
    from,
    to,
    subject: `[CP-Base] Email Verification Code: ${code}`,
    html,
  });
}
