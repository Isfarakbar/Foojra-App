const express = require('express');
const router = express.Router();
const {
  registerShop,
  getApprovedShops,
  getPendingShops,
  getRejectedShops,
  approveShop,
  rejectShop,
  getShopById,
  getMyShop,
  updateMyShop,
  toggleShopStatus,
  getShopDashboard,
} = require('../controllers/shopController');
const { protect, shopOwner, admin } = require('../middleware/authMiddleware');
const { uploadShopImages, uploadShopDocuments } = require('../middleware/uploadMiddleware');

// Public routes
router.get('/approved', getApprovedShops);

// Protected routes - Shop Owner
router.use(protect);

// Shop registration with image and document uploads
router.post('/register', 
  uploadShopImages, 
  shopOwner, 
  registerShop
);

// Shop owner dashboard and management
router.get('/my-shop', shopOwner, getMyShop);
router.put('/my-shop', 
  uploadShopImages, 
  shopOwner, 
  updateMyShop
);
router.get('/dashboard', shopOwner, getShopDashboard);
router.put('/toggle-status', shopOwner, toggleShopStatus);

// Public route for getting shop by ID (must come after specific routes)
router.get('/:id', getShopById);

// Admin routes
router.get('/admin/pending', admin, getPendingShops);
router.get('/admin/approved', admin, getApprovedShops);
router.get('/admin/rejected', admin, getRejectedShops);
router.put('/admin/:id/approve', admin, approveShop);
router.put('/admin/:id/reject', admin, rejectShop);

module.exports = router;