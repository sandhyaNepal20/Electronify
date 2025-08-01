const userModel = require("../../models/userModel")
const bcrypt = require('bcryptjs');
const { validatePassword, isPasswordRecentlyUsed } = require('../../helpers/passwordValidator');


async function userSignUpController(req, res) {
    try {
        const { email, password, name } = req.body

        const user = await userModel.findOne({ email })

        console.log("user", user)

        if (user) {
            throw new Error("Already user exits.")
        }

        if (!email) {
            throw new Error("Please provide email")
        }
        if (!password) {
            throw new Error("Please provide password")
        }
        if (!name) {
            throw new Error("Please provide name")
        }

        // Validate password against security policy
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                message: "Password does not meet security requirements",
                errors: passwordValidation.errors,
                success: false,
                error: true
            });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = await bcrypt.hashSync(password, salt);

        if (!hashPassword) {
            throw new Error("Something is wrong")
        }

        const payload = {
            ...req.body,
            role: "GENERAL",
            password: hashPassword,
            passwordHistory: [{
                password: hashPassword,
                createdAt: new Date()
            }],
            lastPasswordChange: new Date(),
            passwordExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
        }

        const userData = new userModel(payload)
        const saveUser = await userData.save()

        // Remove sensitive data from response
        const userResponse = {
            _id: saveUser._id,
            name: saveUser.name,
            email: saveUser.email,
            role: saveUser.role,
            profilePic: saveUser.profilePic,
            createdAt: saveUser.createdAt
        };

        res.status(201).json({
            data: userResponse,
            success: true,
            error: false,
            message: "User created Successfully!"
        })


    } catch (err) {
        res.json({
            message: err.message || err,
            error: true,
            success: false,
        })
    }
}

module.exports = userSignUpController