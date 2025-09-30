const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Shop = require('../models/shopModel');
const MenuItem = require('../models/menuItemModel');
const Order = require('../models/orderModel');
const Review = require('../models/reviewModel');

// Load environment variables
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Shop.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

const seedUsers = async () => {
  const users = [
    {
      name: 'Admin User',
      email: 'admin@foojra.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      phone: '+1234567890',
      address: '123 Admin Street, Admin City, AC 12345, USA'
    },
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'customer',
      phone: '+1234567891',
      address: '456 Customer Ave, Customer City, CC 12346, USA'
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'customer',
      phone: '+1234567892',
      address: '789 User Blvd, User City, UC 12347, USA'
    },
    {
      name: 'Mike Johnson',
      email: 'mike@restaurant.com',
      password: await bcrypt.hash('password123', 10),
      role: 'shopOwner',
      phone: '+1234567893',
      address: '321 Owner Street, Owner City, OC 12348, USA'
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah@cafe.com',
      password: await bcrypt.hash('password123', 10),
      role: 'shopOwner',
      phone: '+1234567894',
      address: '654 Cafe Lane, Cafe City, CF 12349, USA'
    },
    {
      name: 'David Brown',
      email: 'david@pizza.com',
      password: await bcrypt.hash('password123', 10),
      role: 'shopOwner',
      phone: '+1234567895',
      address: '987 Pizza Road, Pizza Town, PT 12350, USA'
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log('Users seeded successfully');
  return createdUsers;
};

const seedShops = async (users) => {
  const shopOwners = users.filter(user => user.role === 'shopOwner');
  
  const shops = [
    {
      name: "Mike's Grill House",
      description: "Premium steakhouse with the finest cuts of meat and exceptional service",
      category: 'Restaurant',
      cuisine: 'American',
      owner: shopOwners[0]._id,
      address: '100 Grill Street, Foodie City, FC 54321, USA',
      phone: '+1234567896',
      email: 'contact@mikesgrill.com',
      approvalStatus: 'approved',
      rating: 4.5,
      totalReviews: 25
    },
    {
      name: "Sarah's Cozy Cafe",
      description: "Artisan coffee, fresh pastries, and a warm atmosphere perfect for work or relaxation",
      category: 'Restaurant',
      cuisine: 'Coffee & Pastries',
      owner: shopOwners[1]._id,
      address: '200 Coffee Lane, Brew City, BC 54322, USA',
      phone: '+1234567897',
      email: 'hello@sarahscafe.com',
      approvalStatus: 'approved',
      rating: 4.7,
      totalReviews: 18
    },
    {
      name: "David's Pizza Palace",
      description: "Authentic wood-fired pizzas with fresh ingredients and traditional recipes",
      category: 'Restaurant',
      cuisine: 'Italian',
      owner: shopOwners[2]._id,
      address: '300 Pizza Avenue, Italian Quarter, IQ 54323, USA',
      phone: '+1234567898',
      email: 'orders@davidspizza.com',
      approvalStatus: 'approved',
      rating: 4.3,
      totalReviews: 32
    }
  ];

  const createdShops = await Shop.insertMany(shops);
  console.log('Shops seeded successfully');
  return createdShops;
};

const seedMenuItems = async (shops) => {
  const menuItems = [
    // Mike's Grill House Menu
    {
      name: 'Premium Ribeye Steak',
      description: '12oz prime ribeye steak grilled to perfection, served with garlic mashed potatoes and seasonal vegetables',
      price: 32.99,
      category: 'Main Course',
      shop: shops[0]._id,
      isAvailable: true,
      preparationTime: 25,
      ingredients: ['ribeye steak', 'garlic', 'potatoes', 'seasonal vegetables', 'herbs'],
      nutritionalInfo: {
        calories: 650,
        protein: 45,
        carbs: 25,
        fat: 35
      }
    },
    {
      name: 'Grilled Salmon',
      description: 'Fresh Atlantic salmon with lemon herb butter, quinoa pilaf, and grilled asparagus',
      price: 28.99,
      category: 'Main Course',
      shop: shops[0]._id,
      isAvailable: true,
      preparationTime: 20,
      ingredients: ['salmon', 'lemon', 'herbs', 'quinoa', 'asparagus'],
      nutritionalInfo: {
        calories: 520,
        protein: 38,
        carbs: 30,
        fat: 25
      }
    },
    {
      name: 'Caesar Salad',
      description: 'Crisp romaine lettuce, parmesan cheese, croutons, and our signature Caesar dressing',
      price: 14.99,
      category: 'Appetizer',
      shop: shops[0]._id,
      isAvailable: true,
      preparationTime: 10,
      ingredients: ['romaine lettuce', 'parmesan', 'croutons', 'caesar dressing'],
      nutritionalInfo: {
        calories: 280,
        protein: 12,
        carbs: 15,
        fat: 20
      }
    },
    {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
      price: 9.99,
      category: 'Dessert',
      shop: shops[0]._id,
      isAvailable: true,
      preparationTime: 15,
      ingredients: ['chocolate', 'flour', 'eggs', 'vanilla ice cream'],
      nutritionalInfo: {
        calories: 420,
        protein: 6,
        carbs: 45,
        fat: 22
      }
    },

    // Sarah's Cozy Cafe Menu
    {
      name: 'Artisan Cappuccino',
      description: 'Rich espresso with perfectly steamed milk and beautiful latte art',
      price: 4.99,
      category: 'Beverage',
      shop: shops[1]._id,
      isAvailable: true,
      preparationTime: 5,
      ingredients: ['espresso', 'steamed milk', 'milk foam'],
      nutritionalInfo: {
        calories: 120,
        protein: 6,
        carbs: 10,
        fat: 6
      }
    },
    {
      name: 'Avocado Toast',
      description: 'Multigrain bread topped with smashed avocado, cherry tomatoes, and feta cheese',
      price: 12.99,
      category: 'Main Course',
      shop: shops[1]._id,
      isAvailable: true,
      preparationTime: 8,
      ingredients: ['multigrain bread', 'avocado', 'cherry tomatoes', 'feta cheese'],
      nutritionalInfo: {
        calories: 320,
        protein: 12,
        carbs: 28,
        fat: 18
      }
    },
    {
      name: 'Blueberry Muffin',
      description: 'Fresh baked muffin loaded with juicy blueberries and a hint of lemon',
      price: 3.99,
      category: 'Dessert',
      shop: shops[1]._id,
      isAvailable: true,
      preparationTime: 2,
      ingredients: ['flour', 'blueberries', 'lemon', 'sugar', 'butter'],
      nutritionalInfo: {
        calories: 280,
        protein: 4,
        carbs: 42,
        fat: 12
      }
    },
    {
      name: 'Green Smoothie',
      description: 'Spinach, banana, mango, and coconut water blend for a healthy boost',
      price: 7.99,
      category: 'Beverage',
      shop: shops[1]._id,
      isAvailable: true,
      preparationTime: 3,
      ingredients: ['spinach', 'banana', 'mango', 'coconut water'],
      nutritionalInfo: {
        calories: 180,
        protein: 3,
        carbs: 38,
        fat: 2
      }
    },

    // David's Pizza Palace Menu
    {
      name: 'Margherita Pizza',
      description: 'Classic pizza with San Marzano tomatoes, fresh mozzarella, and basil',
      price: 18.99,
      category: 'Main Course',
      shop: shops[2]._id,
      isAvailable: true,
      preparationTime: 15,
      ingredients: ['pizza dough', 'san marzano tomatoes', 'mozzarella', 'basil'],
      nutritionalInfo: {
        calories: 580,
        protein: 24,
        carbs: 65,
        fat: 22
      }
    },
    {
      name: 'Pepperoni Supreme',
      description: 'Loaded with pepperoni, Italian sausage, mushrooms, and bell peppers',
      price: 22.99,
      category: 'Main Course',
      shop: shops[2]._id,
      isAvailable: true,
      preparationTime: 18,
      ingredients: ['pizza dough', 'pepperoni', 'italian sausage', 'mushrooms', 'bell peppers'],
      nutritionalInfo: {
        calories: 720,
        protein: 32,
        carbs: 68,
        fat: 35
      }
    },
    {
      name: 'Garlic Breadsticks',
      description: 'Warm breadsticks brushed with garlic butter and served with marinara sauce',
      price: 8.99,
      category: 'Appetizer',
      shop: shops[2]._id,
      isAvailable: true,
      preparationTime: 10,
      ingredients: ['bread dough', 'garlic', 'butter', 'marinara sauce'],
      nutritionalInfo: {
        calories: 320,
        protein: 8,
        carbs: 45,
        fat: 12
      }
    },
    {
      name: 'Tiramisu',
      description: 'Traditional Italian dessert with coffee-soaked ladyfingers and mascarpone',
      price: 7.99,
      category: 'Dessert',
      shop: shops[2]._id,
      isAvailable: true,
      preparationTime: 5,
      ingredients: ['ladyfingers', 'coffee', 'mascarpone', 'cocoa powder'],
      nutritionalInfo: {
        calories: 380,
        protein: 8,
        carbs: 35,
        fat: 22
      }
    }
  ];

  const createdMenuItems = await MenuItem.insertMany(menuItems);
  console.log('Menu items seeded successfully');
  return createdMenuItems;
};

const seedOrders = async (users, shops, menuItems) => {
  const customers = users.filter(user => user.role === 'customer');
  
  const orders = [
    {
      user: customers[0]._id,
      shop: shops[0]._id,
      orderItems: [
        {
          menuItem: menuItems[0]._id,
          name: menuItems[0].name,
          price: menuItems[0].price,
          quantity: 1
        },
        {
          menuItem: menuItems[2]._id,
          name: menuItems[2].name,
          price: menuItems[2].price,
          quantity: 1
        }
      ],
      totalAmount: 47.98,
      status: 'Delivered',
      isPaid: true,
      shippingAddress: {
        address: '456 Customer Ave',
        city: 'Customer City',
        postalCode: '12346',
        country: 'USA'
      },
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000)
    },
    {
      user: customers[1]._id,
      shop: shops[1]._id,
      orderItems: [
        {
          menuItem: menuItems[4]._id,
          name: menuItems[4].name,
          price: menuItems[4].price,
          quantity: 2
        },
        {
          menuItem: menuItems[5]._id,
          name: menuItems[5].name,
          price: menuItems[5].price,
          quantity: 1
        }
      ],
      totalAmount: 22.97,
      status: 'Delivered',
      isPaid: true,
      shippingAddress: {
        address: '789 User Blvd',
        city: 'User City',
        postalCode: '12347',
        country: 'USA'
      },
      orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
    },
    {
      user: customers[0]._id,
      shop: shops[2]._id,
      orderItems: [
        {
          menuItem: menuItems[8]._id,
          name: menuItems[8].name,
          price: menuItems[8].price,
          quantity: 1
        },
        {
          menuItem: menuItems[10]._id,
          name: menuItems[10].name,
          price: menuItems[10].price,
          quantity: 1
        }
      ],
      totalAmount: 27.98,
      status: 'Processing',
      isPaid: true,
      shippingAddress: {
        address: '456 Customer Ave',
        city: 'Customer City',
        postalCode: '12346',
        country: 'USA'
      },
      orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      user: customers[1]._id,
      shop: shops[0]._id,
      orderItems: [
        {
          menuItem: menuItems[1]._id,
          name: menuItems[1].name,
          price: menuItems[1].price,
          quantity: 1
        },
        {
          menuItem: menuItems[3]._id,
          name: menuItems[3].name,
          price: menuItems[3].price,
          quantity: 1
        }
      ],
      totalAmount: 38.98,
      status: 'Pending',
      isPaid: true,
      shippingAddress: {
        address: '789 User Blvd',
        city: 'User City',
        postalCode: '12347',
        country: 'USA'
      },
      orderDate: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    }
  ];

  const createdOrders = await Order.insertMany(orders);
  console.log('Orders seeded successfully');
  return createdOrders;
};

