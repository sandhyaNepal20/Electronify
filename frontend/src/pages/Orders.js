import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import SummaryApi from '../common/index';
import displayINRCurrency from '../helpers/displayCurrency';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch(SummaryApi.getUserOrders.url, {
                method: SummaryApi.getUserOrders.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setOrders(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'confirmed': 'bg-green-100 text-green-800',
            'processing': 'bg-blue-100 text-blue-800',
            'shipped': 'bg-purple-100 text-purple-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };

    const closeOrderDetails = () => {
        setSelectedOrder(null);
        setShowOrderDetails(false);
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white shadow-md rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
                    <p className="text-gray-600 mt-1">Track and manage your orders</p>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-500 text-lg">No orders found</div>
                        <p className="text-gray-400 mt-2">You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {orders.map((order) => (
                            <div key={order._id} className="p-6 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                Order #{order._id.slice(-8)}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                                                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                            <div>
                                                <span className="font-medium">Order Date:</span>
                                                <br />
                                                {moment(order.orderDate).format('MMM DD, YYYY h:mm A')}
                                            </div>
                                            <div>
                                                <span className="font-medium">Total Amount:</span>
                                                <br />
                                                <span className="text-lg font-bold text-green-600">
                                                    {displayINRCurrency(order.totalAmount)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Items:</span>
                                                <br />
                                                {order.orderItems.length} item(s)
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {order.orderItems.slice(0, 3).map((item, index) => (
                                                <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                                                    {item.productImage && (
                                                        <img
                                                            src={item.productImage}
                                                            alt={item.productName}
                                                            className="w-8 h-8 object-cover rounded"
                                                        />
                                                    )}
                                                    <span className="text-sm text-gray-700">
                                                        {item.productName} (x{item.quantity})
                                                    </span>
                                                </div>
                                            ))}
                                            {order.orderItems.length > 3 && (
                                                <div className="flex items-center justify-center bg-gray-100 rounded-lg p-2 text-sm text-gray-600">
                                                    +{order.orderItems.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="ml-4">
                                        <button
                                            onClick={() => viewOrderDetails(order)}
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Order Details - #{selectedOrder._id.slice(-8)}
                            </h2>
                            <button
                                onClick={closeOrderDetails}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Order Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Order ID:</span> {selectedOrder._id}</div>
                                        <div><span className="font-medium">Date:</span> {moment(selectedOrder.orderDate).format('MMMM DD, YYYY h:mm A')}</div>
                                        <div><span className="font-medium">Status:</span>
                                            <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedOrder.orderStatus)}`}>
                                                {selectedOrder.orderStatus.charAt(0).toUpperCase() + selectedOrder.orderStatus.slice(1)}
                                            </span>
                                        </div>
                                        <div><span className="font-medium">Email Sent:</span> {selectedOrder.emailSent ? 'Yes' : 'No'}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Payment Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Payment Method:</span> {selectedOrder.paymentDetails.paymentMethod}</div>
                                        <div><span className="font-medium">Payment Status:</span> {selectedOrder.paymentDetails.paymentStatus}</div>
                                        <div><span className="font-medium">Amount:</span> {displayINRCurrency(selectedOrder.totalAmount)}</div>
                                        <div><span className="font-medium">Currency:</span> {selectedOrder.paymentDetails.currency?.toUpperCase()}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
                                <div className="space-y-4">
                                    {selectedOrder.orderItems.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                            {item.productImage && (
                                                <img
                                                    src={item.productImage}
                                                    alt={item.productName}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-800">{item.productName}</h4>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    <span>Price: {displayINRCurrency(item.price)}</span>
                                                    <span className="ml-4">Quantity: {item.quantity}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-gray-800">
                                                    {displayINRCurrency(item.total)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Total Amount:</span>
                                        <span className="text-green-600">{displayINRCurrency(selectedOrder.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
