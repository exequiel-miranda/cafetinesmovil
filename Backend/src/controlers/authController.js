import User from '../modal/User.js';
import RegistrationCode from '../modal/RegistrationCode.js';
import jwt from 'jsonwebtoken';
import { sendResetCodeEmail, sendAdminRegistrationCodeEmail } from '../utils/mailer.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey123', {
        expiresIn: '30d',
    });
};

// POST /api/auth/request-admin-code
export const requestAdminCode = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Verificar si el usuario ya existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ ok: false, message: 'El correo ya está registrado' });
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
            return res.status(500).json({ ok: false, message: 'ADMIN_EMAIL no está configurado en el servidor' });
        }

        // Generar código de 6 dígitos
        const registerCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Guardar o actualizar código temporal en base de datos
        await RegistrationCode.findOneAndUpdate(
            { email }, 
            { code: registerCode, expiresAt: Date.now() + 600000 }, 
            { upsert: true, new: true }
        );

        // Disparar email al administrador
        try {
            await sendAdminRegistrationCodeEmail(adminEmail, email, registerCode);
            // También mostramos en consola como fallback en caso de no tener SMTP funcionales al empezar
            console.log(`\n\n=== CÓDIGO DE REGISTRO PARA ${email} ===\n${registerCode}\n============================\n`);
            res.json({ ok: true, message: 'Código enviado al Administrador' });
        } catch (mailError) {
            console.error('Error enviando correo de registro:', mailError);
            console.log(`\n\nFallback de código para pruebas: ${registerCode}\n`);
            // Mandamos okay true para testing local si el mail explota
            res.status(200).json({ ok: true, message: 'Fallo SMTP, pero código impreso en consola backend.' });
        }
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error en el servidor', error: error.message });
    }
};

// POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { name, email, password, code } = req.body;

        if (!code) {
           return res.status(400).json({ ok: false, message: 'Se requiere el código del administrador' });
        }

        // Validar si el usuario ya existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ ok: false, message: 'El correo ya está registrado' });
        }

        // Validar el código provisto
        const validCode = await RegistrationCode.findOne({
            email,
            code,
            expiresAt: { $gt: Date.now() }
        });

        if (!validCode) {
            return res.status(400).json({ ok: false, message: 'Código de administrador inválido o expirado' });
        }

        // Crear el usuario asignándole rol 'staff' ya que pasó la validación OTP
        const user = await User.create({
            name,
            email,
            password,
            role: 'staff'
        });

        if (user) {
            // Eliminar el código usado
            await RegistrationCode.deleteOne({ email });

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

        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
            return res.status(500).json({ ok: false, message: 'ADMIN_EMAIL no está configurado en el servidor' });
        }

        // Generar código de 6 dígitos
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar código y expiración (10 min)
        user.resetPasswordToken = resetCode;
        user.resetPasswordExpires = Date.now() + 600000;
        await user.save();

        // Enviar correo al administrador
        try {
            await sendResetCodeEmail(adminEmail, user.email, resetCode);
            // Fallback console log para desarrollo
            console.log(`\n\n=== CÓDIGO DE RECUPERACIÓN PARA ${user.email} ===\n${resetCode}\n============================\n`);
            res.json({ ok: true, message: 'Solicitud enviada. Contacta al administrador para el código.' });
        } catch (mailError) {
            console.error('Error enviando correo:', mailError);
            console.log(`\n\nFallback de código para pruebas: ${resetCode}\n`);
            res.status(200).json({ ok: true, message: 'Fallo SMTP, pero código impreso en consola backend.' });
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

// PATCH /api/auth/profile
export const updateProfile = async (req, res) => {
    try {
        const { name, password, userId } = req.body;
        
        // El userId debería venir del token decodificado si hay un middleware de auth,
        // Pero para este flujo simplificado lo esperamos en el body o lo buscamos
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
        }

        if (name) user.name = name;
        if (password) user.password = password;
        
        await user.save();
        
        res.json({ 
            ok: true, 
            message: 'Perfil actualizado correctamente',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error en el servidor', error: error.message });
    }
};
