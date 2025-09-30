const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Shop = require('../models/shopModel');
const MenuItem = require('../models/menuItemModel');
const Order = require('../models/orderModel');
const Review = require('../models/reviewModel');
const MenuItemReview = require('../models/menuItemReviewModel');
const connectDB = require('../config/db');

// Load environment variables
require('dotenv').config();

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@foojra.com',
    password: 'admin123',
    role: 'admin',
    phone: '03001234567',
    address: 'Admin Street, Central Area, Gojra, 35250'
  },
  {
    name: 'Shop Owner 1',
    email: 'owner1@foojra.com',
    password: 'owner123',
    role: 'shopOwner',
    phone: '03001234568',
    address: 'Shop Street 1, Market Area, Gojra, 35250'
  },
  {
    name: 'Shop Owner 2',
    email: 'owner2@foojra.com',
    password: 'owner123',
    role: 'shopOwner',
    phone: '03001234569',
    address: 'Shop Street 2, Commercial Area, Gojra, 35250'
  },
  {
    name: 'Customer 1',
    email: 'customer1@foojra.com',
    password: 'customer123',
    role: 'customer',
    phone: '03001234570',
    address: 'Customer Street 1, Residential Area, Gojra, 35250'
  },
  {
    name: 'Customer 2',
    email: 'customer2@foojra.com',
    password: 'customer123',
    role: 'customer',
    phone: '03001234571',
    address: 'Customer Street 2, Housing Society, Gojra, 35250'
  }
];

const shops = [
  {
    name: 'Delicious Bites',
    description: 'Authentic Pakistani cuisine with a modern twist',
    cuisine: 'Pakistani',
    category: 'Restaurant',
    address: {
      street: 'Main Bazaar Road',
      area: 'City Center',
      city: 'Gojra',
      postalCode: '35250',
      coordinates: {
        latitude: 31.1471,
        longitude: 72.6869
      }
    },
    phone: '+923001111111',
    businessInfo: {
      businessName: 'Delicious Bites Restaurant',
      businessType: 'Restaurant',
      ownerName: 'Shop Owner',
      ownerCNIC: '12345-1234567-1',
      businessLicense: 'BL123456789',
      taxNumber: 'TN987654321'
    },
    operatingHours: {
      monday: { open: '09:00', close: '23:00', isClosed: false },
      tuesday: { open: '09:00', close: '23:00', isClosed: false },
      wednesday: { open: '09:00', close: '23:00', isClosed: false },
      thursday: { open: '09:00', close: '23:00', isClosed: false },
      friday: { open: '09:00', close: '23:00', isClosed: false },
      saturday: { open: '09:00', close: '23:00', isClosed: false },
      sunday: { open: '10:00', close: '22:00', isClosed: false }
    },
    deliveryInfo: {
      deliveryFee: 50,
      freeDeliveryThreshold: 500,
      estimatedDeliveryTime: {
        min: 30,
        max: 45
      },
      acceptsOnlinePayment: true,
      acceptsCashOnDelivery: true
    },
    features: {
      hasDelivery: true,
      hasPickup: true,
      hasTableBooking: false,
      acceptsPreOrders: false
    },
    socialMedia: {
      facebook: 'https://facebook.com/deliciousbites',
      instagram: 'https://instagram.com/deliciousbites'
    },
    images: [
      {
        url: '/uploads/shops/shop1.jpg',
        alt: 'Delicious Bites - Main View',
        isPrimary: true
      }
    ],
    logo: '/uploads/shops/logo1.jpg',
    approvalStatus: 'approved',
    isOpen: true,
    rating: 4.5,
    totalReviews: 25,
    analytics: {
      totalOrders: 150,
      totalRevenue: 75000,
      averageOrderValue: 500
    }
  }
];

