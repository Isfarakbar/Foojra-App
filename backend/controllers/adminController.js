const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Shop = require('../models/shopModel');
const Order = require('../models/orderModel');
const MenuItem = require('../models/menuItemModel');

// @desc    Get comprehensive admin analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  try {
    // Get counts
    const [totalUsers, totalShops, totalOrders, totalMenuItems] = await Promise.all([
      User.countDocuments(),
      Shop.countDocuments(),
      Order.countDocuments(),
      MenuItem.countDocuments(),
    ]);

    // Get period-specific data
    const [recentUsers, recentShops, recentOrders] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Shop.countDocuments({ createdAt: { $gte: startDate } }),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
    ]);

    // Revenue calculations
    const revenueAggregation = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAggregation[0]?.total || 0;

    const periodRevenueAggregation = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const periodRevenue = periodRevenueAggregation[0]?.total || 0;

    // User statistics
    const userStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const userBreakdown = userStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, { customer: 0, shopOwner: 0, admin: 0 });

    // Shop statistics
    const shopStats = await Shop.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const shopBreakdown = shopStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, { approved: 0, pending: 0, rejected: 0 });

    // Order statistics
    const orderStats = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);
    const orderBreakdown = orderStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });

    // Popular items aggregation
    const popularItemsAggregation = await Order.aggregate([
      { $unwind: '$orderItems' },
      { 
        $group: { 
          _id: '$orderItems.name', 
          orderCount: { $sum: '$orderItems.qty' } 
        } 
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      { 
        $project: { 
          _id: 0, 
          name: '$_id', 
          orderCount: 1 
        } 
      }
    ]);

    // Top performing shops
    const topShopsAggregation = await Order.aggregate([
      { 
        $group: { 
          _id: '$shop', 
          orders: { $sum: 1 }, 
          revenue: { $sum: '$totalPrice' } 
        } 
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'shops',
          localField: '_id',
          foreignField: '_id',
          as: 'shopDetails'
        }
      },
      {
        $project: {
          shopId: '$_id',
          shopName: { $ifNull: [{ $arrayElemAt: ['$shopDetails.name', 0] }, 'Unknown Shop'] },
          orders: 1,
          revenue: 1
        }
      }
    ]);

    // Daily statistics for the period
    const dailyStatsAggregation = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyStats = {};
    dailyStatsAggregation.forEach(day => {
      dailyStats[day._id] = {
        orders: day.orders,
        revenue: day.revenue,
        users: 0, // Would need separate aggregation for users
        shops: 0  // Would need separate aggregation for shops
      };
    });

    res.json({
      success: true,
      data: {
        // Overview statistics
        overview: {
          totalUsers,
          totalShops,
          totalOrders,
          totalMenuItems,
          totalRevenue,
          periodRevenue,
          newUsersThisPeriod: recentUsers,
          newShopsThisPeriod: recentShops,
          newOrdersThisPeriod: recentOrders,
        },

        // User breakdown
        userStats: {
          total: totalUsers,
          customers: userBreakdown.customer,
          shopOwners: userBreakdown.shopOwner,
          admins: userBreakdown.admin,
          newUsers: recentUsers,
        },

        // Shop breakdown
        shopStats: {
          total: totalShops,
          approved: shopBreakdown.approved,
          pending: shopBreakdown.pending,
          rejected: shopBreakdown.rejected,
          newShops: recentShops,
        },

        // Order breakdown
        orderStats: {
          total: totalOrders,
          ...orderBreakdown,
          newOrders: recentOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        },

        // Revenue statistics
        revenueStats: {
          total: totalRevenue,
          period: periodRevenue,
          averagePerOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          averagePerDay: Object.keys(dailyStats).length > 0 
            ? periodRevenue / Object.keys(dailyStats).length 
            : 0,
        },

        // Popular items
        popularItems: popularItemsAggregation,

        // Top performing shops
        topShops: topShopsAggregation,

        // Daily statistics
        dailyStats,

        // Period info
        period,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to fetch admin analytics');
  }
});

module.exports = {
  getAdminAnalytics,
};