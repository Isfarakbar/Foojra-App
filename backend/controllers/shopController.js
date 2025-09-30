const asyncHandler = require('express-async-handler');
const Shop = require('../models/shopModel');
const { uploadShopImages, uploadShopDocuments, getFileUrl } = require('../middleware/uploadMiddleware');
const { handleValidationError, handleNotFoundError, validateRequiredFields, validateResourceExists, validateOwnership } = require('../utils/errorHandler');

// @desc    Create a new shop (Enhanced Shop Registration)
// @route   POST /api/shops/register
// @access  Private/ShopOwner
const registerShop = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    address,
    phone,
    businessInfo,
    cuisine,
    category,
    operatingHours,
    deliveryInfo,
    socialMedia,
    features
  } = req.body;

  // Validate required fields
  validateRequiredFields({ name, description, phone, cuisine }, res);

  // Validate address
  const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
  if (!parsedAddress || !parsedAddress.street || !parsedAddress.area) {
    handleValidationError(res, 'Please provide complete address information: street and area are required');
  }

  // Validate business info
  const parsedBusinessInfo = typeof businessInfo === 'string' ? JSON.parse(businessInfo) : businessInfo;
  if (!parsedBusinessInfo || !parsedBusinessInfo.businessName || !parsedBusinessInfo.ownerName || !parsedBusinessInfo.ownerCNIC) {
    handleValidationError(res, 'Please provide complete business information: business name, owner name, and CNIC are required');
  }

  // Validate CNIC format
  const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
  if (!cnicPattern.test(parsedBusinessInfo.ownerCNIC)) {
    handleValidationError(res, 'CNIC format should be: 12345-1234567-1');
  }

  // Validate phone number format (basic validation for Pakistani numbers)
  const phonePattern = /^(\+92|0)?3\d{9}$/;
  if (!phonePattern.test(phone.replace(/[\s-]/g, ''))) {
    handleValidationError(res, 'Please provide a valid Pakistani mobile number');
  }

  // Check if user already has a shop
  const existingShop = await Shop.findOne({ owner: req.user._id });
  if (existingShop) {
    handleValidationError(res, 'You already have a registered shop');
  }

  // Validate that at least one shop image is uploaded
  if (!req.files || !req.files.shopImage || req.files.shopImage.length === 0) {
    handleValidationError(res, 'At least one shop image is required');
  }

  // Process uploaded images
  let shopImages = [];
  let logoUrl = '';

  if (req.files) {
    if (req.files.shopImage) {
      shopImages = req.files.shopImage.map((file, index) => ({
        url: getFileUrl(req, `shops/${file.filename}`),
        alt: `${name} - Image ${index + 1}`,
        isPrimary: index === 0
      }));
    }

    if (req.files.shopLogo && req.files.shopLogo[0]) {
      logoUrl = getFileUrl(req, `shops/${req.files.shopLogo[0].filename}`);
    }
  }

  // Parse remaining JSON strings from form data (address and businessInfo already parsed above)
  const parsedOperatingHours = typeof operatingHours === 'string' ? JSON.parse(operatingHours) : operatingHours;
  const parsedDeliveryInfo = typeof deliveryInfo === 'string' ? JSON.parse(deliveryInfo) : deliveryInfo;
  const parsedSocialMedia = typeof socialMedia === 'string' ? JSON.parse(socialMedia) : socialMedia;
  const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;

  // Create shop with comprehensive data
  const shop = await Shop.create({
    name,
    description,
    owner: req.user._id,
    address: {
      street: parsedAddress.street,
      area: parsedAddress.area,
      city: parsedAddress.city || 'Gojra',
      postalCode: parsedAddress.postalCode,
      coordinates: parsedAddress.coordinates
    },
    phone,
    images: shopImages,
    logo: logoUrl || 'default-logo.jpg',
    businessInfo: {
      businessName: parsedBusinessInfo.businessName,
      businessType: parsedBusinessInfo.businessType,
      ownerName: parsedBusinessInfo.ownerName,
      ownerCNIC: parsedBusinessInfo.ownerCNIC,
      businessLicense: req.files?.businessLicense ? 
        getFileUrl(req, `documents/${req.files.businessLicense[0].filename}`) : '',
      taxNumber: parsedBusinessInfo.taxNumber
    },
    cuisine,
    category,
    operatingHours: parsedOperatingHours || {
      monday: { open: '09:00', close: '22:00', isClosed: false },
      tuesday: { open: '09:00', close: '22:00', isClosed: false },
      wednesday: { open: '09:00', close: '22:00', isClosed: false },
      thursday: { open: '09:00', close: '22:00', isClosed: false },
      friday: { open: '09:00', close: '22:00', isClosed: false },
      saturday: { open: '09:00', close: '22:00', isClosed: false },
      sunday: { open: '10:00', close: '21:00', isClosed: false }
    },
    deliveryInfo: {
      deliveryFee: parsedDeliveryInfo?.deliveryFee || 50,
      freeDeliveryThreshold: parsedDeliveryInfo?.freeDeliveryThreshold || 500,
      estimatedDeliveryTime: parsedDeliveryInfo?.estimatedDeliveryTime || { min: 30, max: 60 },
      deliveryAreas: parsedDeliveryInfo?.deliveryAreas || [
        { area: 'City Center', additionalFee: 0 },
        { area: 'Satellite Town', additionalFee: 20 },
        { area: 'Model Town', additionalFee: 30 }
      ],
      acceptsOnlinePayment: parsedDeliveryInfo?.acceptsOnlinePayment !== false,
      acceptsCashOnDelivery: parsedDeliveryInfo?.acceptsCashOnDelivery !== false
    },
    socialMedia: parsedSocialMedia || {},
    features: parsedFeatures || {
      hasTableBooking: false,
      hasPickup: true,
      hasDelivery: true,
      acceptsPreOrders: false
    },
    approvalStatus: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Shop registration submitted successfully. Awaiting admin approval.',
    shop: {
      _id: shop._id,
      name: shop.name,
      category: shop.category,
      address: shop.address,
      phone: shop.phone,
      images: shop.images,
      logo: shop.logo,
      approvalStatus: shop.approvalStatus,
      businessInfo: {
        businessName: shop.businessInfo.businessName,
        businessType: shop.businessInfo.businessType
      }
    }
  });
});

