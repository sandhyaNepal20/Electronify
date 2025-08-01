const express = require('express')

const router = express.Router()

const userSignUpController = require("../controller/user/userSignUp")
const userSignInController = require('../controller/user/userSignIn')
const userDetailsController = require('../controller/user/userDetails')
const authToken = require('../middleware/authToken')
const userLogout = require('../controller/user/userLogout')
const allUsers = require('../controller/user/allUsers')
const updateUser = require('../controller/user/updateUser')
const UploadProductController = require('../controller/product/uploadProduct')
const getProductController = require('../controller/product/getProduct')
const updateProductController = require('../controller/product/updateProduct')
const getCategoryProduct = require('../controller/product/getCategoryProductOne')
const getCategoryWiseProduct = require('../controller/product/getCategoryWiseProduct')
const getProductDetails = require('../controller/product/getProductDetails')
const addToCartController = require('../controller/user/addToCartController')
const countAddToCartProduct = require('../controller/user/countAddToCartProduct')
const addToCartViewProduct = require('../controller/user/addToCartViewProduct')
const updateAddToCartProduct = require('../controller/user/updateAddToCartProduct')
const deleteAddToCartProduct = require('../controller/user/deleteAddToCartProduct')
const searchProduct = require('../controller/product/searchProduct')
const filterProductController = require('../controller/product/filterProduct')
const passwordStrengthController = require('../controller/user/passwordStrength')

// Import brute-force prevention middleware
const { loginRateLimit, speedLimiter, bruteForcePrevention } = require('../middleware/rateLimiter')

// Payment controllers
const { createPaymentIntent, createCheckoutSession, verifyPayment, processPaymentSuccess, getStripeConfig } = require('../controller/payment/stripePayment')

// Order controllers
const { getUserOrders, getOrderDetails, getOrderStats } = require('../controller/order/orderController')

router.post("/signup", userSignUpController)
router.post("/signin", loginRateLimit, speedLimiter, bruteForcePrevention, userSignInController)
router.post("/password-strength", passwordStrengthController)
router.get("/user-details", authToken, userDetailsController)
router.get("/userLogout", userLogout)

//admin panel 
router.get("/all-user", authToken, allUsers)
router.post("/update-user", authToken, updateUser)

//product
router.post("/upload-product", authToken, UploadProductController)
router.get("/get-product", getProductController)
router.post("/update-product", authToken, updateProductController)
router.get("/get-categoryProduct", getCategoryProduct)
router.post("/category-product", getCategoryWiseProduct)
router.post("/product-details", getProductDetails)
router.get("/search", searchProduct)
router.post("/filter-product", filterProductController)

//user add to cart
router.post("/addtocart", authToken, addToCartController)
router.get("/countAddToCartProduct", authToken, countAddToCartProduct)
router.get("/view-card-product", authToken, addToCartViewProduct)
router.post("/update-cart-product", authToken, updateAddToCartProduct)
router.post("/delete-cart-product", authToken, deleteAddToCartProduct)

// Payment routes
router.get("/stripe-config", authToken, getStripeConfig)
router.post("/create-payment-intent", authToken, createPaymentIntent)
router.post("/create-checkout-session", authToken, createCheckoutSession)
router.post("/verify-payment", authToken, verifyPayment)
router.post("/process-payment-success", authToken, processPaymentSuccess)

// Order routes
router.get("/orders", authToken, getUserOrders)
router.get("/orders/:orderId", authToken, getOrderDetails)
router.get("/order-stats", authToken, getOrderStats)

module.exports = router