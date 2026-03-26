import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendResetCodeEmail = async (email, code) => {
    const mailOptions = {
        from: `"CafetinesMóvil" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Código de recuperación de contraseña - CafetinesMóvil',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #3B82F6; text-align: center;">Recuperación de Contraseña</h2>
                <p>Hola,</p>
                <p>Has solicitado restablecer tu contraseña en <strong>CafetinesMóvil</strong>. Utiliza el siguiente código para continuar:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; background-color: #f3f4f6; padding: 15px 25px; border-radius: 8px;">${code}</span>
                </div>
                <p>Este código expirará en 10 minutos por razones de seguridad.</p>
                <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #6b7280; text-align: center;">Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};