// @desc    Get all approved shops with advanced filtering
// @route   GET /api/shops
// @access  Public
const getApprovedShops = asyncHandler(async (req, res) => {
  const { 
    search, 
    category, 
    cuisine, 
    area, 
    minRating, 
    sortBy = 'rating', 
    page = 1, 
    limit = 10,
    isOpen,
    hasDelivery,
    freeDelivery
  } = req.query;

  // Build filter object
  let filter = { approvalStatus: 'approved' };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { cuisine: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (cuisine) {
    filter.cuisine = { $regex: cuisine, $options: 'i' };
  }

  if (area) {
    filter['address.area'] = { $regex: area, $options: 'i' };
  }

  if (minRating) {
    filter.rating = { $gte: parseFloat(minRating) };
  }

  if (isOpen === 'true') {
    filter.isOpen = true;
  }

  if (hasDelivery === 'true') {
    filter['features.hasDelivery'] = true;
  }

  if (freeDelivery === 'true') {
    filter['deliveryInfo.freeDeliveryThreshold'] = { $lte: 500 };
  }

  // Build sort object
  let sort = {};
  switch (sortBy) {
    case 'rating':
      sort = { rating: -1, totalReviews: -1 };
      break;
    case 'deliveryTime':
      sort = { 'deliveryInfo.estimatedDeliveryTime.min': 1 };
      break;
    case 'deliveryFee':
      sort = { 'deliveryInfo.deliveryFee': 1 };
      break;
    case 'popularity':
      sort = { 'analytics.totalOrders': -1 };
      break;
    case 'newest':
      sort = { createdAt: -1 };
      break;
    default:
      sort = { rating: -1 };
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const shops = await Shop.find(filter)
    .populate('owner', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .select('-businessInfo.businessLicense -businessInfo.ownerCNIC -adminNotes');

  const total = await Shop.countDocuments(filter);

  res.json({
    shops,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalShops: total,
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1
    }
  });
});

// @desc    Get all pending shops (Admin only)
// @route   GET /api/shops/pending
// @access  Private/Admin
const getPendingShops = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Use mock data in development mode
  if (process.env.NODE_ENV === 'development' && !process.env.MONGO_URI?.includes('mongodb+srv')) {
    const shops = readMockData('shops');
    const users = readMockData('users');
    
    // Filter pending shops
    let pendingShops = shops.filter(shop => shop.approvalStatus === 'pending');
    
    // Populate owner information
    pendingShops = pendingShops.map(shop => ({
      ...shop,
      owner: users.find(user => user._id === shop.owner) || { name: 'Unknown', email: 'unknown@email.com', phone: 'N/A' }
    }));
    
    // Apply pagination
    const total = pendingShops.length;
    const paginatedShops = pendingShops.slice(skip, skip + limitNum);
    
    return res.json({
      shops: paginatedShops,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalShops: total
      }
    });
  }

  const shops = await Shop.find({ approvalStatus: 'pending' })
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Shop.countDocuments({ approvalStatus: 'pending' });

  res.json({
    shops,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalShops: total
    }
  });
});

