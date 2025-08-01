import {
    CardElement,
    Elements,
    useElements,
    useStripe
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import SummaryApi from '../helpers/stripeApi';

// Stripe promise - will be initialized when component mounts
let stripePromise = null;

// Payment Form Component
const PaymentForm = ({ amount, onSuccess, onError, cartItems = [] }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        // Create payment intent when component mounts
        if (amount > 0) {
            createPaymentIntent();
        }
    }, [amount]);

    const createPaymentIntent = async () => {
        try {
            console.log('Creating payment intent for amount:', amount);
            console.log('API URL:', SummaryApi.createPaymentIntent.url);

            const response = await fetch(SummaryApi.createPaymentIntent.url, {
                method: SummaryApi.createPaymentIntent.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    currency: 'usd',
                    metadata: {
                        itemCount: cartItems.length
                    }
                })
            });

            console.log('Payment intent response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Payment intent response text:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (data.success) {
                setClientSecret(data.data.clientSecret);
                console.log('Payment intent created successfully');
            } else {
                console.error('Payment intent creation failed:', data.message);
                toast.error(data.message);
                onError && onError(data.message);
            }
        } catch (error) {
            console.error('Payment intent creation error:', error);
            toast.error('Failed to initialize payment: ' + error.message);
            onError && onError(error.message);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setIsProcessing(true);

        const cardElement = elements.getElement(CardElement);

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
            }
        });

        setIsProcessing(false);

        if (error) {
            toast.error(error.message);
            onError && onError(error.message);
        } else if (paymentIntent.status === 'succeeded') {
            toast.success('Payment successful!');
            onSuccess && onSuccess(paymentIntent);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
                padding: '12px',
            },
            invalid: {
                color: '#9e2146',
            },
        },
        hidePostalCode: false,
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border border-gray-300 rounded-lg">
                <CardElement options={cardElementOptions} />
            </div>

            <button
                type="submit"
                disabled={!stripe || isProcessing || !clientSecret}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${!stripe || isProcessing || !clientSecret
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </button>
        </form>
    );
};

// Main Stripe Payment Component
const StripePayment = ({
    amount,
    cartItems = [],
    onSuccess,
    onError,
    paymentType = 'intent' // 'intent' or 'checkout'
}) => {
    const [stripeConfigLoaded, setStripeConfigLoaded] = useState(false);

    useEffect(() => {
        loadStripeConfig();
    }, []);

    const loadStripeConfig = async () => {
        try {
            console.log('Loading Stripe config from:', SummaryApi.stripeConfig.url);

            const response = await fetch(SummaryApi.stripeConfig.url, {
                method: SummaryApi.stripeConfig.method,
                credentials: 'include'
            });

            console.log('Stripe config response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Stripe config response text:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (data.success && data.data.publishableKey) {
                console.log('Stripe config loaded successfully');
                stripePromise = loadStripe(data.data.publishableKey);
                setStripeConfigLoaded(true);
            } else {
                console.error('Failed to load Stripe config:', data.message);
                toast.error('Failed to load payment configuration');
                onError && onError('Failed to load payment configuration');
            }
        } catch (error) {
            console.error('Stripe config loading error:', error);
            toast.error('Failed to initialize payment system: ' + error.message);
            onError && onError(error.message);
        }
    };

    const handleCheckoutSession = async () => {
        try {
            console.log('Creating checkout session');
            console.log('API URL:', SummaryApi.createCheckoutSession.url);

            const response = await fetch(SummaryApi.createCheckoutSession.url, {
                method: SummaryApi.createCheckoutSession.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        name: item.productName || item.name,
                        price: item.sellingPrice || item.price,
                        quantity: item.quantity || 1,
                        image: item.productImage?.[0] || item.image,
                        description: item.description || ''
                    }))
                })
            });

            console.log('Checkout session response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Checkout session response text:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (data.success) {
                // Redirect to Stripe Checkout
                window.location.href = data.data.url;
            } else {
                console.error('Checkout session creation failed:', data.message);
                toast.error(data.message);
                onError && onError(data.message);
            }
        } catch (error) {
            console.error('Checkout session creation error:', error);
            toast.error('Failed to create checkout session: ' + error.message);
            onError && onError(error.message);
        }
    };

    if (!stripeConfigLoaded) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading payment system...</span>
            </div>
        );
    }

    if (paymentType === 'checkout') {
        return (
            <div className="space-y-4">
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Complete Your Purchase</h3>
                    <p className="text-gray-600 mb-4">Total: ${amount.toFixed(2)}</p>
                </div>

                <button
                    onClick={handleCheckoutSession}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                    Proceed to Checkout
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Complete Your Payment</h3>
                <p className="text-gray-600">Total: ${amount.toFixed(2)}</p>
            </div>

            {stripePromise && (
                <Elements stripe={stripePromise}>
                    <PaymentForm
                        amount={amount}
                        cartItems={cartItems}
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                </Elements>
            )}
        </div>
    );
};

export default StripePayment;
