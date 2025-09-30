const mongoose = require('mongoose');

const OrderSchema = mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Shop',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        images: [{ type: String }],
        basePrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        variations: [{
          name: { type: String },
          price: { type: Number },
          selected: { type: Boolean, default: false }
        }],
        addOns: [{
          name: { type: String },
          price: { type: Number },
          selected: { type: Boolean, default: false }
        }],
        specialInstructions: { type: String },
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'MenuItem',
        },
      },
    ],
    deliveryAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      area: { type: String, required: true },
      city: { type: String, required: true, default: 'Gojra' },
      postalCode: { type: String },
      landmark: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Cash on Delivery', 'Credit Card', 'Mobile Payment', 'Bank Transfer', 'EasyPaisa', 'JazzCash', 'PayPal', 'MobileBanking'],
      default: 'Cash on Delivery',
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
      transaction_id: { type: String },
      transactionId: { type: String },
      phoneNumber: { type: String },
      method: { type: String },
      timestamp: { type: String },
    },
    orderSummary: {
      itemsPrice: { type: Number, required: true, default: 0.0 },
      taxPrice: { type: Number, required: true, default: 0.0 },
      deliveryFee: { type: Number, required: true, default: 0.0 },
      discount: { type: Number, default: 0.0 },
      totalPrice: { type: Number, required: true, default: 0.0 },
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'],
      default: 'Pending',
    },
    statusHistory: [{
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      note: { type: String },
      updatedBy: { type: String } // 'customer', 'shop', 'admin', 'system'
    }],
    estimatedDeliveryTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 30,
    },
    deliveryInstructions: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ['None', 'Requested', 'Processing', 'Completed', 'Rejected'],
      default: 'None',
    },
    deliveryPartner: {
      name: { type: String },
      phone: { type: String },
      vehicleNumber: { type: String },
    },
    trackingUpdates: [{
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      location: {
        lat: { type: Number },
        lng: { type: Number }
      }
    }],
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
OrderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  next();
});

// Add status to history when status changes
OrderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: 'system'
    });
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);