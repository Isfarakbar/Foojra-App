const asyncHandler = require('express-async-handler');
const MenuItemReview = require('../models/menuItemReviewModel');
const MenuItem = require('../models/menuItemModel');
const Order = require('../models/orderModel');

// @desc    Create a new menu item review
// @route   POST /api/menu-item-reviews
// @access  Private
const createMenuItemReview = asyncHandler(async (req, res) => {
  const { menuItem, order, rating, comment, aspects, wouldRecommend } = req.body;

  // Check if order exists and belongs to the user
  const orderExists = await Order.findOne({
    _id: order,
    user: req.user._id,
    status: 'Delivered'
  });

  if (!orderExists) {
    res.status(400);
    throw new Error('Order not found or not eligible for review');
  }

  // Check if menu item exists
  const menuItemExists = await MenuItem.findById(menuItem);
  if (!menuItemExists) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  // Verify menu item was in the order
  const orderContainsItem = orderExists.orderItems.some(item => 
    item.menuItem.toString() === menuItem
  );

  if (!orderContainsItem) {
    res.status(400);
    throw new Error('Menu item was not part of this order');
  }

  // Check if review already exists for this menu item in this order
  const existingReview = await MenuItemReview.findOne({
    user: req.user._id,
    menuItem: menuItem,
    order: order
  });

  if (existingReview) {
    res.status(400);
    throw new Error('Review already exists for this menu item in this order');
  }

  const review = await MenuItemReview.create({
    user: req.user._id,
    menuItem,
    order,
    rating,
    comment,
    aspects: aspects || {},
    wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true
  });

  const populatedReview = await MenuItemReview.findById(review._id)
    .populate('user', 'name')
    .populate('menuItem', 'name');

  res.status(201).json(populatedReview);
});

// @desc    Get reviews for a specific menu item
// @route   GET /api/menu-item-reviews/item/:menuItemId
// @access  Public
const getMenuItemReviews = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await MenuItemReview.find({ menuItem: req.params.menuItemId })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await MenuItemReview.countDocuments({ menuItem: req.params.menuItemId });

  res.json({
    reviews,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalReviews: total
  });
});

// @desc    Get user's menu item reviews
// @route   GET /api/menu-item-reviews/my-reviews
// @access  Private
const getUserMenuItemReviews = asyncHandler(async (req, res) => {
  const reviews = await MenuItemReview.find({ user: req.user._id })
    .populate('menuItem', 'name images basePrice')
    .populate('order', 'orderNumber')
    .sort({ createdAt: -1 });

  res.json(reviews);
});

// @desc    Update a menu item review
// @route   PUT /api/menu-item-reviews/:id
// @access  Private
const updateMenuItemReview = asyncHandler(async (req, res) => {
  const { rating, comment, aspects, wouldRecommend } = req.body;

  const review = await MenuItemReview.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user owns the review
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this review');
  }

  review.rating = rating || review.rating;
  review.comment = comment || review.comment;
  review.aspects = aspects || review.aspects;
  review.wouldRecommend = wouldRecommend !== undefined ? wouldRecommend : review.wouldRecommend;

  const updatedReview = await review.save();

  const populatedReview = await MenuItemReview.findById(updatedReview._id)
    .populate('user', 'name')
    .populate('menuItem', 'name');

  res.json(populatedReview);
});

// @desc    Delete a menu item review
// @route   DELETE /api/menu-item-reviews/:id
// @access  Private
const deleteMenuItemReview = asyncHandler(async (req, res) => {
  const review = await MenuItemReview.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user owns the review
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this review');
  }

  await review.remove();

  res.json({ message: 'Review removed' });
});

module.exports = {
  createMenuItemReview,
  getMenuItemReviews,
  getUserMenuItemReviews,
  updateMenuItemReview,
  deleteMenuItemReview
};