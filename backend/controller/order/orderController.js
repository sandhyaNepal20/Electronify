const orderModel = require('../../models/orderModel');

// Get all orders for a user
const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId; // From authToken middleware

        const orders = await orderModel.find({ userId })
            .populate('orderItems.productId', 'productName productImage price')
            .sort({ createdAt: -1 }); // Latest orders first

        res.status(200).json({
            data: orders,
            message: "Orders retrieved successfully",
            success: true,
            error: false
        });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            message: error.message || "Failed to fetch orders",
            error: true,
            success: false
        });
    }
};

// Get single order details
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;

        const order = await orderModel.findOne({ _id: orderId, userId })
            .populate('orderItems.productId', 'productName productImage price category');

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            });
        }

        res.status(200).json({
            data: order,
            message: "Order details retrieved successfully",
            success: true,
            error: false
        });

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({
            message: error.message || "Failed to fetch order details",
            error: true,
            success: false
        });
    }
};

// Get order statistics for user
const getOrderStats = async (req, res) => {
    try {
        const userId = req.userId;

        const stats = await orderModel.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: "$totalAmount" },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            }
        ]);

        const orderStatusCounts = await orderModel.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: "$orderStatus",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            data: {
                summary: stats[0] || { totalOrders: 0, totalSpent: 0, averageOrderValue: 0 },
                statusBreakdown: orderStatusCounts
            },
            message: "Order statistics retrieved successfully",
            success: true,
            error: false
        });

    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({
            message: error.message || "Failed to fetch order statistics",
            error: true,
            success: false
        });
    }
};

module.exports = {
    getUserOrders,
    getOrderDetails,
    getOrderStats
};