// @desc    Get all rejected shops (Admin only)
// @route   GET /api/shops/rejected
// @access  Private/Admin
const getRejectedShops = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Use mock data in development mode
  if (process.env.NODE_ENV === 'development' && !process.env.MONGO_URI?.includes('mongodb+srv')) {
    const shops = readMockData('shops');
    const users = readMockData('users');
    
    // Filter rejected shops
    let rejectedShops = shops.filter(shop => shop.approvalStatus === 'rejected');
    
    // Populate owner information
    rejectedShops = rejectedShops.map(shop => ({
      ...shop,
      owner: users.find(user => user._id === shop.owner) || { name: 'Unknown', email: 'unknown@email.com', phone: 'N/A' }
    }));
    
    // Apply pagination
    const total = rejectedShops.length;
    const paginatedShops = rejectedShops.slice(skip, skip + limitNum);
    
    return res.json({
      shops: paginatedShops,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalShops: total
      }
    });
  }

  const shops = await Shop.find({ approvalStatus: 'rejected' })
    .populate('owner', 'name email phone')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Shop.countDocuments({ approvalStatus: 'rejected' });

  res.json({
    shops,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalShops: total
    }
  });
});

// @desc    Approve a shop (Admin only)
// @route   PUT /api/shops/:id/approve
// @access  Private/Admin
const approveShop = asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;
  
  const shop = await Shop.findById(req.params.id);
  validateResourceExists(shop, res, 'Shop not found');

  shop.approvalStatus = 'approved';
  shop.adminNotes = adminNotes || 'Shop approved by admin';
  shop.approvedAt = new Date();
  
  const updatedShop = await shop.save();
  
  res.json({
    success: true,
    message: 'Shop approved successfully',
    shop: {
      _id: updatedShop._id,
      name: updatedShop.name,
      approvalStatus: updatedShop.approvalStatus,
      approvedAt: updatedShop.approvedAt
    }
  });
});

// @desc    Reject a shop with reason (Admin only)
// @route   PUT /api/shops/:id/reject
// @access  Private/Admin
const rejectShop = asyncHandler(async (req, res) => {
  const { rejectionReason, adminNotes } = req.body;
  
  validateRequiredFields({ rejectionReason }, res);

  const shop = await Shop.findById(req.params.id);
  validateResourceExists(shop, res, 'Shop not found');

  shop.approvalStatus = 'rejected';
  shop.rejectionReason = rejectionReason;
  shop.adminNotes = adminNotes || rejectionReason;
  shop.rejectedAt = new Date();
  
  const updatedShop = await shop.save();
  
  res.json({
    success: true,
    message: 'Shop rejected successfully',
    shop: {
      _id: updatedShop._id,
      name: updatedShop.name,
      approvalStatus: updatedShop.approvalStatus,
      rejectionReason: updatedShop.rejectionReason,
      rejectedAt: updatedShop.rejectedAt
    }
  });
});

