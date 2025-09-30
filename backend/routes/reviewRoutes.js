const express = require('express');
const router = express.Router();
const {
  createReview,
  getShopReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getEligibleOrders
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.route('/shop/:shopId').get(getShopReviews);

// Protected routes
router.route('/').post(protect, createReview);
router.route('/my-reviews').get(protect, getUserReviews);
router.route('/eligible-orders').get(protect, getEligibleOrders);
router.route('/:id').put(protect, updateReview).delete(protect, deleteReview);

module.exports = router;