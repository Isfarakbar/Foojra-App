# Foojra - Food Delivery Platform

A full-stack food delivery application built with React.js frontend and Node.js/Express backend.

## Features

- **User Authentication**: Registration, login, and profile management
- **Shop Management**: Shop registration, menu management, and order processing
- **Order System**: Cart functionality, order placement, and tracking
- **Review System**: Customer reviews and ratings for shops and menu items
- **Admin Dashboard**: User and shop management capabilities

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- bcryptjs for password hashing

### Frontend
- React.js
- React Router for navigation
- Axios for API calls
- Bootstrap for styling
- React Bootstrap components

## Deployment

### Backend Deployment (Render.com)

1. **Prerequisites:**
   - MongoDB Atlas cluster set up
   - Render.com account

2. **Deploy Backend:**
   - Connect your GitHub repository to Render
   - Create a new Web Service
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Add environment variables:
     - `NODE_ENV=production`
     - `PORT=5000`
     - `MONGO_URI=your_mongodb_atlas_connection_string`
     - `JWT_SECRET=your_jwt_secret`
     - `JWT_EXPIRE=30d`

### Frontend Deployment (Render.com)

1. **Deploy Frontend:**
   - Create a new Static Site on Render
   - Set build command: `cd frontend && npm install && npm run build`
   - Set publish directory: `frontend/build`

2. **Update API URLs:**
   - Update frontend API base URL to point to deployed backend

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d
```

## Test Accounts

After running the database seeder, you can use these test accounts:

### Customers
- Email: `john@example.com` | Password: `123456`
- Email: `jane@example.com` | Password: `123456`

### Shop Owners
- Email: `pizza@example.com` | Password: `123456`
- Email: `burger@example.com` | Password: `123456`

### Admin
- Email: `admin@foojra.com` | Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Shops
- `GET /api/shops` - Get all shops
- `POST /api/shops/register` - Register new shop
- `GET /api/shops/:id` - Get shop details

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/myorders` - Get user orders
- `PUT /api/orders/:id/pay` - Update order payment status

## Local Development

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   npm run install-all
   ```
3. **Set up environment variables**
4. **Run the application:**
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License.