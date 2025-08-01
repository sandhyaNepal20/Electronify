const bcrypt = require('bcryptjs');

// Password policy configuration
const PASSWORD_POLICY = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5, // Prevent reusing last 5 passwords
    expiryDays: 90
};

// Special characters allowed
const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Validate password against policy
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with errors and strength
 */
function validatePassword(password) {
    const errors = [];
    let score = 0;

    // Length validation
    if (!password || password.length < PASSWORD_POLICY.minLength) {
        errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
    } else if (password.length >= PASSWORD_POLICY.minLength) {
        score += 1;
    }

    if (password && password.length > PASSWORD_POLICY.maxLength) {
        errors.push(`Password must not exceed ${PASSWORD_POLICY.maxLength} characters`);
    }

    // Complexity validation
    if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
        score += 1;
    }

    if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
        score += 1;
    }

    if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
        score += 1;
    }

    if (PASSWORD_POLICY.requireSpecialChars && !SPECIAL_CHARS.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    } else if (SPECIAL_CHARS.test(password)) {
        score += 1;
    }

    // Additional strength checks
    if (password && password.length >= 12) score += 1;
    if (password && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) score += 1;

    // Common password patterns (weak patterns)
    const commonPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /admin/i,
        /letmein/i,
        /welcome/i,
        /monkey/i,
        /dragon/i
    ];

    const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
    if (hasCommonPattern) {
        errors.push('Password contains common patterns and is easily guessable');
        score = Math.max(0, score - 2);
    }

    // Calculate strength level
    let strength = 'weak';
    if (score >= 6 && errors.length === 0) {
        strength = 'strong';
    } else if (score >= 4 && errors.length <= 1) {
        strength = 'medium';
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength,
        score: Math.min(score, 7) // Cap at 7
    };
}

/**
 * Check if password was recently used
 * @param {string} newPassword - New password to check
 * @param {Array} passwordHistory - Array of previous password hashes
 * @returns {boolean} - True if password was recently used
 */
async function isPasswordRecentlyUsed(newPassword, passwordHistory) {
    if (!passwordHistory || passwordHistory.length === 0) {
        return false;
    }

    // Check against last N passwords
    const recentPasswords = passwordHistory
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, PASSWORD_POLICY.preventReuse);

    for (const historyItem of recentPasswords) {
        const isMatch = await bcrypt.compare(newPassword, historyItem.password);
        if (isMatch) {
            return true;
        }
    }

    return false;
}

/**
 * Check if password has expired
 * @param {Date} lastPasswordChange - Date of last password change
 * @returns {boolean} - True if password has expired
 */
function isPasswordExpired(lastPasswordChange) {
    if (!lastPasswordChange) return true;

    const expiryDate = new Date(lastPasswordChange);
    expiryDate.setDate(expiryDate.getDate() + PASSWORD_POLICY.expiryDays);

    return new Date() > expiryDate;
}

/**
 * Get password strength details for frontend
 * @param {string} password - Password to analyze
 * @returns {object} - Detailed strength information
 */
function getPasswordStrengthDetails(password) {
    const validation = validatePassword(password);

    const criteria = {
        length: password && password.length >= PASSWORD_POLICY.minLength,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /\d/.test(password),
        specialChars: SPECIAL_CHARS.test(password),
        noCommonPatterns: !password || ![
            /123456/, /password/i, /qwerty/i, /admin/i,
            /letmein/i, /welcome/i, /monkey/i, /dragon/i
        ].some(pattern => pattern.test(password))
    };

    const metCriteria = Object.values(criteria).filter(Boolean).length;
    const totalCriteria = Object.keys(criteria).length;

    return {
        ...validation,
        criteria,
        progress: Math.round((metCriteria / totalCriteria) * 100),
        suggestions: validation.errors
    };
}

module.exports = {
    validatePassword,
    isPasswordRecentlyUsed,
    isPasswordExpired,
    getPasswordStrengthDetails,
    PASSWORD_POLICY
};
