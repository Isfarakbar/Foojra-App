const asyncHandler = require('express-async-handler');
const MenuItem = require('../models/menuItemModel');
const Shop = require('../models/shopModel');

// @desc    Create a new menu item
// @route   POST /api/menu-items
// @access  Private/ShopOwner
const createMenuItem = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    basePrice,
    category,
    subCategory,
    preparationTime,
    dietaryInfo,
    nutrition,
    variations,
    addOns,
    availabilitySchedule,
    inventory,
    tags,
    offers
  } = req.body;

  // Get user's shop
  const userShop = await Shop.findOne({ owner: req.user._id });
  
  if (!userShop) {
    res.status(404);
    throw new Error('Shop not found. Please register your shop first.');
  }

  // Process uploaded images
  const images = req.files ? req.files.map(file => `/uploads/menu-items/${file.filename}`) : [];

  // Parse JSON fields if they're strings
  const parsedVariations = typeof variations === 'string' ? JSON.parse(variations) : variations || [];
  const parsedAddOns = typeof addOns === 'string' ? JSON.parse(addOns) : addOns || [];
  const parsedDietaryInfo = typeof dietaryInfo === 'string' ? JSON.parse(dietaryInfo) : dietaryInfo || {};
  const parsedNutrition = typeof nutrition === 'string' ? JSON.parse(nutrition) : nutrition || {};
  const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags || [];
  const parsedOffers = typeof offers === 'string' ? JSON.parse(offers) : offers || {};
  const parsedInventory = typeof inventory === 'string' ? JSON.parse(inventory) : inventory || {};
  const parsedSchedule = typeof availabilitySchedule === 'string' ? JSON.parse(availabilitySchedule) : availabilitySchedule || {};

  const menuItem = await MenuItem.create({
    name,
    description,
    basePrice: parseFloat(basePrice),
    category,
    subCategory,
    preparationTime: parseInt(preparationTime) || 15,
    images,
    dietaryInfo: parsedDietaryInfo,
    nutrition: parsedNutrition,
    variations: parsedVariations,
    addOns: parsedAddOns,
    availabilitySchedule: parsedSchedule,
    inventory: parsedInventory,
    tags: parsedTags,
    offers: parsedOffers,
    shop: userShop._id,
    isAvailable: true
  });

  res.status(201).json({
    success: true,
    message: 'Menu item created successfully',
    menuItem
  });
});

// @desc    Get menu items by shop ID
// @route   GET /api/menu/shop/:shopId
// @access  Public
const getMenuItemsByShop = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { 
    category, 
    subCategory, 
    isAvailable = true, 
    sortBy = 'name', 
    sortOrder = 'asc',
    page = 1,
    limit = 20,
    search
  } = req.query;

  // Build query
  let query = { shop: shopId };
  
  if (category) {
    query.category = category;
  }
  
  if (subCategory) {
    query.subCategory = subCategory;
  }
  
  if (isAvailable !== 'all') {
    query.isAvailable = isAvailable === 'true';
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  const total = await MenuItem.countDocuments(query);
  const menuItems = await MenuItem.find(query)
    .populate('shop', 'name')
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    menuItems,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  });
});