const seedReviews = async (users, shops, orders) => {
  const customers = users.filter(user => user.role === 'customer');
  const deliveredOrders = orders.filter(order => order.status === 'Delivered');
  
  const reviews = [
    {
      user: customers[0]._id,
      shop: shops[0]._id,
      order: deliveredOrders[0]._id,
      rating: 5,
      comment: "Absolutely fantastic! The ribeye steak was cooked to perfection and the service was exceptional. Will definitely be back!",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      user: customers[1]._id,
      shop: shops[1]._id,
      order: deliveredOrders[1]._id,
      rating: 4,
      comment: "Great coffee and cozy atmosphere. The avocado toast was fresh and delicious. Perfect spot for working remotely.",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
    }
  ];

  const createdReviews = await Review.insertMany(reviews);
  console.log('Reviews seeded successfully');
  return createdReviews;
};

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    await connectDB();
    await clearDatabase();
    
    const users = await seedUsers();
    const shops = await seedShops(users);
    const menuItems = await seedMenuItems(shops);
    const orders = await seedOrders(users, shops, menuItems);
    const reviews = await seedReviews(users, shops, orders);
    
    console.log('\n=== SEEDING COMPLETED SUCCESSFULLY ===');
    console.log(`✅ Users: ${users.length}`);
    console.log(`✅ Shops: ${shops.length}`);
    console.log(`✅ Menu Items: ${menuItems.length}`);
    console.log(`✅ Orders: ${orders.length}`);
    console.log(`✅ Reviews: ${reviews.length}`);
    
    console.log('\n=== TEST ACCOUNTS ===');
    console.log('Admin: admin@foojra.com / admin123');
    console.log('Customer 1: john@example.com / password123');
    console.log('Customer 2: jane@example.com / password123');
    console.log('Shop Owner 1: mike@restaurant.com / password123');
    console.log('Shop Owner 2: sarah@cafe.com / password123');
    console.log('Shop Owner 3: david@pizza.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  seedDatabase();
}

module.exports = { seedDatabase };