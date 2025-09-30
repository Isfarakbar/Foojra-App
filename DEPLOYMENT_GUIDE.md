# Foojra Deployment Guide

## MongoDB Atlas Setup (Required First Step)

### 1. Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Verify your email

### 2. Create Free Cluster (M0 Sandbox)
1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier - 512MB storage)
3. Select AWS as provider
4. Choose a region close to you
5. Name your cluster: `foojra-cluster`
6. Click "Create Cluster" (takes 1-3 minutes)

### 3. Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `foojra_user`
5. Password: `Foojra2024Pass`
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### 4. Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Comment: "Foojra App Access"
5. Click "Confirm"

### 5. Get Connection String
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" driver version "4.1 or later"
5. Copy the connection string
6. Replace `<password>` with `Foojra2024Pass`
7. Add `/foojra_production` before the `?` for database name

**Final connection string format:**
```
mongodb+srv://foojra_user:Foojra2024Pass@foojra-cluster.xxxxx.mongodb.net/foojra_production?retryWrites=true&w=majority
```

## Render.com Deployment

### 1. Create GitHub Repository
1. Create new repository on GitHub
2. Push your local code to GitHub

### 2. Deploy Backend
1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `foojra-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `foojra_super_secret_jwt_key_production_2024_secure_random_string_xyz789`
   - `JWT_EXPIRE`: `30d`

6. Click "Create Web Service"

### 3. Deploy Frontend
1. Click "New +" → "Static Site"
2. Connect same GitHub repository
3. Configure:
   - **Name**: `foojra-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

4. Click "Create Static Site"

### 4. Update Frontend API URL
After backend deployment, update the frontend API base URL to point to your deployed backend.

## Test Accounts (After Seeding)

### Customers
- Email: `john@example.com` | Password: `123456`
- Email: `jane@example.com` | Password: `123456`

### Shop Owners  
- Email: `pizza@example.com` | Password: `123456`
- Email: `burger@example.com` | Password: `123456`

### Admin
- Email: `admin@foojra.com` | Password: `admin123`

## Troubleshooting

### Common Issues:
1. **Connection timeout**: Check network access allows 0.0.0.0/0
2. **Authentication failed**: Verify username/password in connection string
3. **Database not found**: Ensure database name is in connection string
4. **Build fails**: Check all dependencies are in package.json

### Support:
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Render.com: https://render.com/docs