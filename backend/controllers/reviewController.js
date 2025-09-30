const asyncHandler = require('express-async-handler');
const Review = require('../models/reviewModel');
const Order = require('../models/orderModel');
const Shop = require('../models/shopModel');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { shop, order, rating, comment } = req.body;

  // Check if order exists and belongs to the user
  const orderExists = await Order.findOne({
    _id: order,
    user: req.user._id,
    status: 'Delivered' // Only allow reviews for delivered orders
  });

  if (!orderExists) {
    res.status(400);
    throw new Error('Order not found or not eligible for review');
  }

  // Check if shop exists
  const shopExists = await Shop.findById(shop);
  if (!shopExists) {
    res.status(404);
    throw new Error('Shop not found');
  }

  // Check if review already exists for this order
  const existingReview = await Review.findOne({
    user: req.user._id,
    order: order
  });

  if (existingReview) {
    res.status(400);
    throw new Error('Review already exists for this order');
  }

  const review = await Review.create({
    user: req.user._id,
    shop,
    order,
    rating,
    comment
  });

  // Populate the review with user and shop data
  const populatedReview = await Review.findById(review._id)
    .populate('user', 'name')
    .populate('shop', 'name');

  res.status(201).json(populatedReview);
});

// @desc    Get reviews for a specific shop
// @route   GET /api/reviews/shop/:shopId
// @access  Public
const getShopReviews = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Review.countDocuments({ shop: shopId });
  const reviews = await Review.find({ shop: shopId })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    reviews,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  });
});

// @desc    Get reviews by user
// @route   GET /api/reviews/user
// @access  Private
const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('shop', 'name')
    .sort({ createdAt: -1 });

  res.json(reviews);
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if the review belongs to the user
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this review');
  }

  review.rating = rating || review.rating;
  review.comment = comment || review.comment;

  const updatedReview = await review.save();
  
  // Populate the updated review
  const populatedReview = await Review.findById(updatedReview._id)
    .populate('user', 'name')
    .populate('shop', 'name');

  res.json(populatedReview);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if the review belongs to the user
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this review');
  }

  await Review.findByIdAndDelete(req.params.id);

  res.json({ message: 'Review removed' });
});

// @desc    Get eligible orders for review
// @route   GET /api/reviews/eligible-orders
// @access  Private
const getEligibleOrders = asyncHandler(async (req, res) => {
  // Find delivered orders that don't have reviews yet
  const eligibleOrders = await Order.find({
    user: req.user._id,
    status: 'Delivered'
  }).populate('shop', 'name');

  // Filter out orders that already have reviews
  const reviewedOrderIds = await Review.find({ user: req.user._id }).distinct('order');
  const ordersWithoutReviews = eligibleOrders.filter(order => 
    !reviewedOrderIds.some(reviewedId => reviewedId.toString() === order._id.toString())
  );

  res.json(ordersWithoutReviews);
});

module.exports = {
  createReview,
  getShopReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getEligibleOrders
};