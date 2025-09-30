const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dataPath = path.join(__dirname, '../data');

class MockDataHandler {
  constructor() {
    this.dataFiles = {
      users: path.join(dataPath, 'users.json'),
      shops: path.join(dataPath, 'shops.json'),
      menuItems: path.join(dataPath, 'menuItems.json'),
      orders: path.join(dataPath, 'orders.json'),
      reviews: path.join(dataPath, 'reviews.json')
    };
  }

  // Read data from file
  readData(collection) {
    try {
      const data = fs.readFileSync(this.dataFiles[collection], 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  // Write data to file
  writeData(collection, data) {
    try {
      fs.writeFileSync(this.dataFiles[collection], JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // User operations
  async createUser(userData) {
    const users = this.readData('users');
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = {
      _id: this.generateId(),
      ...userData,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    this.writeData('users', users);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async findUserByEmail(email) {
    const users = this.readData('users');
    return users.find(user => user.email === email);
  }

  async findUserById(id) {
    const users = this.readData('users');
    const user = users.find(user => user._id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  async validatePassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }

  generateJWT(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
  }

  // Shop operations
  createShop(shopData) {
    const shops = this.readData('shops');
    const newShop = {
      _id: this.generateId(),
      ...shopData,
      isApproved: false,
      rating: 0,
      totalReviews: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    shops.push(newShop);
    this.writeData('shops', shops);
    return newShop;
  }

  findShops(filter = {}) {
    const shops = this.readData('shops');
    let filteredShops = shops;

    if (filter.isApproved !== undefined) {
      filteredShops = filteredShops.filter(shop => shop.isApproved === filter.isApproved);
    }

    if (filter.owner) {
      filteredShops = filteredShops.filter(shop => shop.owner === filter.owner);
    }

    return filteredShops;
  }

  findShopById(id) {
    const shops = this.readData('shops');
    return shops.find(shop => shop._id === id);
  }

  updateShop(id, updateData) {
    const shops = this.readData('shops');
    const shopIndex = shops.findIndex(shop => shop._id === id);
    
    if (shopIndex === -1) {
      return null;
    }

    shops[shopIndex] = {
      ...shops[shopIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    this.writeData('shops', shops);
    return shops[shopIndex];
  }

  // Menu item operations
  createMenuItem(menuData) {
    const menuItems = this.readData('menuItems');
    const newMenuItem = {
      _id: this.generateId(),
      ...menuData,
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    menuItems.push(newMenuItem);
    this.writeData('menuItems', menuItems);
    return newMenuItem;
  }

  findMenuItems(filter = {}) {
    const menuItems = this.readData('menuItems');
    let filteredItems = menuItems;

    if (filter.shop) {
      filteredItems = filteredItems.filter(item => item.shop === filter.shop);
    }

    if (filter.category) {
      filteredItems = filteredItems.filter(item => item.category === filter.category);
    }

    return filteredItems;
  }

  getMenuItemsByShop(shopId) {
    const menuItems = this.readData('menuItems');
    return menuItems.filter(item => item.shop === shopId);
  }

  getMenuItemById(itemId) {
    const menuItems = this.readData('menuItems');
    return menuItems.find(item => item._id === itemId);
  }

  updateMenuItem(itemId, updateData) {
    const menuItems = this.readData('menuItems');
    const itemIndex = menuItems.findIndex(item => item._id === itemId);
    
    if (itemIndex !== -1) {
      menuItems[itemIndex] = {
        ...menuItems[itemIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.writeData('menuItems', menuItems);
      return menuItems[itemIndex];
    }
    
    return null;
  }

  deleteMenuItem(itemId) {
    const menuItems = this.readData('menuItems');
    const filteredItems = menuItems.filter(item => item._id !== itemId);
    this.writeData('menuItems', filteredItems);
    return true;
  }

  // Order operations
  createOrder(orderData) {
    const orders = this.readData('orders');
    const newOrder = {
      _id: this.generateId(),
      ...orderData,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.push(newOrder);
    this.writeData('orders', orders);
    return newOrder;
  }

  findOrders(filter = {}) {
    const orders = this.readData('orders');
    let filteredOrders = orders;

    if (filter.customer) {
      filteredOrders = filteredOrders.filter(order => order.customer === filter.customer);
    }

    if (filter.shop) {
      filteredOrders = filteredOrders.filter(order => order.shop === filter.shop);
    }

    return filteredOrders;
  }

  // Review operations
  createMenuItemReview(reviewData) {
    const reviews = this.readData('menuItemReviews') || [];
    const newReview = {
      _id: `menuItemReview${Date.now()}`,
      ...reviewData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: true
    };

    reviews.push(newReview);
    this.writeData('menuItemReviews', reviews);
    return newReview;
  }

  findReviews(filter = {}) {
    const reviews = this.readData('reviews');
    let filteredReviews = reviews;

    if (filter.shop) {
      filteredReviews = filteredReviews.filter(review => review.shop === filter.shop);
    }

    return filteredReviews;
  }
}

module.exports = new MockDataHandler();