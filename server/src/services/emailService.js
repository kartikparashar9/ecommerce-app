const nodemailer = require("nodemailer");

// =====================================================
// ENVIRONMENT
// =====================================================

const SMTP_USER = process.env.EMAIL_USER || process.env.SMTP_USER || "";

const SMTP_PASSWORD =
  process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || "";

const FROM_EMAIL = process.env.EMAIL_FROM || SMTP_USER;

const FROM_NAME = process.env.EMAIL_FROM_NAME || "E-Commerce Store";

// =====================================================
// EMAIL CONFIGURATION CHECK
// =====================================================

const isEmailConfigured = () => {
  return Boolean(SMTP_USER && SMTP_PASSWORD && FROM_EMAIL);
};

// =====================================================
// TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },

  requireTLS: true,

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

// =====================================================
// VERIFY TRANSPORT
// =====================================================

const verifyEmailTransport = async () => {
  try {
    if (!isEmailConfigured()) {
      console.warn(
        "Email service is not configured. Check EMAIL_USER and EMAIL_PASSWORD.",
      );

      return false;
    }

    await transporter.verify();

    console.log("Email transporter is ready");

    return true;
  } catch (error) {
    console.error("Email transporter verification failed:", error.message);

    return false;
  }
};

// =====================================================
// GENERIC SEND EMAIL
// =====================================================

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  if (!subject) {
    throw new Error("Email subject is required");
  }

  if (!isEmailConfigured()) {
    throw new Error("Email service is not configured");
  }

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    console.log("EMAIL: sendMail started");

    const info = await transporter.sendMail(mailOptions);

    console.log("EMAIL: sendMail completed");

    console.log(`Email sent successfully to ${to}`);

    return info;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

// =====================================================
// GENERIC NOTIFICATION EMAIL
// =====================================================

