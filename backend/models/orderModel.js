const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    orderItems: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product'
        },
        productName: String,
        productImage: String,
        price: Number,
        quantity: Number,
        total: Number
    }],
    paymentDetails: {
        paymentIntentId: String,
        sessionId: String,
        paymentMethod: String,
        paymentStatus: String,
        amount: Number,
        currency: String,
        stripePaymentId: String
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'confirmed'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    emailSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const orderModel = mongoose.model("order", orderSchema);

module.exports = orderModel;
