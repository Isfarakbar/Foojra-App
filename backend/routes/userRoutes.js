const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(registerUser);
router.post('/login', loginUser);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin routes
router.get('/admin/all', protect, admin, getAllUsers);
router.get('/admin/:id', protect, admin, getUserById);
router.put('/admin/:id/role', protect, admin, updateUserRole);
router.put('/admin/:id/toggle-status', protect, admin, toggleUserStatus);

module.exports = router;