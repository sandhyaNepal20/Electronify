const SummaryApi = {
    stripeConfig: {
        url: `${process.env.REACT_APP_SERVER_DOMAIN}/api/stripe-config`,
        method: "get"
    },
    createPaymentIntent: {
        url: `${process.env.REACT_APP_SERVER_DOMAIN}/api/create-payment-intent`,
        method: "post"
    },
    createCheckoutSession: {
        url: `${process.env.REACT_APP_SERVER_DOMAIN}/api/create-checkout-session`,
        method: "post"
    },
    verifyPayment: {
        url: `${process.env.REACT_APP_SERVER_DOMAIN}/api/verify-payment`,
        method: "post"
    },
    processPaymentSuccess: {
        url: `${process.env.REACT_APP_SERVER_DOMAIN}/api/process-payment-success`,
        method: "post"
    }
};

export default SummaryApi;
