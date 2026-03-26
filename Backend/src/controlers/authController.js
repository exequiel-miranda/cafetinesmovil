import User from '../modal/User.js';
import jwt from 'jsonwebtoken';
import { sendResetCodeEmail } from '../utils/mailer.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey123', {
        expiresIn: '30d',
    });
};

// POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validar si el usuario ya existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ ok: false, message: 'El correo ya está registrado' });
        }

        // Crear el usuario
        const user = await User.create({
            name,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                ok: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    token: generateToken(user._id),
                }
            });
        } else {
            res.status(400).json({ ok: false, message: 'Datos de usuario inválidos' });
        }
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error en el servidor', error: error.message });
    }
};

// POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            res.json({
                ok: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    token: generateToken(user._id),
                }
            });
        } else {
            res.status(401).json({ ok: false, message: 'Correo o contraseña incorrectos' });
        }
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error en el servidor', error: error.message });
    }
};
// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ ok: false, message: 'No existe un usuario con ese correo' });
        }

        // Generar código de 6 dígitos
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar código y expiración (10 min)
        user.resetPasswordToken = resetCode;
        user.resetPasswordExpires = Date.now() + 600000;
        await user.save();

        // Enviar correo (Si falla, no detenemos el flujo pero avisamos)
        try {
            await sendResetCodeEmail(user.email, resetCode);
            res.json({ ok: true, message: 'Código de recuperación enviado al correo' });
        } catch (mailError) {
            console.error('Error enviando correo:', mailError);
            res.status(500).json({ ok: false, message: 'Error enviando el correo de recuperación' });
        }
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error en el servidor', error: error.message });
    }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordToken: code,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ ok: false, message: 'Código inválido o expirado' });
        }

        // Actualizar contraseña y limpiar campos de reset
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ ok: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error en el servidor', error: error.message });
    }
};
