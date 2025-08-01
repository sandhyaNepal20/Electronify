const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: String,
    profilePic: String,
    role: String,
    passwordHistory: [{
        password: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    passwordExpiryDate: {
        type: Date,
        default: function () {
            // Set password expiry to 90 days from creation
            return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        }
    },
    lastPasswordChange: {
        type: Date,
        default: Date.now
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    accountLocked: {
        type: Boolean,
        default: false
    },
    lockUntil: Date
}, {
    timestamps: true
})

// Index for password expiry cleanup
userSchema.index({ passwordExpiryDate: 1 });

const userModel = mongoose.model("user", userSchema)


module.exports = userModel