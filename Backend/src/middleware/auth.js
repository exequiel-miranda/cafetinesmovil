import jwt from 'jsonwebtoken';
import User from '../modal/User.js';

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Obtener el token del header
            token = req.headers.authorization.split(' ')[1];

            // Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');

            // Adjuntar el usuario al objeto request (excluyendo password)
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            res.status(401).json({ ok: false, message: 'No autorizado, token fallido' });
        }
    }

    if (!token) {
        res.status(401).json({ ok: false, message: 'No autorizado, no hay token' });
    }
};
