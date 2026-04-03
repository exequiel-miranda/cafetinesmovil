import User from '../modal/User.js';

// GET /api/users
export const getUsers = async (req, res) => {
    try {
        // Obtenemos solo al staff y admins (excluye al público general 'user')
        const users = await User.find({ role: { $in: ['staff', 'admin'] } }).select('-password').sort({ createdAt: -1 });
        res.json({ ok: true, data: users });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Server error', error: error.message });
    }
};

// PATCH /api/users/:id/department
export const updateUserDepartment = async (req, res) => {
    try {
        const { department } = req.body;
        if (!['kitchen', 'sales'].includes(department)) {
            return res.status(400).json({ ok: false, message: 'Invalid department provided' });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
        
        user.department = department;
        await user.save();
        
        res.json({ ok: true, data: user, message: 'User department updated successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Server error', error: error.message });
    }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
        
        await user.deleteOne();
        res.json({ ok: true, message: 'User removed successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Server error', error: error.message });
    }
};
