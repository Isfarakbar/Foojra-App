const mongoose = require('mongoose');

const MenuItemReviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide a comment'],
      maxlength: [500, 'Comment cannot be more than 500 characters'],
    },
    // Additional fields for menu item reviews
    aspects: {
      taste: { type: Number, min: 1, max: 5 },
      presentation: { type: Number, min: 1, max: 5 },
      portionSize: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
    },
    wouldRecommend: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: true, // Since review is tied to an order, it's verified
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews for the same menu item in the same order
MenuItemReviewSchema.index({ user: 1, menuItem: 1, order: 1 }, { unique: true });

// Static method to calculate average rating for a menu item
MenuItemReviewSchema.statics.getAverageRating = async function(menuItemId) {
  const obj = await this.aggregate([
    {
      $match: { menuItem: menuItemId }
    },
    {
      $group: {
        _id: '$menuItem',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        averageAspects: {
          taste: { $avg: '$aspects.taste' },
          presentation: { $avg: '$aspects.presentation' },
          portionSize: { $avg: '$aspects.portionSize' },
          valueForMoney: { $avg: '$aspects.valueForMoney' },
        },
        recommendationRate: {
          $avg: { $cond: ['$wouldRecommend', 1, 0] }
        }
      }
    }
  ]);

  try {
    await this.model('MenuItem').findByIdAndUpdate(menuItemId, {
      'analytics.rating': obj[0] ? Math.round(obj[0].averageRating * 10) / 10 : 4,
      'analytics.reviewCount': obj[0] ? obj[0].totalReviews : 0,
      'analytics.aspects': obj[0] ? {
        taste: Math.round(obj[0].averageAspects.taste * 10) / 10,
        presentation: Math.round(obj[0].averageAspects.presentation * 10) / 10,
        portionSize: Math.round(obj[0].averageAspects.portionSize * 10) / 10,
        valueForMoney: Math.round(obj[0].averageAspects.valueForMoney * 10) / 10,
      } : null,
      'analytics.recommendationRate': obj[0] ? Math.round(obj[0].recommendationRate * 100) : 0,
    });
  } catch (err) {
    console.error('Error updating menu item rating:', err);
  }
};

// Call getAverageRating after save
MenuItemReviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.menuItem);
});

// Call getAverageRating before remove
MenuItemReviewSchema.pre('remove', function() {
  this.constructor.getAverageRating(this.menuItem);
});

module.exports = mongoose.model('MenuItemReview', MenuItemReviewSchema);