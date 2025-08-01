import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import SummaryApi from '../helpers/stripeApi';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const paymentIntentId = searchParams.get('payment_intent');

        if (sessionId || paymentIntentId) {
            verifyPayment(sessionId, paymentIntentId);
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    const verifyPayment = async (sessionId, paymentIntentId) => {
        try {
            const response = await fetch(SummaryApi.verifyPayment.url, {
                method: SummaryApi.verifyPayment.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId,
                    paymentIntentId
                })
            });

            const data = await response.json();

            if (data.success) {
                setPaymentDetails(data.data);
                toast.success('Payment verified successfully!');
            } else {
                toast.error('Failed to verify payment');
            }
        } catch (error) {
            toast.error('Error verifying payment');
            console.error('Payment verification error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/orders'); // Assuming you have an orders page
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying your payment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {/* Success Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <svg
                        className="h-8 w-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>

                {/* Success Message */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Payment Successful!
                </h1>
                <p className="text-gray-600 mb-6">
                    Thank you for your purchase. Your order has been confirmed.
                </p>

                {/* Payment Details */}
                {paymentDetails && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                            {paymentDetails.amount_total && (
                                <p>Amount: ${(paymentDetails.amount_total / 100).toFixed(2)}</p>
                            )}
                            {paymentDetails.amount && (
                                <p>Amount: ${(paymentDetails.amount / 100).toFixed(2)}</p>
                            )}
                            {paymentDetails.currency && (
                                <p>Currency: {paymentDetails.currency.toUpperCase()}</p>
                            )}
                            {paymentDetails.id && (
                                <p>Transaction ID: {paymentDetails.id}</p>
                            )}
                            {paymentDetails.status && (
                                <p>Status: <span className="capitalize">{paymentDetails.status}</span></p>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleViewOrders}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                        View My Orders
                    </button>
                    <button
                        onClick={handleContinueShopping}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>

                {/* Additional Info */}
                <p className="text-xs text-gray-500 mt-6">
                    A confirmation email has been sent to your registered email address.
                </p>
            </div>
        </div>
    );
};

export default PaymentSuccess;
