const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendPaymentConfirmationEmail } = require('../../helpers/emailService');
const orderModel = require('../../models/orderModel');
const userModel = require('../../models/userModel');

// Create Payment Intent
const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = 'usd', metadata = {} } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "Amount is required and must be greater than 0",
                error: true,
                success: false
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            metadata: {
                userId: req.userId,
                ...metadata
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.status(200).json({
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            },
            message: "Payment intent created successfully",
            success: true,
            error: false
        });

    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to create payment intent",
            error: true,
            success: false
        });
    }
};

// Create Checkout Session
const createCheckoutSession = async (req, res) => {
    try {
        const { items, successUrl, cancelUrl } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Items array is required",
                error: true,
                success: false
            });
        }

        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [],
                    description: item.description || ''
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl || `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
            metadata: {
                userId: req.userId
            }
        });

        res.status(200).json({
            data: {
                sessionId: session.id,
                url: session.url
            },
            message: "Checkout session created successfully",
            success: true,
            error: false
        });

    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to create checkout session",
            error: true,
            success: false
        });
    }
};

// Verify Payment and Send Email Confirmation
const verifyPayment = async (req, res) => {
    try {
        const { paymentIntentId, sessionId, userEmail } = req.body;

        let paymentData = null;

        if (paymentIntentId) {
            paymentData = await stripe.paymentIntents.retrieve(paymentIntentId);
        } else if (sessionId) {
            paymentData = await stripe.checkout.sessions.retrieve(sessionId);
        } else {
            return res.status(400).json({
                message: "Payment Intent ID or Session ID is required",
                error: true,
                success: false
            });
        }

        // Send email confirmation if payment is successful and email is provided
        if (paymentData && (paymentData.status === 'succeeded' || paymentData.payment_status === 'paid') && userEmail) {
            try {
                const emailResult = await sendPaymentConfirmationEmail(userEmail, paymentData);
                console.log('Email sent result:', emailResult);
            } catch (emailError) {
                console.error('Failed to send email confirmation:', emailError);
                // Don't fail the entire request if email fails
            }
        }

        res.status(200).json({
            data: paymentData,
            message: "Payment details retrieved successfully",
            success: true,
            error: false
        });

    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to verify payment",
            error: true,
            success: false
        });
    }
};

// Process Payment Success (New endpoint for handling successful payments)
const processPaymentSuccess = async (req, res) => {
    try {
        const { paymentIntentId, sessionId, userEmail, orderItems = [] } = req.body;

        console.log('Processing payment success:', { paymentIntentId, sessionId, userEmail, orderItemsCount: orderItems.length });

        if (!userEmail) {
            return res.status(400).json({
                message: "User email is required",
                error: true,
                success: false
            });
        }

        let paymentData = null;

        if (paymentIntentId) {
            paymentData = await stripe.paymentIntents.retrieve(paymentIntentId);
        } else if (sessionId) {
            paymentData = await stripe.checkout.sessions.retrieve(sessionId);
        } else {
            return res.status(400).json({
                message: "Payment Intent ID or Session ID is required",
                error: true,
                success: false
            });
        }

        console.log('Payment data retrieved:', {
            status: paymentData.status,
            payment_status: paymentData.payment_status,
            amount: paymentData.amount || paymentData.amount_total
        });

        // Check if payment is successful
        if (paymentData && (paymentData.status === 'succeeded' || paymentData.payment_status === 'paid')) {

            // Get user details
            const user = await userModel.findOne({ email: userEmail });
            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                    error: true,
                    success: false
                });
            }

            // Calculate total amount
            const totalAmount = (paymentData.amount || paymentData.amount_total) / 100; // Convert from cents

            // Create order in database
            const newOrder = new orderModel({
                userId: user._id,
                userEmail: userEmail,
                userName: user.name,
                orderItems: orderItems.map(item => ({
                    productId: item.productId || item._id,
                    productName: item.productName || item.name,
                    productImage: item.productImage || item.image?.[0],
                    price: item.price,
                    quantity: item.quantity,
                    total: item.price * item.quantity
                })),
                paymentDetails: {
                    paymentIntentId: paymentIntentId,
                    sessionId: sessionId,
                    paymentMethod: 'card',
                    paymentStatus: paymentData.status || 'paid',
                    amount: totalAmount,
                    currency: paymentData.currency || 'usd',
                    stripePaymentId: paymentData.id
                },
                totalAmount: totalAmount,
                orderStatus: 'confirmed'
            });

            const savedOrder = await newOrder.save();
            console.log('Order saved to database:', savedOrder._id);

            // Send email confirmation
            let emailSent = false;
            try {
                console.log('Attempting to send email to:', userEmail);
                const emailResult = await sendPaymentConfirmationEmail(userEmail, paymentData, { items: orderItems });
                console.log('Email result:', emailResult);
                emailSent = emailResult.success;

                // Update order with email status
                await orderModel.findByIdAndUpdate(savedOrder._id, { emailSent: emailSent });

            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                console.error('Email error details:', emailError.message);
            }

            res.status(200).json({
                data: {
                    paymentData,
                    orderId: savedOrder._id,
                    emailSent: emailSent
                },
                message: `Payment processed successfully. Order saved to database. ${emailSent ? 'Confirmation email sent.' : 'Email sending failed - please check your email settings.'}`,
                success: true,
                error: false
            });
        } else {
            res.status(400).json({
                message: "Payment was not successful",
                error: true,
                success: false
            });
        }

    } catch (error) {
        console.error('Error in processPaymentSuccess:', error);
        res.status(500).json({
            message: error.message || "Failed to process payment success",
            error: true,
            success: false
        });
    }
};

// Get Stripe Config (Publishable Key)
const getStripeConfig = async (req, res) => {
    try {
        res.status(200).json({
            data: {
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
            },
            message: "Stripe config retrieved successfully",
            success: true,
            error: false
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to get Stripe config",
            error: true,
            success: false
        });
    }
};

module.exports = {
    createPaymentIntent,
    createCheckoutSession,
    verifyPayment,
    processPaymentSuccess,
    getStripeConfig
};
