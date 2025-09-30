const express = require('express');
const router = express.Router();
const {
  createMenuItemReview,
  getMenuItemReviews,
  getUserMenuItemReviews,
  updateMenuItemReview,
  deleteMenuItemReview
} = require('../controllers/menuItemReviewController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.route('/item/:menuItemId').get(getMenuItemReviews);

// Protected routes
router.route('/').post(protect, createMenuItemReview);
router.route('/my-reviews').get(protect, getUserMenuItemReviews);
router.route('/:id').put(protect, updateMenuItemReview).delete(protect, deleteMenuItemReview);

module.exports = router;