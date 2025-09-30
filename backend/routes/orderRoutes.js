const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getShopOrders,
  cancelOrder,
  addTrackingUpdate,
  getOrderAnalytics,
} = require('../controllers/orderController');
const { protect, shopOwner } = require('../middleware/authMiddleware');

// Public routes (none for orders)

// Protected routes for customers
router.route('/')
  .post(protect, addOrderItems);

router.route('/myorders')
  .get(protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/pay')
  .put(protect, updateOrderToPaid);

router.route('/:id/cancel')
  .put(protect, cancelOrder);

// Protected routes for shop owners
router.route('/shop')
  .get(protect, shopOwner, getShopOrders);

router.route('/analytics')
  .get(protect, shopOwner, getOrderAnalytics);

router.route('/:id/status')
  .put(protect, shopOwner, updateOrderStatus);

router.route('/:id/tracking')
  .post(protect, shopOwner, addTrackingUpdate);

module.exports = router;