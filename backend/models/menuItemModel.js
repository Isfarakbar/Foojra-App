const mongoose = require('mongoose');

const MenuItemSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    // Enhanced pricing with variations
    basePrice: {
      type: Number,
      required: [true, 'Please add a base price'],
      min: [0, 'Price must be positive'],
    },
    // Price variations (sizes, portions, etc.)
    variations: [{
      name: { type: String, required: true }, // e.g., "Small", "Medium", "Large"
      price: { type: Number, required: true },
      description: String,
      isDefault: { type: Boolean, default: false }
    }],
    // Add-ons and extras
    addOns: [{
      name: { type: String, required: true }, // e.g., "Extra Cheese", "Spicy"
      price: { type: Number, required: true },
      category: String, // e.g., "Toppings", "Sides", "Drinks"
      isRequired: { type: Boolean, default: false }
    }],
    // Enhanced image management
    images: [{
      url: String,
      alt: String,
      isPrimary: { type: Boolean, default: false }
    }],
    // Enhanced categorization
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: [
        'Appetizer',
        'Main Course',
        'Dessert',
        'Beverage',
        'Side Dish',
        'Special',
        'Pizza',
        'Burger',
        'Sandwich',
        'Salad',
        'Soup',
        'Pasta',
        'Rice',
        'BBQ',
        'Chinese',
        'Fast Food',
        'Traditional',
        'Breakfast',
        'Lunch',
        'Dinner'
      ],
    },
    subCategory: {
      type: String, // More specific categorization
    },
    // Availability and timing
    isAvailable: {
      type: Boolean,
      default: true,
    },
    availabilitySchedule: {
      allDay: { type: Boolean, default: true },
      timeSlots: [{
        startTime: String, // e.g., "09:00"
        endTime: String,   // e.g., "23:00"
        days: [String]     // e.g., ["monday", "tuesday"]
      }]
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 15,
    },
    // Dietary information
    dietaryInfo: {
      isVegetarian: { type: Boolean, default: false },
      isVegan: { type: Boolean, default: false },
      isGlutenFree: { type: Boolean, default: false },
      isHalal: { type: Boolean, default: true }, // Default for Gojra
      isSpicy: { type: Boolean, default: false },
      spiceLevel: { type: Number, min: 0, max: 5, default: 0 }, // 0-5 scale
      allergens: [String], // e.g., ["nuts", "dairy", "eggs"]
    },
    // Nutritional information (optional)
    nutrition: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
    },
    // Popularity and analytics
    analytics: {
      totalOrders: { type: Number, default: 0 },
      rating: { type: Number, min: 1, max: 5, default: 4 },
      reviewCount: { type: Number, default: 0 },
      isPopular: { type: Boolean, default: false },
      isFeatured: { type: Boolean, default: false },
    },
    // Inventory management
    inventory: {
      isLimited: { type: Boolean, default: false },
      quantity: Number, // Available quantity if limited
      soldOut: { type: Boolean, default: false },
    },
    // Tags for better searchability
    tags: [String], // e.g., ["crispy", "cheesy", "homemade"]
    
    // Special offers
    offers: {
      hasDiscount: { type: Boolean, default: false },
      discountPercentage: Number,
      discountPrice: Number,
      offerDescription: String,
      validUntil: Date,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for current price (considering offers)
MenuItemSchema.virtual('currentPrice').get(function() {
  if (this.offers && this.offers.hasDiscount && this.offers.validUntil > new Date()) {
    return this.offers.discountPrice || (this.basePrice * (1 - this.offers.discountPercentage / 100));
  }
  return this.basePrice;
});

// Index for better search performance
MenuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });
MenuItemSchema.index({ shop: 1, category: 1 });
MenuItemSchema.index({ 'analytics.isPopular': -1, 'analytics.rating': -1 });

module.exports = mongoose.model('MenuItem', MenuItemSchema);