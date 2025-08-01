import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
    const navigate = useNavigate();

    const handleRetryPayment = () => {
        navigate('/cart'); // Navigate back to cart to retry payment
    };

    const handleContinueShopping = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {/* Cancel Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                    <svg
                        className="h-8 w-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </div>

                {/* Cancel Message */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Payment Cancelled
                </h1>
                <p className="text-gray-600 mb-6">
                    Your payment was cancelled. Don't worry, no charges were made to your account.
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleRetryPayment}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                        Try Again
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
                    If you're experiencing issues with payment, please contact our support team.
                </p>
            </div>
        </div>
    );
};

export default PaymentCancel;