const menuItems = [
  {
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice cooked with tender chicken and traditional spices',
    basePrice: 350,
    category: 'Main Course',
    dietaryInfo: {
      isVegetarian: false,
      isVegan: false,
      isHalal: true,
      isSpicy: true,
      spiceLevel: 3
    },
    isAvailable: true,
    preparationTime: 25,
    tags: ['Basmati Rice', 'Chicken', 'Yogurt', 'Onions', 'Spices'],
    nutrition: {
      calories: 450,
      protein: 25,
      carbs: 55,
      fat: 12
    },
    images: [
      {
        url: '/uploads/menu/biryani.jpg',
        alt: 'Chicken Biryani',
        isPrimary: true
      }
    ],
    analytics: {
      rating: 4.7,
      reviewCount: 15,
      totalOrders: 45,
      isPopular: true
    }
  },
  {
    name: 'Beef Karahi',
    description: 'Tender beef cooked in traditional karahi with tomatoes and spices',
    basePrice: 450,
    category: 'Main Course',
    dietaryInfo: {
      isVegetarian: false,
      isVegan: false,
      isHalal: true,
      isSpicy: true,
      spiceLevel: 4
    },
    isAvailable: true,
    preparationTime: 30,
    tags: ['Beef', 'Tomatoes', 'Ginger', 'Garlic', 'Green Chilies'],
    nutrition: {
      calories: 380,
      protein: 30,
      carbs: 15,
      fat: 20
    },
    images: [
      {
        url: '/uploads/menu/karahi.jpg',
        alt: 'Beef Karahi',
        isPrimary: true
      }
    ],
    analytics: {
      rating: 4.5,
      reviewCount: 12,
      totalOrders: 32,
      isPopular: false
    }
  },
  {
    name: 'Fresh Lime Juice',
    description: 'Refreshing lime juice with mint and sugar',
    basePrice: 80,
    category: 'Beverage',
    dietaryInfo: {
      isVegetarian: true,
      isVegan: true,
      isHalal: true,
      isSpicy: false,
      spiceLevel: 0
    },
    isAvailable: true,
    preparationTime: 5,
    tags: ['Fresh Lime', 'Mint', 'Sugar', 'Water'],
    nutrition: {
      calories: 45,
      protein: 0,
      carbs: 12,
      fat: 0
    },
    images: [
      {
        url: '/uploads/menu/lime-juice.jpg',
        alt: 'Fresh Lime Juice',
        isPrimary: true
      }
    ],
    analytics: {
      rating: 4.2,
      reviewCount: 8,
      totalOrders: 28,
      isPopular: false
    }
  }
];