const sendNotificationEmail = async ({
  to,
  recipientName = "Customer",
  title,
  message,
  type = "general",
  senderName = "Admin",
}) => {
  if (!to) {
    throw new Error("Notification recipient email is required");
  }

  if (!title) {
    throw new Error("Notification title is required");
  }

  if (!message) {
    throw new Error("Notification message is required");
  }

  const safeName = String(recipientName || "Customer");

  const safeTitle = String(title);

  const safeMessage = String(message);

  const safeSender = String(senderName || "Admin");

  const safeType = String(type || "general");

  // ===================================================
  // PLAIN TEXT EMAIL
  // ===================================================

  const text = `
Hello ${safeName},

You have received a new notification from ${safeSender}.

Subject:
${safeTitle}

Message:
${safeMessage}

Notification type:
${safeType}

Regards,
${FROM_NAME}
`.trim();

  // ===================================================
  // HTML EMAIL
  // ===================================================

  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />

    <title>${safeTitle}</title>
</head>

<body
    style="
        margin:0;
        padding:0;
        background:#f5f7fb;
        font-family:Arial,Helvetica,sans-serif;
        color:#172033;
    "
>
    <div
        style="
            max-width:640px;
            margin:40px auto;
            padding:20px;
        "
    >
        <div
            style="
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:16px;
                padding:32px;
                box-shadow:0 8px 30px rgba(15,23,42,.06);
            "
        >

            <div
                style="
                    margin-bottom:24px;
                    font-size:14px;
                    color:#64748b;
                    font-weight:600;
                "
            >
                ${FROM_NAME}
            </div>

            <h1
                style="
                    margin:0 0 10px;
                    font-size:24px;
                    line-height:1.3;
                    color:#0f172a;
                "
            >
                ${safeTitle}
            </h1>

            <p
                style="
                    margin:0 0 24px;
                    color:#64748b;
                    font-size:14px;
                "
            >
                Hello ${safeName},
            </p>

            <div
                style="
                    padding:18px;
                    background:#f8fafc;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                    white-space:pre-wrap;
                    line-height:1.7;
                    font-size:15px;
                    color:#334155;
                "
            >
                ${safeMessage}
            </div>

            <div
                style="
                    margin-top:24px;
                    padding-top:18px;
                    border-top:1px solid #e5e7eb;
                    font-size:13px;
                    color:#64748b;
                "
            >
                Notification type:
                <strong>${safeType}</strong>
            </div>

            <div
                style="
                    margin-top:10px;
                    font-size:13px;
                    color:#64748b;
                "
            >
                Sent by ${safeSender}
            </div>

            <div
                style="
                    margin-top:24px;
                    font-size:13px;
                    color:#94a3b8;
                "
            >
                Regards,<br />
                ${FROM_NAME}
            </div>

        </div>
    </div>
</body>

</html>
`.trim();

  return sendEmail({
    to,
    subject: safeTitle,
    text,
    html,
  });
};

// =====================================================
// EMAIL OTP
// =====================================================

const sendEmailOTP = async ({ to, otp }) => {
  if (!to) {
    throw new Error("OTP recipient email is required");
  }

  if (!otp) {
    throw new Error("OTP is required");
  }

  const text = `
Your verification OTP is: ${otp}

This OTP will expire shortly.

If you did not request this OTP, please ignore this email.
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />
</head>

<body
    style="
        margin:0;
        padding:30px;
        background:#f5f7fb;
        font-family:Arial,Helvetica,sans-serif;
    "
>
    <div
        style="
            max-width:520px;
            margin:auto;
            background:#ffffff;
            padding:30px;
            border-radius:14px;
        "
    >

        <h2>
            Email Verification
        </h2>

        <p>
            Your verification OTP is:
        </p>

        <div
            style="
                font-size:32px;
                font-weight:700;
                letter-spacing:8px;
                margin:25px 0;
            "
        >
            ${otp}
        </div>

        <p>
            This OTP will expire shortly.
        </p>

        <p>
            If you did not request this OTP,
            please ignore this email.
        </p>

    </div>
</body>

</html>
`.trim();

  return sendEmail({
    to,
    subject: "Email Verification OTP",
    text,
    html,
  });
};

// =====================================================
// SELLER APPROVAL EMAIL
// =====================================================

const sendSellerApprovalEmail = async ({ to, sellerName, businessName }) => {
  const name = sellerName || "Seller";

  const business = businessName || "Your Business";

  const text = `
Hello ${name},

Your seller application for ${business} has been approved.

You can now access seller features.

Regards,
${FROM_NAME}
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />
</head>

<body
    style="
        margin:0;
        padding:30px;
        background:#f5f7fb;
        font-family:Arial,Helvetica,sans-serif;
    "
>
    <div
        style="
            max-width:620px;
            margin:auto;
            background:#ffffff;
            padding:32px;
            border-radius:16px;
        "
    >

        <h2>
            Seller Application Approved
        </h2>

        <p>
            Hello ${name},
        </p>

        <p>
            Your seller application for
            <strong>${business}</strong>
            has been approved.
        </p>

        <p>
            You can now access seller features.
        </p>

        <p>
            Regards,<br />
            ${FROM_NAME}
        </p>

    </div>
</body>

</html>
`.trim();

  return sendEmail({
    to,
    subject: "Your Seller Application Has Been Approved",
    text,
    html,
  });
};

// =====================================================
// SELLER REJECTION EMAIL
// =====================================================

const sendSellerRejectionEmail = async ({
  to,
  sellerName,
  businessName,
  reason = "",
}) => {
  const name = sellerName || "Seller";

  const business = businessName || "Your Business";

  const cleanReason = String(reason || "").trim();

  const text = `
Hello ${name},

Your seller application for ${business} has been rejected.

${cleanReason ? `Reason: ${cleanReason}` : ""}

You may submit your seller details again if permitted.

Regards,
${FROM_NAME}
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />
</head>

<body
    style="
        margin:0;
        padding:30px;
        background:#f5f7fb;
        font-family:Arial,Helvetica,sans-serif;
    "
>
    <div
        style="
            max-width:620px;
            margin:auto;
            background:#ffffff;
            padding:32px;
            border-radius:16px;
        "
    >

        <h2>
            Seller Application Update
        </h2>

        <p>
            Hello ${name},
        </p>

        <p>
            Your seller application for
            <strong>${business}</strong>
            has been rejected.
        </p>

        ${
          cleanReason
            ? `
                <p>
                    <strong>Reason:</strong>
                    ${cleanReason}
                </p>
            `
            : ""
        }

        <p>
            You may submit your seller details again
            if permitted.
        </p>

        <p>
            Regards,<br />
            ${FROM_NAME}
        </p>

    </div>
</body>

</html>
`.trim();

  return sendEmail({
    to,
    subject: "Seller Application Update",
    text,
    html,
  });
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  transporter,
  verifyEmailTransport,
  isEmailConfigured,
  sendEmail,
  sendEmailOTP,
  sendNotificationEmail,
  sendSellerApprovalEmail,
  sendSellerRejectionEmail,
};
