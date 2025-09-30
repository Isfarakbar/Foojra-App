const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { handleValidationError } = require('../utils/errorHandler');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = '';
    
    if (file.fieldname === 'shopImage' || file.fieldname === 'shopLogo') {
      uploadPath = path.join(__dirname, '../uploads/shops');
    } else if (file.fieldname === 'menuItemImage') {
      uploadPath = path.join(__dirname, '../uploads/menu-items');
    } else if (file.fieldname === 'businessLicense' || file.fieldname === 'ownerCNIC') {
      uploadPath = path.join(__dirname, '../uploads/documents');
    } else {
      uploadPath = path.join(__dirname, '../uploads/misc');
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = file.fieldname + '-' + uniqueSuffix + fileExtension;
    cb(null, fileName);
  }
});

// File filter for images (PNG only for shop images and logo)
const imageFileFilter = (req, file, cb) => {
  if (file.fieldname === 'shopImage' || file.fieldname === 'shopLogo') {
    // Only PNG for shop images and logo
    const allowedTypes = /png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'image/png';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PNG files are allowed for shop images and logo!'));
    }
  } else {
    // Other image uploads (menu items, etc.) can use multiple formats
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
    }
  }
};

// File filter for documents (PDF only for business license)
const documentFileFilter = (req, file, cb) => {
  if (file.fieldname === 'businessLicense') {
    // Only PDF for business license
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for business license!'));
    }
  } else {
    // Other documents can use multiple formats
    const allowedTypes = /pdf|doc|docx|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, or image files are allowed for documents!'));
    }
  }
};

// Upload configurations
const uploadShopImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for shop images
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'shopImage' || file.fieldname === 'shopLogo') {
      imageFileFilter(req, file, cb);
    } else if (file.fieldname === 'businessLicense') {
      documentFileFilter(req, file, cb);
    } else {
      cb(new Error('Unexpected field name'));
    }
  }
}).fields([
  { name: 'shopImage', maxCount: 5 },
  { name: 'shopLogo', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 }
]);

const uploadMenuItemImage = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit
  },
  fileFilter: imageFileFilter
}).single('menuItemImage');

const uploadShopDocuments = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
  fileFilter: documentFileFilter
}).fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'ownerCNIC', maxCount: 1 }
]);

// Error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return handleValidationError(res, 'File too large. Maximum size allowed is 5MB for images and 10MB for documents.');
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return handleValidationError(res, 'Too many files uploaded.');
    }
  }
  
  if (error.message.includes('Only')) {
    return handleValidationError(res, error.message);
  }
  
  next(error);
};

// Helper function to delete uploaded files
const deleteUploadedFiles = (files) => {
  if (files) {
    Object.keys(files).forEach(fieldname => {
      files[fieldname].forEach(file => {
        fs.unlink(file.path, (err) => {
          // File deletion error handled silently
        });
      });
    });
  }
};

// Helper function to get file URL
const getFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

module.exports = {
  uploadShopImages,
  uploadMenuItemImage,
  uploadShopDocuments,
  handleMulterError,
  deleteUploadedFiles,
  getFileUrl
};