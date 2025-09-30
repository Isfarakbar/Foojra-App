const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const Shop = require('../models/shopModel');
const MenuItem = require('../models/menuItemModel');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    deliveryAddress,
    paymentMethod,
    orderSummary,
    deliveryInstructions,
    preparationTime,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Get shop from first order item
  const firstMenuItem = await MenuItem.findById(orderItems[0].menuItem);
  if (!firstMenuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  const shop = await Shop.findById(firstMenuItem.shop);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  // Generate order number
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const orderNumber = `ORD${timestamp}${random}`;

  // Calculate estimated delivery time
  const estimatedDeliveryTime = new Date();
  estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + (preparationTime || 30) + 15);

  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    shop: shop._id,
    orderItems,
    deliveryAddress,
    paymentMethod,
    orderSummary,
    deliveryInstructions,
    preparationTime: preparationTime || 30,
    estimatedDeliveryTime,
    status: 'Pending',
    paymentStatus: 'Pending'
  });

  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'name email phone')
    .populate('shop', 'name phone address')
    .populate('orderItems.menuItem', 'name basePrice images');

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order: populatedOrder
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('shop', 'name phone address logo')
    .populate('orderItems.menuItem', 'name basePrice images description');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order or is the shop owner
  const shop = await Shop.findById(order.shop._id);
  if (order.user._id.toString() !== req.user._id.toString() && 
      shop.owner.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to view this order');
  }

  res.json({
    success: true,
    order
  });
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const { paymentResult } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this order');
  }

  order.paymentStatus = 'Paid';
  order.paidAt = new Date();
  order.paymentResult = paymentResult;
  
  if (order.status === 'Pending') {
    order.status = 'Confirmed';
  }

  const updatedOrder = await order.save();

  res.json({
    success: true,
    message: 'Order payment updated successfully',
    order: updatedOrder
  });
});

// @desc    Update order status (Shop owner only)
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingInfo } = req.body;

  const order = await Order.findById(req.params.id).populate('shop');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is the shop owner
  if (order.shop.owner.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this order');
  }

  const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  order.status = status;
  
  if (status === 'Delivered') {
    order.deliveredAt = new Date();
  }
  
  if (trackingInfo) {
    if (!order.trackingUpdates) {
      order.trackingUpdates = [];
    }
    order.trackingUpdates.push({
      status,
      message: trackingInfo.message || `Order ${status.toLowerCase()}`,
      timestamp: new Date()
    });
  }

  const updatedOrder = await order.save();

  res.json({
    success: true,
    message: 'Order status updated successfully',
    order: updatedOrder
  });
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .populate('shop', 'name logo phone address')
    .populate('orderItems.menuItem', 'name basePrice images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    orders,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  });
});

// @desc    Get shop orders (Shop owner only)
// @route   GET /api/orders/shop
// @access  Private
const getShopOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status;

  // Find user's shop
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  let query = { shop: shop._id };
  if (status) {
    query.status = status;
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name phone email')
    .populate('orderItems.menuItem', 'name basePrice images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    orders,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findById(req.params.id).populate('shop');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order or is the shop owner
  const isOwner = order.user.toString() === req.user._id.toString();
  const isShopOwner = order.shop.owner.toString() === req.user._id.toString();

  if (!isOwner && !isShopOwner) {
    res.status(401);
    throw new Error('Not authorized to cancel this order');
  }

  // Check if order can be cancelled
  const nonCancellableStatuses = ['Delivered', 'Cancelled'];
  if (nonCancellableStatuses.includes(order.status)) {
    res.status(400);
    throw new Error(`Cannot cancel order with status: ${order.status}`);
  }

  order.status = 'Cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = reason || 'No reason provided';
  order.cancelledBy = req.user._id;

  const updatedOrder = await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    order: updatedOrder
  });
});

// @desc    Add tracking update (Shop owner only)
// @route   POST /api/orders/:id/tracking
// @access  Private
const addTrackingUpdate = asyncHandler(async (req, res) => {
  const { message, location } = req.body;

  const order = await Order.findById(req.params.id).populate('shop');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is the shop owner
  if (order.shop.owner.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to add tracking updates');
  }

  if (!order.trackingUpdates) {
    order.trackingUpdates = [];
  }

  order.trackingUpdates.push({
    status: order.status,
    message,
    location,
    timestamp: new Date()
  });

  const updatedOrder = await order.save();

  res.json({
    success: true,
    message: 'Tracking update added successfully',
    order: updatedOrder
  });
});

// @desc    Get order analytics (Shop owner only)
// @route   GET /api/orders/analytics
// @access  Private
const getOrderAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  // Find user's shop
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const orders = await Order.find({
    shop: shop._id,
    createdAt: { $gte: startDate }
  });

  // Calculate analytics
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(order => order.paymentStatus === 'Paid')
    .reduce((sum, order) => sum + (order.orderSummary?.total || 0), 0);

  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Daily breakdown
  const dailyStats = {};
  orders.forEach(order => {
    const date = order.createdAt.toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { orders: 0, revenue: 0 };
    }
    dailyStats[date].orders += 1;
    if (order.paymentStatus === 'Paid') {
      dailyStats[date].revenue += order.orderSummary?.total || 0;
    }
  });

  res.json({
    success: true,
    analytics: {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      dailyStats,
      period
    }
  });
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getShopOrders,
  cancelOrder,
  addTrackingUpdate,
  getOrderAnalytics,
};