const userModel = require("../../models/userModel")
const bcrypt = require('bcryptjs')

async function updateUser(req, res) {
    try {
        const sessionUser = req.userId
        console.log(" Update User Request - Session User:", sessionUser)
        console.log(" Request Body:", { ...req.body, currentPassword: '***', newPassword: '***' })

        const { userId, email, name, role, currentPassword, newPassword } = req.body

        // Find the user to update - if no userId provided, update the session user
        const targetUserId = userId || sessionUser
        const userToUpdate = await userModel.findById(targetUserId)
        console.log(" User to update found:", userToUpdate ? userToUpdate.email : 'Not found')

        if (!userToUpdate) {
            console.log(" User not found")
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            })
        }

        // Check if the session user has permission to update this user
        const sessionUserData = await userModel.findById(sessionUser)
        console.log(" Session user role:", sessionUserData?.role)

        // Allow users to update their own profile or admins to update any user
        if (userId && userId !== sessionUser && sessionUserData.role !== 'ADMIN') {
            console.log(" Permission denied")
            return res.status(403).json({
                message: "You don't have permission to update this user",
                error: true,
                success: false
            })
        }

        // Prepare the update payload
        const payload = {
            ...(email && { email: email }),
            ...(name && { name: name }),
            ...(role && sessionUserData.role === 'ADMIN' && { role: role }),
        }
        console.log(" Initial payload:", payload)

        // Handle password update if provided
        if (newPassword && newPassword.trim() !== '') {
            console.log(" Password update requested")

            // Verify current password is provided
            if (!currentPassword || currentPassword.trim() === '') {
                console.log(" Current password not provided")
                return res.status(400).json({
                    message: "Current password is required to change password",
                    error: true,
                    success: false
                })
            }

            console.log(" Verifying current password...")
            // Verify current password is correct
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userToUpdate.password)
            console.log(" Current password valid:", isCurrentPasswordValid)

            if (!isCurrentPasswordValid) {
                console.log(" Current password is incorrect")
                return res.status(400).json({
                    message: "Current password is incorrect",
                    error: true,
                    success: false
                })
            }

            // Validate new password
            if (newPassword.length < 6) {
                console.log(" New password too short")
                return res.status(400).json({
                    message: "New password must be at least 6 characters long",
                    error: true,
                    success: false
                })
            }

            console.log(" Hashing new password...")
            // Hash the new password - FIX: Use proper bcrypt async method
            const salt = await bcrypt.genSalt(10)
            const hashPassword = await bcrypt.hash(newPassword, salt)
            console.log(" Password hashed successfully:", !!hashPassword)

            if (!hashPassword) {
                console.log(" Error hashing password")
                return res.status(500).json({
                    message: "Error hashing password",
                    error: true,
                    success: false
                })
            }

            // Add hashed password to payload
            payload.password = hashPassword
            console.log(" Password added to payload")
        }

        console.log(" Final payload:", { ...payload, password: payload.password ? '***HASHED***' : undefined })
        console.log(" Updating user with ID:", targetUserId)

        // Update the user - FIX: Ensure we're updating the correct user
        const updatedUser = await userModel.findByIdAndUpdate(
            targetUserId,
            payload,
            {
                new: true,
                runValidators: true,
                upsert: false // Don't create new document if not found
            }
        )

        console.log(" User updated successfully:", !!updatedUser)

        if (!updatedUser) {
            console.log(" Failed to update user in database")
            return res.status(500).json({
                message: "Failed to update user",
                error: true,
                success: false
            })
        }

        // Verify the password was actually updated in the database
        if (newPassword && newPassword.trim() !== '') {
            console.log(" Verifying password was saved to database...")
            const userAfterUpdate = await userModel.findById(targetUserId)
            const newPasswordMatches = await bcrypt.compare(newPassword, userAfterUpdate.password)
            const oldPasswordStillWorks = await bcrypt.compare(currentPassword, userAfterUpdate.password)

            console.log(" New password verification:", newPasswordMatches)
            console.log(" Old password still works:", oldPasswordStillWorks)

            if (!newPasswordMatches) {
                console.log(" CRITICAL ERROR: Password was not properly saved to database!")
                return res.status(500).json({
                    message: "Password update failed - please try again",
                    error: true,
                    success: false
                })
            }

            if (oldPasswordStillWorks) {
                console.log(" CRITICAL ERROR: Old password still works after update!")
                return res.status(500).json({
                    message: "Password update failed - old password still active",
                    error: true,
                    success: false
                })
            }
        }

        console.log(" Update completed successfully")

        // Return updated user without password
        const responseUser = await userModel.findById(targetUserId).select('-password')

        res.json({
            data: responseUser,
            message: newPassword ? "Profile and password updated successfully" : "Profile updated successfully",
            success: true,
            error: false
        })

    } catch (err) {
        console.error(" Update user error:", err)

        // Handle duplicate email error
        if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return res.status(400).json({
                message: "Email already exists",
                error: true,
                success: false
            })
        }

        res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
            success: false
        })
    }
}

module.exports = updateUser