const express = require('express');
const router = express.Router();
const {
  getAdminAnalytics,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(protect, admin);

// @route   GET /api/admin/analytics
// @desc    Get comprehensive admin analytics
// @access  Private/Admin
router.get('/analytics', getAdminAnalytics);

module.exports = router;