const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Shop.deleteMany();
    await MenuItem.deleteMany();
    await Order.deleteMany();
    await Review.deleteMany();
    await MenuItemReview.deleteMany();

    console.log('Data Destroyed...');

    // Create users
    const createdUsers = await User.insertMany(users);
    console.log('Users imported...');

    // Find shop owner and admin
    const shopOwner = createdUsers.find(user => user.email === 'owner1@foojra.com');
    const admin = createdUsers.find(user => user.email === 'admin@foojra.com');

    // Create shops with owner reference
    const shopsWithOwner = shops.map(shop => ({
      ...shop,
      owner: shopOwner._id
    }));

    const createdShops = await Shop.insertMany(shopsWithOwner);
    console.log('Shops imported...');

    // Create menu items with shop reference (no separate menu model)
    const shop = createdShops[0];
    const menuItemsWithRefs = menuItems.map(item => ({
      ...item,
      shop: shop._id
    }));

    const createdMenuItems = await MenuItem.insertMany(menuItemsWithRefs);
    console.log('Menu items imported...');

    // Create sample orders
    const customer1 = createdUsers.find(user => user.email === 'customer1@foojra.com');
    const customer2 = createdUsers.find(user => user.email === 'customer2@foojra.com');

    const orders = [
      {
        orderNumber: 'ORD-001',
        user: customer1._id,
        shop: shop._id,
        orderItems: [
          {
            name: createdMenuItems[0].name,
            quantity: 2,
            images: createdMenuItems[0].images,
            basePrice: createdMenuItems[0].basePrice,
            totalPrice: createdMenuItems[0].basePrice * 2,
            menuItem: createdMenuItems[0]._id,
          },
          {
            name: createdMenuItems[1].name,
            quantity: 1,
            images: createdMenuItems[1].images,
            basePrice: createdMenuItems[1].basePrice,
            totalPrice: createdMenuItems[1].basePrice,
            menuItem: createdMenuItems[1]._id,
          }
        ],
        deliveryAddress: {
          fullName: 'John Doe',
          phone: '+92-300-1234567',
          address: '123 Main Street',
          area: 'City Center',
          city: 'Gojra',
          postalCode: '35400'
        },
        paymentMethod: 'Cash on Delivery',
        orderSummary: {
          itemsPrice: (createdMenuItems[0].basePrice * 2) + createdMenuItems[1].basePrice,
          taxPrice: 0,
          deliveryFee: 50,
          totalPrice: (createdMenuItems[0].basePrice * 2) + createdMenuItems[1].basePrice + 50,
        },
        status: 'Delivered',
        isDelivered: true,
        deliveredAt: new Date(),
        isPaid: true,
        paidAt: new Date()
      },
      {
        orderNumber: 'ORD-002',
        user: customer2._id,
        shop: shop._id,
        orderItems: [
          {
            name: createdMenuItems[2].name,
            quantity: 1,
            images: createdMenuItems[2].images,
            basePrice: createdMenuItems[2].basePrice,
            totalPrice: createdMenuItems[2].basePrice,
            menuItem: createdMenuItems[2]._id,
          }
        ],
        deliveryAddress: {
          fullName: 'Jane Smith',
          phone: '+92-300-7654321',
          address: '456 Oak Avenue',
          area: 'Downtown',
          city: 'Gojra',
          postalCode: '35400'
        },
        paymentMethod: 'Cash on Delivery',
        orderSummary: {
          itemsPrice: createdMenuItems[2].basePrice,
          taxPrice: 0,
          deliveryFee: 50,
          totalPrice: createdMenuItems[2].basePrice + 50,
        },
        status: 'Delivered',
        isDelivered: true,
        deliveredAt: new Date(),
        isPaid: true,
        paidAt: new Date()
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log('Orders imported...');

    // Create sample reviews (now with order references)
    const reviews = [
      {
        user: customer1._id,
        shop: shop._id,
        order: createdOrders[0]._id,
        rating: 5,
        comment: 'Excellent food and fast delivery! Highly recommended.',
      },
      {
        user: customer2._id,
        shop: shop._id,
        order: createdOrders[1]._id,
        rating: 4,
        comment: 'Great taste, but delivery was a bit slow.',
      }
    ];

    await Review.insertMany(reviews);
    console.log('Reviews imported...');

    // Create menu item reviews
    const menuItemReviews = [
      {
        user: customer1._id,
        menuItem: createdMenuItems[0]._id,
        shop: shop._id,
        order: createdOrders[0]._id,
        rating: 5,
        comment: 'Best biryani in town!',
        aspects: {
          taste: 5,
          presentation: 4,
          portionSize: 5,
          valueForMoney: 4
        },
        wouldRecommend: true
      },
      {
        user: customer2._id,
        menuItem: createdMenuItems[1]._id,
        shop: shop._id,
        order: createdOrders[1]._id,
        rating: 4,
        comment: 'Good karahi, will order again.',
        aspects: {
          taste: 4,
          presentation: 3,
          portionSize: 4,
          valueForMoney: 4
        },
        wouldRecommend: true
      }
    ];

    await MenuItemReview.insertMany(menuItemReviews);
    console.log('Menu item reviews imported...');

    console.log('Data Import Success!');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Shop.deleteMany();
    await MenuItem.deleteMany();
    await Order.deleteMany();
    await Review.deleteMany();
    await MenuItemReview.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}