// @desc    Get shop by ID with detailed information
// @route   GET /api/shops/:id
// @access  Public
const getShopById = asyncHandler(async (req, res) => {
  // Use mock data in development mode
  if (process.env.NODE_ENV === 'development' && !process.env.MONGO_URI?.includes('mongodb+srv')) {
    const shops = readMockData('shops');
    const users = readMockData('users');
    const menuItems = readMockData('menuItems');
    
    // Find shop by ID
    const shop = shops.find(shop => shop._id === req.params.id);
    
    if (!shop) {
      res.status(404);
      throw new Error('Shop not found');
    }
    
    // Populate owner information
    const owner = users.find(user => user._id === shop.owner);
    const shopMenuItems = menuItems.filter(item => item.shop === shop._id && item.isAvailable);
    
    // Don't show sensitive business information to public
    const publicShop = {
      _id: shop._id,
      name: shop.name,
      description: shop.description,
      address: shop.address,
      phone: shop.phone,
      images: shop.images,
      logo: shop.logo,
      cuisine: shop.cuisine,
      category: shop.category,
      rating: shop.rating,
      totalReviews: shop.totalReviews,
      isOpen: shop.isOpen,
      operatingHours: shop.operatingHours,
      deliveryInfo: shop.deliveryInfo,
      features: shop.features,
      socialMedia: shop.socialMedia,
      menuItems: shopMenuItems.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
      createdAt: shop.createdAt
    };
    
    return res.json(publicShop);
  }

  const shop = await Shop.findById(req.params.id)
    .populate('owner', 'name email phone')
    .populate({
      path: 'menuItems',
      match: { isAvailable: true },
      options: { sort: { category: 1, name: 1 } }
    });

  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  // Don't show sensitive business information to public
  const publicShop = {
    _id: shop._id,
    name: shop.name,
    description: shop.description,
    address: shop.address,
    phone: shop.phone,
    images: shop.images,
    logo: shop.logo,
    cuisine: shop.cuisine,
    category: shop.category,
    rating: shop.rating,
    totalReviews: shop.totalReviews,
    isOpen: shop.isOpen,
    operatingHours: shop.operatingHours,
    deliveryInfo: shop.deliveryInfo,
    features: shop.features,
    socialMedia: shop.socialMedia,
    menuItems: shop.menuItems,
    createdAt: shop.createdAt
  };

  res.json(publicShop);
});

// @desc    Get shop owner's own shop details
// @route   GET /api/shops/my-shop
// @access  Private/ShopOwner
const getMyShop = asyncHandler(async (req, res) => {
  // Use mock data in development mode
  if (process.env.NODE_ENV === 'development' && !process.env.MONGO_URI?.includes('mongodb+srv')) {
    const shops = readMockData('shops');
    const users = readMockData('users');
    const menuItems = readMockData('menuItems');
    
    // Find shop owned by current user
    const shop = shops.find(shop => shop.owner === req.user._id);
    
    if (!shop) {
      res.status(404);
      throw new Error('No shop found for this user');
    }
    
    // Populate owner information
    const owner = users.find(user => user._id === shop.owner);
    const shopMenuItems = menuItems.filter(item => item.shop === shop._id);
    
    const populatedShop = {
      ...shop,
      owner: owner ? { name: owner.name, email: owner.email, phone: owner.phone } : null,
      menuItems: shopMenuItems
    };
    
    return res.json(populatedShop);
  }

  const shop = await Shop.findOne({ owner: req.user._id })
    .populate('owner', 'name email phone')
    .populate('menuItems');

  validateResourceExists(shop, res, 'No shop found for this user');

  res.json(shop);
});

