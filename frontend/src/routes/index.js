import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import AdminPanel from '../pages/AdminPanel'
import AllProducts from '../pages/AllProducts'
import AllUsers from '../pages/AllUsers'
import Cart from '../pages/Cart'
import CategoryProduct from '../pages/CategoryProduct'
import ForgotPassowrd from '../pages/ForgotPassowrd'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Orders from '../pages/Orders'
import PaymentCancel from '../pages/PaymentCancel'
import PaymentSuccess from '../pages/PaymentSuccess'
import ProductDetails from '../pages/ProductDetails'
import Profile from '../pages/Profile'
import SearchProduct from '../pages/SearchProduct'
import SignUp from '../pages/SignUp'

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "",
                element: <Home />
            },
            {
                path: "login",
                element: <Login />
            },
            {
                path: "forgot-password",
                element: <ForgotPassowrd />
            },
            {
                path: "sign-up",
                element: <SignUp />
            },
            {
                path: "product-category",
                element: <CategoryProduct />
            },
            {
                path: "product/:id",
                element: <ProductDetails />
            },
            {
                path: 'cart',
                element: <Cart />
            },
            {
                path: "search",
                element: <SearchProduct />
            },
            {
                path: "payment/success",
                element: <PaymentSuccess />
            },
            {
                path: "payment/cancel",
                element: <PaymentCancel />
            },
            {
                path: "orders",
                element: <Orders />
            },
            {
                path: "profile",
                element: <Profile />
            },
            {
                path: "admin-panel",
                element: <AdminPanel />,
                children: [
                    {
                        path: "all-users",
                        element: <AllUsers />
                    },
                    {
                        path: "all-products",
                        element: <AllProducts />
                    }
                ]
            },
        ]
    }
])


export default router