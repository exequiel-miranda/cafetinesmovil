import SystemConfig from '../modal/SystemConfig.js';

// GET /api/config
export const getConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();
        if (!config) {
            config = await SystemConfig.create({});
        }
        res.json({ ok: true, data: config });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Server error', error: error.message });
    }
};

// PATCH /api/config
export const updateConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();
        if (!config) {
            config = await SystemConfig.create({});
        }
        
        const updates = req.body;
        Object.keys(updates).forEach(key => {
            config[key] = updates[key];
        });
        
        await config.save();
        res.json({ ok: true, data: config, message: 'Configuración actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Server error', error: error.message });
    }
};