// @desc    Update shop profile
// @route   PUT /api/shops/my-shop
// @access  Private/ShopOwner
const updateMyShop = asyncHandler(async (req, res) => {
  // Use mock data in development mode
  if (process.env.NODE_ENV === 'development' && !process.env.MONGO_URI?.includes('mongodb+srv')) {
    const shops = readMockData('shops');
    
    // Find shop owned by current user
    const shopIndex = shops.findIndex(shop => shop.owner === req.user._id);
    
    if (shopIndex === -1) {
      res.status(404);
      throw new Error('No shop found for this user');
    }
    
    const shop = shops[shopIndex];
    const {
      name,
      description,
      phone,
      operatingHours,
      deliveryInfo,
      socialMedia,
      features,
      isOpen
    } = req.body;
    
    // Update shop fields (in development mode, we'll just return success without file handling)
    const updatedShop = {
      ...shop,
      name: name || shop.name,
      description: description || shop.description,
      phone: phone || shop.phone,
      operatingHours: operatingHours || shop.operatingHours,
      deliveryInfo: { ...shop.deliveryInfo, ...deliveryInfo },
      socialMedia: { ...shop.socialMedia, ...socialMedia },
      features: { ...shop.features, ...features },
      isOpen: typeof isOpen !== 'undefined' ? isOpen : shop.isOpen
    };
    
    return res.json({
      success: true,
      message: 'Shop updated successfully',
      shop: updatedShop
    });
  }

  const shop = await Shop.findOne({ owner: req.user._id });

  validateResourceExists(shop, res, 'No shop found for this user');

  const {
    name,
    description,
    phone,
    operatingHours,
    deliveryInfo,
    socialMedia,
    features,
    isOpen
  } = req.body;

  // Process uploaded images if any
  let updatedImages = shop.images;
  let updatedLogo = shop.logo;

  if (req.files) {
    if (req.files.shopImage) {
      const newImages = req.files.shopImage.map((file, index) => ({
        url: getFileUrl(req, `shops/${file.filename}`),
        alt: `${name || shop.name} - Image ${index + 1}`,
        isPrimary: index === 0 && shop.images.length === 0
      }));
      updatedImages = [...shop.images, ...newImages];
    }

    if (req.files.shopLogo && req.files.shopLogo[0]) {
      updatedLogo = getFileUrl(req, `shops/${req.files.shopLogo[0].filename}`);
    }
  }

  // Parse JSON strings from form data
  const parsedOperatingHours = typeof operatingHours === 'string' ? JSON.parse(operatingHours) : operatingHours;
  const parsedDeliveryInfo = typeof deliveryInfo === 'string' ? JSON.parse(deliveryInfo) : deliveryInfo;
  const parsedSocialMedia = typeof socialMedia === 'string' ? JSON.parse(socialMedia) : socialMedia;
  const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;

  // Update shop fields
  shop.name = name || shop.name;
  shop.description = description || shop.description;
  shop.phone = phone || shop.phone;
  shop.images = updatedImages;
  shop.logo = updatedLogo;
  shop.operatingHours = parsedOperatingHours || shop.operatingHours;
  shop.deliveryInfo = { ...shop.deliveryInfo, ...parsedDeliveryInfo };
  shop.socialMedia = { ...shop.socialMedia, ...parsedSocialMedia };
  shop.features = { ...shop.features, ...parsedFeatures };
  
  if (typeof isOpen !== 'undefined') {
    shop.isOpen = isOpen;
  }

  const updatedShop = await shop.save();

  res.json({
    success: true,
    message: 'Shop updated successfully',
    shop: updatedShop
  });
});

// @desc    Toggle shop open/close status
// @route   PUT /api/shops/toggle-status
// @access  Private/ShopOwner
const toggleShopStatus = asyncHandler(async (req, res) => {
  // Use mock data in development mode
  if (process.env.NODE_ENV === 'development' && !process.env.MONGO_URI?.includes('mongodb+srv')) {
    const shops = readMockData('shops');
    
    // Find shop owned by current user
    const shop = shops.find(shop => shop.owner === req.user._id);
    
    if (!shop) {
      res.status(404);
      throw new Error('No shop found for this user');
    }
    
    const newStatus = !shop.isOpen;
    
    return res.json({
      success: true,
      message: `Shop ${newStatus ? 'opened' : 'closed'} successfully`,
      isOpen: newStatus
    });
  }

  const shop = await Shop.findOne({ owner: req.user._id });

  if (!shop) {
    res.status(404);
    throw new Error('No shop found for this user');
  }

  shop.isOpen = !shop.isOpen;
  const updatedShop = await shop.save();

  res.json({
    success: true,
    message: `Shop ${updatedShop.isOpen ? 'opened' : 'closed'} successfully`,
    isOpen: updatedShop.isOpen
  });
});

