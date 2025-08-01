// Rate limiting middleware for brute-force prevention
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// In-memory store for tracking failed attempts (in production, use Redis or database)
const failedAttempts = new Map();

// Configuration constants
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of failedAttempts.entries()) {
        if (now - data.firstAttempt > ATTEMPT_WINDOW && !data.isLocked) {
            failedAttempts.delete(key);
        }
    }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Rate limiter for general login attempts
const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        success: false,
        error: true,
        message: 'Too many login attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Speed limiter to slow down repeated requests
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 3, // Allow 3 requests per windowMs without delay
    delayMs: 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Brute force protection middleware
const bruteForcePrevention = (req, res, next) => {
    const identifier = `${req.ip}_${req.body.email || 'unknown'}`;
    const now = Date.now();

    // Get or create attempt data
    let attemptData = failedAttempts.get(identifier) || {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
        isLocked: false,
        lockUntil: null
    };

    // Check if account is currently locked
    if (attemptData.isLocked && attemptData.lockUntil > now) {
        const remainingTime = Math.ceil((attemptData.lockUntil - now) / 60000); // minutes
        return res.status(429).json({
            success: false,
            error: true,
            message: `Account temporarily locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
            lockout: true,
            remainingTime: remainingTime
        });
    }

    // Reset if lockout period has expired
    if (attemptData.isLocked && attemptData.lockUntil <= now) {
        attemptData = {
            count: 0,
            firstAttempt: now,
            lastAttempt: now,
            isLocked: false,
            lockUntil: null
        };
    }

    // Reset attempts if window has expired
    if (now - attemptData.firstAttempt > ATTEMPT_WINDOW) {
        attemptData = {
            count: 0,
            firstAttempt: now,
            lastAttempt: now,
            isLocked: false,
            lockUntil: null
        };
    }

    // Store attempt data for use in other middleware
    req.bruteForceData = {
        identifier,
        attemptData,
        now
    };

    failedAttempts.set(identifier, attemptData);
    next();
};

// Function to record failed attempt
const recordFailedAttempt = (identifier, now) => {
    let attemptData = failedAttempts.get(identifier);

    if (attemptData) {
        attemptData.count += 1;
        attemptData.lastAttempt = now;

        failedAttempts.set(identifier, attemptData);

        // Lock account if max attempts reached
        if (attemptData.count >= MAX_ATTEMPTS) {
            attemptData.isLocked = true;
            attemptData.lockUntil = now + LOCKOUT_TIME;
            failedAttempts.set(identifier, attemptData);

            return {
                isNewLockout: true,
                message: "Account temporarily locked due to too many failed attempts. Try again in 5 minutes.",
                lockoutTime: LOCKOUT_TIME,
                remainingAttempts: 0,
                attemptNumber: attemptData.count
            };
        }

        return {
            isNewLockout: false,
            message: `Invalid credentials. ${MAX_ATTEMPTS - attemptData.count} attempt(s) remaining.`,
            remainingAttempts: MAX_ATTEMPTS - attemptData.count,
            attemptNumber: attemptData.count
        };
    }

    // If no attempt data exists, create it
    const newAttemptData = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        isLocked: false,
        lockUntil: null
    };

    failedAttempts.set(identifier, newAttemptData);

    return {
        isNewLockout: false,
        message: `Invalid credentials. ${MAX_ATTEMPTS - 1} attempt(s) remaining.`,
        remainingAttempts: MAX_ATTEMPTS - 1,
        attemptNumber: 1
    };
};

// Function to reset attempts on successful login
const resetAttempts = (identifier) => {
    failedAttempts.delete(identifier);
};

// Function to get remaining attempts
const getRemainingAttempts = (identifier) => {
    const attemptData = failedAttempts.get(identifier);
    if (!attemptData) return MAX_ATTEMPTS;
    return Math.max(0, MAX_ATTEMPTS - attemptData.count);
};

module.exports = {
    loginRateLimit,
    speedLimiter,
    bruteForcePrevention,
    recordFailedAttempt,
    resetAttempts,
    getRemainingAttempts,
    MAX_ATTEMPTS,
    LOCKOUT_TIME
};
