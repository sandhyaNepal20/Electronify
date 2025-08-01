const { getPasswordStrengthDetails } = require('../../helpers/passwordValidator');

async function passwordStrengthController(req, res) {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                message: "Password is required",
                success: false,
                error: true
            });
        }

        const strengthDetails = getPasswordStrengthDetails(password);

        res.status(200).json({
            data: strengthDetails,
            success: true,
            error: false,
            message: "Password strength analyzed successfully"
        });

    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
            success: false,
        });
    }
}

module.exports = passwordStrengthController;
