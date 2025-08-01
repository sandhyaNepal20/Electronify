const bcrypt = require('bcryptjs')
const userModel = require('../../models/userModel')
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { recordFailedAttempt, resetAttempts, getRemainingAttempts } = require('../../middleware/rateLimiter');

async function userSignInController(req, res) {
    try {
        const { email, password, captchaToken } = req.body

        if (!email) {
            throw new Error("Please provide email")
        }
        if (!password) {
            throw new Error("Please provide password")
        }

        // Note: Captcha is displayed on frontend but not validated for now
        // You can enable full captcha validation by setting RECAPTCHA_SECRET_KEY environment variable

        const user = await userModel.findOne({ email })

        if (!user) {
            // Record failed attempt for non-existent user
            if (req.bruteForceData) {
                const lockoutInfo = recordFailedAttempt(req.bruteForceData.identifier, req.bruteForceData.now);
                const remainingAttempts = getRemainingAttempts(req.bruteForceData.identifier);
                const attemptNumber = 5 - remainingAttempts + 1;

                if (lockoutInfo && remainingAttempts <= 0) {
                    return res.status(429).json({
                        success: false,
                        error: true,
                        message: "Account temporarily locked due to too many failed attempts. Try again in 5 minutes.",
                        lockout: true,
                        isNewLockout: true,
                        lockoutTime: 5 * 60 * 1000
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        error: true,
                        message: "User not found",
                        remainingAttempts: remainingAttempts,
                        attemptNumber: attemptNumber
                    });
                }
            }
            throw new Error("User not found")
        }

        const checkPassword = await bcrypt.compare(password, user.password)

        console.log("checkPassoword", checkPassword)

        if (checkPassword) {
            // Reset failed attempts on successful login
            if (req.bruteForceData) {
                resetAttempts(req.bruteForceData.identifier);
            }

            const tokenData = {
                _id: user._id,
                email: user.email,
            }
            const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, { expiresIn: 60 * 60 * 8 });

            const tokenOption = {
                httpOnly: true,
                secure: true
            }

            res.cookie("token", token, tokenOption).status(200).json({
                message: "Login successfully",
                data: token,
                success: true,
                error: false
            })

        } else {
            // Record failed attempt for wrong password
            if (req.bruteForceData) {
                const lockoutInfo = recordFailedAttempt(req.bruteForceData.identifier, req.bruteForceData.now);
                const remainingAttempts = getRemainingAttempts(req.bruteForceData.identifier);
                const attemptNumber = 5 - remainingAttempts + 1;

                if (lockoutInfo.remainingAttempts <= 0) {
                    return res.status(429).json({
                        success: false,
                        error: true,
                        message: "Account temporarily locked due to too many failed attempts. Try again in 5 minutes.",
                        lockout: true,
                        isNewLockout: true,
                        lockoutTime: 5 * 60 * 1000
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        error: true,
                        message: "Invalid email or password",
                        remainingAttempts: remainingAttempts,
                        attemptNumber: attemptNumber
                    });
                }
            } else {
                // Fallback if middleware not working
                const remainingAttempts = 4;
                const attemptNumber = 1;
                return res.status(400).json({
                    success: false,
                    error: true,
                    message: "Invalid email or password",
                    remainingAttempts: remainingAttempts,
                    attemptNumber: attemptNumber
                });
            }
        }

    } catch (err) {
        res.json({
            message: err.message || err,
            error: true,
            success: false,
        })
    }
}

module.exports = userSignInController