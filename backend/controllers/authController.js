const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: name || email.split('@')[0], // use part before @ if no name given
                email,
                password: hashedPassword,
                role: role || 'student'
            }
        });

        res.status(201).json({ message: "Account created successfully!", userId: user.id });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "An account with this email already exists." });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { id: user.id, role: user.role, email: user.email, name: user.name },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            // Return token + role + name + email so frontend can store them
            res.json({
                token,
                role: user.role,
                name: user.name || email.split('@')[0],
                email: user.email
            });
        } else {
            res.status(401).json({ message: "Invalid email or password." });
        }
    } catch (error) {
        res.status(500).json({ error: "Login failed. Please try again." });
    }
};
