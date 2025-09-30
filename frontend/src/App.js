import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Screens
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import ShopListScreen from './screens/ShopListScreen';
import ShopScreen from './screens/ShopScreen';
import CartScreen from './screens/CartScreen';
import ShippingScreen from './screens/ShippingScreen';
import PaymentScreen from './screens/PaymentScreen';
import PlaceOrderScreen from './screens/PlaceOrderScreen';
import OrderScreen from './screens/OrderScreen';
import CustomerDashboardScreen from './screens/CustomerDashboardScreen';
import ShopOwnerDashboardScreen from './screens/ShopOwnerDashboardScreen';
import ShopEditScreen from './screens/ShopEditScreen';
import MenuItemEditScreen from './screens/MenuItemEditScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminUserManagementScreen from './screens/AdminUserManagementScreen';
import ShopRegistrationScreen from './screens/ShopRegistrationScreen';
import ShopProfileScreen from './screens/ShopProfileScreen';
import MenuItemReviewScreen from './screens/MenuItemReviewScreen';
import MenuItemReviewsScreen from './screens/MenuItemReviewsScreen';
import ReviewScreen from './screens/ReviewScreen';
import ShopReviewsScreen from './screens/ShopReviewsScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';

const App = () => {
  return (
    <Router>
      <Header />
      <main className='py-3'>
        <Container>
          <Routes>
            <Route path='/' element={<HomeScreen />} />
            <Route path='/login' element={<LoginScreen />} />
            <Route path='/register' element={<RegisterScreen />} />
            <Route path='/profile' element={<ProfileScreen />} />
            <Route path='/shops' element={<ShopListScreen />} />
            <Route path='/shop/:id' element={<ShopScreen />} />
            <Route path='/cart' element={<CartScreen />} />
            <Route path='/cart/:id' element={<CartScreen />} />
            <Route path='/shipping' element={<ShippingScreen />} />
            <Route path='/payment' element={<PaymentScreen />} />
            <Route path='/placeorder' element={<PlaceOrderScreen />} />
            <Route path='/order/:id' element={<OrderScreen />} />
            <Route path='/orders' element={<OrderHistoryScreen />} />
            <Route path='/order/:id/track' element={<OrderTrackingScreen />} />
            <Route path='/dashboard' element={<CustomerDashboardScreen />} />
            <Route path='/shop-owner/dashboard' element={<ShopOwnerDashboardScreen />} />
            <Route path='/shop-owner/profile' element={<ShopProfileScreen />} />
            <Route path='/shop-owner/edit-shop' element={<ShopEditScreen />} />
            <Route path='/shop-owner/add-menu-item' element={<MenuItemEditScreen />} />
            <Route path='/shop-owner/edit-menu-item/:id' element={<MenuItemEditScreen />} />
            <Route path='/shop-owner/register' element={<ShopRegistrationScreen />} />
            <Route path='/admin' element={<AdminPanelScreen />} />
            <Route path='/admin/dashboard' element={<AdminDashboardScreen />} />
            <Route path='/admin/users' element={<AdminUserManagementScreen />} />
            <Route path='/review/:orderId' element={<ReviewScreen />} />
            <Route path='/review/:orderId/menu-item/:menuItemId' element={<MenuItemReviewScreen />} />
            <Route path='/menu-item/:menuItemId/reviews' element={<MenuItemReviewsScreen />} />
            <Route path='/shop/:shopId/reviews' element={<ShopReviewsScreen />} />
          </Routes>
        </Container>
      </main>
      <Footer />
      <ToastContainer />
    </Router>
  );
};

export default App;
