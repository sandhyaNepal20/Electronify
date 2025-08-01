import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Context from '../context';
import SummaryApi from '../helpers/stripeApi';
import StripePayment from './StripePayment';

const PaymentButton = ({
    cartItems = [],
    totalAmount,
    onPaymentSuccess,
    buttonText = "Proceed to Payment",
    className = ""
}) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentType, setPaymentType] = useState('intent'); // 'intent' or 'checkout'
    const { fetchUserAddToCart } = useContext(Context);
    const user = useSelector(state => state?.user?.user); // Get user from Redux state

    console.log('PaymentButton initialized with:', { totalAmount, cartItemsCount: cartItems.length, user: user?.email }); // Debug log

    const handlePaymentClick = () => {
        console.log('Payment button clicked!'); // Debug log
        console.log('Cart items:', cartItems); // Debug log
        console.log('Total amount:', totalAmount); // Debug log

        if (!user?.email) {
            toast.error('Please login to continue with payment');
            return;
        }

        if (!cartItems.length) {
            toast.error('Your cart is empty');
            return;
        }

        if (!totalAmount || totalAmount <= 0) {
            toast.error('Invalid total amount');
            return;
        }

        console.log('Setting showPaymentModal to true'); // Debug log
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async (paymentIntent) => {
        try {
            console.log('Payment success handler called:', paymentIntent); // Debug log

            // Process payment success and send email
            const response = await fetch(SummaryApi.processPaymentSuccess.url, {
                method: SummaryApi.processPaymentSuccess.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paymentIntentId: paymentIntent.id,
                    userEmail: user.email, // Use actual user email from Redux state
                    orderItems: cartItems.map(item => ({
                        name: item.productName || item.name,
                        price: (item.sellingPrice || item.price).toFixed(2),
                        quantity: item.quantity || 1
                    }))
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Payment successful! Confirmation email sent.');

                // Clear cart after successful payment
                if (fetchUserAddToCart) {
                    fetchUserAddToCart();
                }

                // Close modal
                setShowPaymentModal(false);

                // Call parent success handler
                if (onPaymentSuccess) {
                    onPaymentSuccess(paymentIntent, data);
                }
            } else {
                toast.error(data.message || 'Failed to process payment');
            }
        } catch (error) {
            console.error('Payment success processing error:', error);
            toast.error('Payment successful but failed to send confirmation');
        }
    };

    const handlePaymentError = (error) => {
        console.error('Payment error:', error); // Debug log
        toast.error(error || 'Payment failed');
    };

    const closeModal = () => {
        console.log('Closing payment modal'); // Debug log
        setShowPaymentModal(false);
    };

    console.log('PaymentButton render - showPaymentModal:', showPaymentModal); // Debug log

    return (
        <>
            {/* Payment Button */}
            <button
                onClick={handlePaymentClick}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors ${className}`}
                type="button"
            >
                {buttonText}
            </button>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold">Choose Payment Method</h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Payment Type Selection */}
                            <div className="mb-6">
                                <h3 className="text-lg font-medium mb-3">Select Payment Option</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="paymentType"
                                            value="intent"
                                            checked={paymentType === 'intent'}
                                            onChange={(e) => setPaymentType(e.target.value)}
                                            className="mr-3"
                                        />
                                        <div>
                                            <div className="font-medium">Card Payment</div>
                                            <div className="text-sm text-gray-600">Pay directly with your card</div>
                                        </div>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="paymentType"
                                            value="checkout"
                                            checked={paymentType === 'checkout'}
                                            onChange={(e) => setPaymentType(e.target.value)}
                                            className="mr-3"
                                        />
                                        <div>
                                            <div className="font-medium">Stripe Checkout</div>
                                            <div className="text-sm text-gray-600">Secure hosted payment page</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium mb-2">Order Summary</h4>
                                <div className="space-y-1 text-sm">
                                    {cartItems.slice(0, 3).map((item, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span>{item.productName || item.name} (x{item.quantity || 1})</span>
                                            <span>${((item.sellingPrice || item.price) * (item.quantity || 1)).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {cartItems.length > 3 && (
                                        <div className="text-gray-500">
                                            ...and {cartItems.length - 3} more items
                                        </div>
                                    )}
                                    <div className="border-t pt-2 font-medium flex justify-between">
                                        <span>Total:</span>
                                        <span>${totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stripe Payment Component */}
                            <StripePayment
                                amount={totalAmount}
                                cartItems={cartItems}
                                paymentType={paymentType}
                                onSuccess={handlePaymentSuccess}
                                onError={handlePaymentError}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PaymentButton;