// @desc    Get shop analytics and dashboard data
// @route   GET /api/shops/dashboard
// @access  Private/ShopOwner
const getShopDashboard = asyncHandler(async (req, res) => {
  // Use mock data in development mode
  if (process.env.NODE_ENV === 'development' && !process.env.MONGO_URI?.includes('mongodb+srv')) {
    const shops = readMockData('shops');
    const orders = readMockData('orders');
    const menuItems = readMockData('menuItems');
    
    // Find shop owned by current user
    const shop = shops.find(shop => shop.owner === req.user._id);
    
    if (!shop) {
      res.status(404);
      throw new Error('No shop found for this user');
    }
    
    // Get shop orders
    const shopOrders = orders.filter(order => order.shop === shop._id);
    const deliveredOrders = shopOrders.filter(order => order.status === 'delivered');
    
    // Calculate today's date
    const today = new Date().setHours(0, 0, 0, 0);
    const todayOrders = shopOrders.filter(order => new Date(order.createdAt) >= today);
    const todayDeliveredOrders = deliveredOrders.filter(order => new Date(order.createdAt) >= today);
    
    // Calculate analytics
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const todayRevenue = todayDeliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Get popular items (shop menu items)
    const shopMenuItems = menuItems.filter(item => item.shop === shop._id);
    const popularItems = shopMenuItems.slice(0, 5).map(item => ({
      _id: item._id,
      name: item.name,
      currentPrice: item.currentPrice,
      analytics: { totalOrders: Math.floor(Math.random() * 50) + 1 }
    }));
    
    // Get recent orders
    const recentOrders = shopOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(order => ({
        ...order,
        user: { name: 'Mock User' }
      }));
    
    return res.json({
      shop: {
        _id: shop._id,
        name: shop.name,
        rating: shop.rating,
        totalReviews: shop.totalReviews,
        isOpen: shop.isOpen,
        approvalStatus: shop.approvalStatus
      },
      analytics: {
        totalOrders: shopOrders.length,
        todayOrders: todayOrders.length,
        totalRevenue,
        todayRevenue,
        averageOrderValue: shopOrders.length > 0 ? totalRevenue / shopOrders.length : 0
      },
      popularItems,
      recentOrders
    });
  }

  const shop = await Shop.findOne({ owner: req.user._id });

  validateResourceExists(shop, res, 'No shop found for this user');

  // Get recent orders, popular items, etc.
  const Order = require('../models/orderModel');
  const MenuItem = require('../models/menuItemModel');

  const [
    totalOrders,
    todayOrders,
    totalRevenue,
    todayRevenue,
    popularItems,
    recentOrders
  ] = await Promise.all([
    Order.countDocuments({ shop: shop._id }),
    Order.countDocuments({ 
      shop: shop._id, 
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } 
    }),
    Order.aggregate([
      { $match: { shop: shop._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([
      { 
        $match: { 
          shop: shop._id, 
          status: 'delivered',
          createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    MenuItem.find({ shop: shop._id })
      .sort({ 'analytics.totalOrders': -1 })
      .limit(5)
      .select('name analytics.totalOrders currentPrice'),
    Order.find({ shop: shop._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber totalAmount status createdAt user')
  ]);

  res.json({
    shop: {
      _id: shop._id,
      name: shop.name,
      rating: shop.rating,
      totalReviews: shop.totalReviews,
      isOpen: shop.isOpen,
      approvalStatus: shop.approvalStatus
    },
    analytics: {
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      averageOrderValue: totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0
    },
    popularItems,
    recentOrders
  });
});
module.exports = {
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
};