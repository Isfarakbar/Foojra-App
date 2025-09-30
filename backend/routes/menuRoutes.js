const express = require('express');
const router = express.Router();
const {
  createMenuItem,
  getMenuItemsByShop,
  getMyMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getMenuCategories,
  toggleMenuItemAvailability,
  bulkUpdateMenuItems,
} = require('../controllers/menuController');
const { protect, shopOwner } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Set up multer storage for menu item images
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/menu-items/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `menu-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
    );
  },
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only! (jpg, jpeg, png, webp)');
  }
}

const uploadMenuImages = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Public routes
router.get('/shop/:shopId', getMenuItemsByShop);
router.get('/shop/:shopId/categories', getMenuCategories);
router.get('/:id', getMenuItemById);

// Protected routes for shop owners
router.use(protect, shopOwner);

// Menu item CRUD operations
router.post('/', uploadMenuImages.array('images', 5), createMenuItem);
router.get('/my-items', getMyMenuItems);
router.put('/:id', uploadMenuImages.array('images', 5), updateMenuItem);
router.delete('/:id', deleteMenuItem);

// Menu item management
router.patch('/:id/availability', toggleMenuItemAvailability);
router.patch('/bulk-update', bulkUpdateMenuItems);

module.exports = router;