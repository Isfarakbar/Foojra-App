const mongoose = require('mongoose');

const ReviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
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
    isVerified: {
      type: Boolean,
      default: true, // Since review is tied to an order, it's verified
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews for the same order
ReviewSchema.index({ user: 1, order: 1 }, { unique: true });

// Static method to calculate average rating for a shop
ReviewSchema.statics.getAverageRating = async function(shopId) {
  const obj = await this.aggregate([
    {
      $match: { shop: shopId }
    },
    {
      $group: {
        _id: '$shop',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Shop').findByIdAndUpdate(shopId, {
      rating: obj[0] ? Math.round(obj[0].averageRating * 10) / 10 : 4,
      totalReviews: obj[0] ? obj[0].totalReviews : 0
    });
  } catch (err) {
    // Error updating shop rating
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.shop);
});

// Call getAverageRating before remove
ReviewSchema.pre('remove', function() {
  this.constructor.getAverageRating(this.shop);
});

module.exports = mongoose.model('Review', ReviewSchema);