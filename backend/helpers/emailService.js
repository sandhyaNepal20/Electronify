const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP
const createTransporter = () => {
    console.log('Creating email transporter with config:', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_HOST_USER ? 'SET' : 'NOT SET',
        pass: process.env.EMAIL_HOST_PASSWORD ? 'SET' : 'NOT SET'
    });

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_HOST_USER,
            pass: process.env.EMAIL_HOST_PASSWORD,
        },
        debug: true, // Enable debug output
        logger: true // Log information in console
    });
};

// Send payment confirmation email
const sendPaymentConfirmationEmail = async (userEmail, paymentDetails, orderDetails = {}) => {
    try {
        console.log('=== EMAIL SERVICE DEBUG ===');
        console.log('Attempting to send email to:', userEmail);
        console.log('Payment details amount:', paymentDetails.amount || paymentDetails.amount_total);

        const transporter = createTransporter();

        // Test connection first
        try {
            await transporter.verify();
            console.log('SMTP connection verified successfully');
        } catch (verifyError) {
            console.error('SMTP connection verification failed:', verifyError);
            throw new Error(`SMTP verification failed: ${verifyError.message}`);
        }

        const mailOptions = {
            from: `"E-Commerce Store" <${process.env.EMAIL_HOST_USER}>`,
            to: userEmail,
            subject: 'Payment Confirmation - Your Order is Confirmed!',
            html: generatePaymentConfirmationHTML(paymentDetails, orderDetails)
        };

        console.log('Sending email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const result = await transporter.sendMail(mailOptions);
        console.log('Payment confirmation email sent successfully:', result.messageId);
        console.log('Email result details:', {
            messageId: result.messageId,
            response: result.response
        });

        return { success: true, messageId: result.messageId };

    } catch (error) {
        console.error('=== EMAIL ERROR ===');
        console.error('Email sending failed:', error.message);
        console.error('Full error:', error);

        // Return detailed error information
        return {
            success: false,
            error: error.message,
            code: error.code,
            command: error.command
        };
    }
};

// Generate HTML template for payment confirmation email
const generatePaymentConfirmationHTML = (paymentDetails, orderDetails) => {
    const amount = paymentDetails.amount ? (paymentDetails.amount / 100).toFixed(2) :
        paymentDetails.amount_total ? (paymentDetails.amount_total / 100).toFixed(2) : '0.00';

    const currency = paymentDetails.currency ? paymentDetails.currency.toUpperCase() : 'USD';
    const transactionId = paymentDetails.id || 'N/A';
    const paymentStatus = paymentDetails.status || 'completed';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #4CAF50;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                border: 1px solid #ddd;
            }
            .success-icon {
                font-size: 48px;
                color: #4CAF50;
                text-align: center;
                margin-bottom: 20px;
            }
            .details-box {
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #4CAF50;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .amount {
                font-size: 24px;
                font-weight: bold;
                color: #4CAF50;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Payment Successful!</h1>
        </div>
        
        <div class="content">
            <div class="success-icon">✅</div>
            
            <h2 style="text-align: center; color: #4CAF50;">Thank you for your purchase!</h2>
            <p style="text-align: center;">Your payment has been processed successfully and your order is confirmed.</p>
            
            <div class="details-box">
                <h3>Payment Details</h3>
                <div class="detail-row">
                    <span><strong>Amount Paid:</strong></span>
                    <span class="amount">$${amount} ${currency}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Transaction ID:</strong></span>
                    <span>${transactionId}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Payment Status:</strong></span>
                    <span style="text-transform: capitalize; color: #4CAF50;">${paymentStatus}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Payment Date:</strong></span>
                    <span>${new Date().toLocaleDateString()}</span>
                </div>
            </div>

            ${orderDetails.items && orderDetails.items.length > 0 ? `
            <div class="details-box">
                <h3>Order Items</h3>
                ${orderDetails.items.map(item => `
                    <div class="detail-row">
                        <span>${item.name} (x${item.quantity})</span>
                        <span>$${item.price}</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <p><strong>What's next?</strong></p>
            <ul>
                <li>You will receive a separate email with tracking information once your order ships</li>
                <li>You can track your order status in your account dashboard</li>
                <li>If you have any questions, please contact our support team</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} E-Commerce Store. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
};

// Send order confirmation email (can be used separately)
const sendOrderConfirmationEmail = async (userEmail, orderDetails) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"E-Commerce Store" <${process.env.EMAIL_HOST_USER}>`,
            to: userEmail,
            subject: 'Order Confirmation - Your Order has been Placed!',
            html: generateOrderConfirmationHTML(orderDetails)
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Order confirmation email sent:', result.messageId);
        return { success: true, messageId: result.messageId };

    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        return { success: false, error: error.message };
    }
};

// Generate HTML template for order confirmation
const generateOrderConfirmationHTML = (orderDetails) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #2196F3;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                border: 1px solid #ddd;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
            <p>Your order has been successfully placed and is being processed.</p>
            <p>Order ID: <strong>${orderDetails.orderId || 'N/A'}</strong></p>
            <p>We'll send you another email once your payment is processed.</p>
        </div>
    </body>
    </html>
    `;
};

module.exports = {
    sendPaymentConfirmationEmail,
    sendOrderConfirmationEmail
};
