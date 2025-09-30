const mongoose = require('mongoose');

const ShopSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a shop name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Enhanced address with detailed location
    address: {
      street: {
        type: String,
        required: [true, 'Please add street address'],
      },
      area: {
        type: String,
        required: [true, 'Please add area/locality'],
      },
      city: {
        type: String,
        default: 'Gojra',
        required: true,
      },
      postalCode: {
        type: String,
        required: [true, 'Please add postal code'],
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      }
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      validate: {
        validator: function(v) {
          return /^(\+92|0)?3\d{9}$/.test(v.replace(/[\s-]/g, ''));
        },
        message: 'Please provide a valid Pakistani mobile number'
      }
    },
    // Enhanced image management
    images: [{
      url: String,
      alt: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],
    logo: {
      type: String,
      default: 'default-logo.jpg',
    },
    // Business Information
    businessInfo: {
      businessName: {
        type: String,
        required: [true, 'Please add business name'],
      },
      businessType: {
        type: String,
        enum: ['Restaurant', 'Fast Food', 'Cafe', 'Bakery', 'Grocery Store', 'Pharmacy', 'Home Shop', 'Others'],
        required: true,
      },
      ownerName: {
        type: String,
        required: [true, 'Please add owner name'],
      },
      ownerCNIC: {
        type: String,
        required: [true, 'Please add owner CNIC'],
        validate: {
          validator: function(v) {
            return /^\d{5}-\d{7}-\d{1}$/.test(v);
          },
          message: 'Please provide a valid CNIC format (XXXXX-XXXXXXX-X)'
        }
      },
      businessLicense: {
        type: String, // File path
      },
      taxNumber: String,
    },
    cuisine: {
      type: String,
      required: [true, 'Please specify cuisine type'],
    },
    category: {
      type: String,
      required: [true, 'Please specify shop category'],
      enum: ['Restaurant', 'Fast Food', 'Cafe', 'Bakery', 'Grocery Store', 'Pharmacy', 'Home Shop', 'Others'],
      default: 'Restaurant',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // Operating Hours
    operatingHours: {
      monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    },
    // Delivery Information
    deliveryInfo: {
      deliveryFee: {
        type: Number,
        default: 50, // Default delivery fee for Gojra
      },
      freeDeliveryThreshold: {
        type: Number,
        default: 500, // Free delivery above this amount
      },
      estimatedDeliveryTime: {
        min: { type: Number, default: 30 },
        max: { type: Number, default: 60 },
      },
      deliveryAreas: [{
        area: String,
        additionalFee: { type: Number, default: 0 }
      }],
      acceptsOnlinePayment: {
        type: Boolean,
        default: true,
      },
      acceptsCashOnDelivery: {
        type: Boolean,
        default: true,
      }
    },
    // Shop Status and Performance
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
      default: 4,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    isTemporarilyClosed: {
      type: Boolean,
      default: false,
    },
    minOrderAmount: {
      type: Number,
      default: 200, // Minimum order amount for Gojra
    },
    // Analytics and Performance
    analytics: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 },
      popularItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    },
    // Additional Features
    features: {
      hasTableBooking: { type: Boolean, default: false },
      hasPickup: { type: Boolean, default: true },
      hasDelivery: { type: Boolean, default: true },
      acceptsPreOrders: { type: Boolean, default: false },
    },
    // Social Media and Contact
    socialMedia: {
      facebook: String,
      instagram: String,
      whatsapp: String,
    },
    // Admin Notes
    adminNotes: {
      approvalNotes: String,
      rejectionReason: String,
      lastReviewDate: Date,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Cascade delete menu items when a shop is deleted
ShopSchema.pre('remove', async function (next) {
  await this.model('MenuItem').deleteMany({ shop: this._id });
  next();
});

// Reverse populate with menu items
ShopSchema.virtual('menuItems', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'shop',
  justOne: false,
});

module.exports = mongoose.model('Shop', ShopSchema);