// @desc    Get menu items for shop owner
// @route   GET /api/menu/my-items
// @access  Private/ShopOwner
const getMyMenuItems = asyncHandler(async (req, res) => {
  const userShop = await Shop.findOne({ owner: req.user._id });
  
  if (!userShop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  const menuItems = await MenuItem.find({ shop: userShop._id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    menuItems
  });
});

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
const getMenuItemById = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id)
    .populate('shop', 'name address phone logo');

  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  res.json({
    success: true,
    menuItem
  });
});

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private/ShopOwner
const updateMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  // Check if user owns the shop
  const userShop = await Shop.findOne({ owner: req.user._id });
  if (!userShop || menuItem.shop.toString() !== userShop._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this menu item');
  }

  const {
    name,
    description,
    basePrice,
    category,
    subCategory,
    preparationTime,
    dietaryInfo,
    nutrition,
    variations,
    addOns,
    availabilitySchedule,
    inventory,
    tags,
    offers,
    isAvailable
  } = req.body;

  // Process new uploaded images
  const newImages = req.files ? req.files.map(file => `/uploads/menu-items/${file.filename}`) : [];
  
  // Parse JSON fields if they're strings
  const parsedVariations = typeof variations === 'string' ? JSON.parse(variations) : variations;
  const parsedAddOns = typeof addOns === 'string' ? JSON.parse(addOns) : addOns;
  const parsedDietaryInfo = typeof dietaryInfo === 'string' ? JSON.parse(dietaryInfo) : dietaryInfo;
  const parsedNutrition = typeof nutrition === 'string' ? JSON.parse(nutrition) : nutrition;
  const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
  const parsedOffers = typeof offers === 'string' ? JSON.parse(offers) : offers;
  const parsedInventory = typeof inventory === 'string' ? JSON.parse(inventory) : inventory;
  const parsedSchedule = typeof availabilitySchedule === 'string' ? JSON.parse(availabilitySchedule) : availabilitySchedule;

  // Update fields
  if (name !== undefined) menuItem.name = name;
  if (description !== undefined) menuItem.description = description;
  if (basePrice !== undefined) menuItem.basePrice = parseFloat(basePrice);
  if (category !== undefined) menuItem.category = category;
  if (subCategory !== undefined) menuItem.subCategory = subCategory;
  if (preparationTime !== undefined) menuItem.preparationTime = parseInt(preparationTime);
  if (parsedDietaryInfo !== undefined) menuItem.dietaryInfo = parsedDietaryInfo;
  if (parsedNutrition !== undefined) menuItem.nutrition = parsedNutrition;
  if (parsedVariations !== undefined) menuItem.variations = parsedVariations;
  if (parsedAddOns !== undefined) menuItem.addOns = parsedAddOns;
  if (parsedSchedule !== undefined) menuItem.availabilitySchedule = parsedSchedule;
  if (parsedInventory !== undefined) menuItem.inventory = parsedInventory;
  if (parsedTags !== undefined) menuItem.tags = parsedTags;
  if (parsedOffers !== undefined) menuItem.offers = parsedOffers;
  if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;
  
  // Update images if new ones are uploaded
  if (newImages.length > 0) {
    menuItem.images = newImages;
  }

  const updatedMenuItem = await menuItem.save();

  res.json({
    success: true,
    message: 'Menu item updated successfully',
    menuItem: updatedMenuItem
  });
});

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private/ShopOwner
const deleteMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  // Check if user owns the shop
  const userShop = await Shop.findOne({ owner: req.user._id });
  if (!userShop || menuItem.shop.toString() !== userShop._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this menu item');
  }

  await MenuItem.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Menu item deleted successfully'
  });
});

// @desc    Get menu categories for a shop
// @route   GET /api/menu/shop/:shopId/categories
// @access  Public
const getMenuCategories = asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  const categories = await MenuItem.distinct('category', { 
    shop: shopId, 
    isAvailable: true 
  });

  res.json({
    success: true,
    categories
  });
});

// @desc    Toggle menu item availability
// @route   PUT /api/menu/:id/toggle-availability
// @access  Private/ShopOwner
const toggleMenuItemAvailability = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  // Check if user owns the shop
  const userShop = await Shop.findOne({ owner: req.user._id });
  if (!userShop || menuItem.shop.toString() !== userShop._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this menu item');
  }

  menuItem.isAvailable = !menuItem.isAvailable;
  const updatedMenuItem = await menuItem.save();

  res.json({
    success: true,
    message: `Menu item ${updatedMenuItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
    menuItem: updatedMenuItem
  });
});

// @desc    Bulk update menu items
// @route   PUT /api/menu/bulk-update
// @access  Private/ShopOwner
const bulkUpdateMenuItems = asyncHandler(async (req, res) => {
  const { menuItemIds, updates } = req.body;

  if (!menuItemIds || !Array.isArray(menuItemIds) || menuItemIds.length === 0) {
    res.status(400);
    throw new Error('Menu item IDs are required');
  }

  // Check if user owns the shop for all menu items
  const userShop = await Shop.findOne({ owner: req.user._id });
  if (!userShop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  const menuItems = await MenuItem.find({ 
    _id: { $in: menuItemIds },
    shop: userShop._id 
  });

  if (menuItems.length !== menuItemIds.length) {
    res.status(401);
    throw new Error('Not authorized to update some menu items');
  }

  const result = await MenuItem.updateMany(
    { _id: { $in: menuItemIds } },
    { $set: updates }
  );

  res.json({
    success: true,
    message: `${result.modifiedCount} menu items updated successfully`,
    modifiedCount: result.modifiedCount
  });
});

module.exports = {
  createMenuItem,
  getMenuItemsByShop,
  getMyMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getMenuCategories,
  toggleMenuItemAvailability,
  bulkUpdateMenuItems,
};