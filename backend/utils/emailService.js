const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const roleLabels = {
  client: 'Client',
  designer: 'Designer',
  developer: 'Développeur',
};

const sendWelcomeEmail = async ({ name, email, password, role }) => {
  const roleLabel = roleLabels[role] || role;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bienvenue sur ProFlow</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1976d2,#42a5f5);padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">ProFlow</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Plateforme de gestion de projets</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;font-weight:600;">
                Bienvenue, ${name} !
              </h2>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">
                Votre compte <strong>${roleLabel}</strong> a été créé avec succès sur <strong>ProFlow</strong>.
                Voici vos identifiants de connexion :
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #d0e8ff;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #ddeeff;">
                          <span style="color:#1976d2;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Adresse email</span><br/>
                          <span style="color:#1a1a2e;font-size:16px;font-weight:500;margin-top:4px;display:block;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #ddeeff;">
                          <span style="color:#1976d2;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Mot de passe</span><br/>
                          <span style="color:#1a1a2e;font-size:16px;font-weight:500;font-family:monospace;margin-top:4px;display:block;background:#fff;padding:6px 12px;border-radius:4px;border:1px solid #cde;">${password}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#1976d2;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Rôle</span><br/>
                          <span style="color:#1a1a2e;font-size:16px;font-weight:500;margin-top:4px;display:block;">${roleLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                      <strong>Important :</strong> Pour votre sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
                Si vous avez des questions, n'hésitez pas à contacter votre chef de projet.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Cet email a été envoyé automatiquement par ProFlow. Veuillez ne pas répondre à cet email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `ProFlow <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Bienvenue sur ProFlow — Vos identifiants de connexion`,
    html,
  });
};

module.exports = { sendWelcomeEmail };
