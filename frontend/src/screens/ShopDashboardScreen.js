import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ShopDashboardScreen.css';

const ShopDashboardScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Shop data
  const [shopData, setShopData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    todayOrders: 0,
    todayRevenue: 0,
    popularItems: [],
    recentOrders: []
  });

  // Orders data
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');

  // Menu items data
  const [menuItems, setMenuItems] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Shop status
  const [shopStatus, setShopStatus] = useState(true);

  // New menu item form
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: '',
    subCategory: '',
    preparationTime: '',
    isVegetarian: false,
    isVegan: false,
    isHalal: false,
    isSpicy: false,
    spiceLevel: 1,
    allergens: [],
    calories: '',
    isAvailable: true,
    tags: []
  });

  const [itemImages, setItemImages] = useState([]);

  useEffect(() => {
    checkAuth();
    fetchShopData();
    fetchDashboardStats();
    fetchOrders();
    fetchMenuItems();
  }, []);

  const checkAuth = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userInfo);
    if (user.role !== 'shop_owner') {
      navigate('/');
      return;
    }
  };

  const fetchShopData = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/shops/my-shop', config);
      setShopData(data);
      setShopStatus(data.isOpen);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch shop data');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/shops/dashboard', config);
      setDashboardStats(data);
    } catch (error) {
      setError('Failed to fetch dashboard stats');
    }
  };

  const fetchOrders = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/orders/shop-orders', config);
      setOrders(data);
    } catch (error) {
      setError('Failed to fetch orders');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/menu-items/my-items', config);
      setMenuItems(data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch menu items');
      setLoading(false);
    }
  };

  const toggleShopStatus = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.patch('/api/shops/toggle-status', {}, config);
      setShopStatus(data.isOpen);
      setSuccess(`Shop is now ${data.isOpen ? 'open' : 'closed'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update shop status');
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const formData = new FormData();
      
      // Add item data
      Object.keys(newItem).forEach(key => {
        if (Array.isArray(newItem[key])) {
          formData.append(key, JSON.stringify(newItem[key]));
        } else {
          formData.append(key, newItem[key]);
        }
      });

      // Add images
      itemImages.forEach(image => {
        formData.append('images', image);
      });

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      await axios.post('/api/menu-items', formData, config);
      setSuccess('Menu item added successfully');
      setShowAddItemModal(false);
      resetNewItemForm();
      fetchMenuItems();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add menu item');
    }
  };

  const resetNewItemForm = () => {
    setNewItem({
      name: '',
      description: '',
      basePrice: '',
      category: '',
      subCategory: '',
      preparationTime: '',
      isVegetarian: false,
      isVegan: false,
      isHalal: false,
      isSpicy: false,
      spiceLevel: 1,
      allergens: [],
      calories: '',
      isAvailable: true,
      tags: []
    });
    setItemImages([]);
  };

  const toggleItemAvailability = async (itemId, currentStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.patch(`/api/menu-items/${itemId}/availability`, 
        { isAvailable: !currentStatus }, 
        config
      );
      
      fetchMenuItems();
      setSuccess('Item availability updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update item availability');
    }
  };

  const getOrderStatusBadge = (status) => {
    const statusColors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      delivered: 'success',
      cancelled: 'danger'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    return order.status === orderFilter;
  });

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (!shopData) {
    return (
      <Container className="mt-5">
        <Alert variant="info">
          <h4>No Shop Found</h4>
          <p>You don't have a registered shop yet. Please register your shop first.</p>
          <Button variant="primary" onClick={() => navigate('/shop-owner/register')}>
            Register Shop
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="shop-dashboard">
      <Container fluid>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Header */}
        <Row className="dashboard-header mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="mb-1">{shopData.name}</h1>
                <p className="text-muted mb-0">{shopData.category} • {shopData.address.area}, {shopData.address.city}</p>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div className="shop-status">
                  <span className={`status-indicator ${shopStatus ? 'open' : 'closed'}`}></span>
                  <span className="fw-bold">{shopStatus ? 'OPEN' : 'CLOSED'}</span>
                </div>
                <Button 
                  variant={shopStatus ? 'outline-danger' : 'outline-success'}
                  onClick={toggleShopStatus}
                >
                  {shopStatus ? 'Close Shop' : 'Open Shop'}
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon orders">📦</div>
                <h3>{dashboardStats.totalOrders}</h3>
                <p>Total Orders</p>
                <small className="text-success">+{dashboardStats.todayOrders} today</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon revenue">💰</div>
                <h3>Rs. {dashboardStats.totalRevenue?.toLocaleString()}</h3>
                <p>Total Revenue</p>
                <small className="text-success">+Rs. {dashboardStats.todayRevenue?.toLocaleString()} today</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon rating">⭐</div>
                <h3>{dashboardStats.averageRating?.toFixed(1)}</h3>
                <p>Average Rating</p>
                <small className="text-muted">{dashboardStats.totalReviews} reviews</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon items">🍽️</div>
                <h3>{menuItems.length}</h3>
                <p>Menu Items</p>
                <small className="text-muted">{menuItems.filter(item => item.isAvailable).length} available</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content Tabs */}
        <Tabs activeKey={activeTab} onSelect={setActiveTab} className="dashboard-tabs mb-4">
          <Tab eventKey="overview" title="Overview">
            <Row>
              <Col md={8}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Recent Orders</h5>
                  </Card.Header>
                  <Card.Body>
                    {dashboardStats.recentOrders?.length > 0 ? (
                      <Table responsive>
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardStats.recentOrders.slice(0, 5).map(order => (
                            <tr key={order._id}>
                              <td>#{order._id.slice(-6)}</td>
                              <td>{order.user?.name}</td>
                              <td>{order.items?.length} items</td>
                              <td>Rs. {order.totalAmount}</td>
                              <td>{getOrderStatusBadge(order.status)}</td>
                              <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-muted text-center py-4">No recent orders</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Popular Items</h5>
                  </Card.Header>
                  <Card.Body>
                    {dashboardStats.popularItems?.length > 0 ? (
                      <div className="popular-items">
                        {dashboardStats.popularItems.slice(0, 5).map((item, index) => (
                          <div key={item._id} className="popular-item d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <h6 className="mb-1">{item.name}</h6>
                              <small className="text-muted">{item.totalOrders} orders</small>
                            </div>
                            <Badge bg="primary">#{index + 1}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-center py-4">No popular items yet</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="orders" title="Orders">
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">All Orders</h5>
                <Form.Select 
                  value={orderFilter} 
                  onChange={(e) => setOrderFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Card.Header>
              <Card.Body>
                {filteredOrders.length > 0 ? (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order._id}>
                          <td>#{order._id.slice(-6)}</td>
                          <td>
                            <div>
                              <div className="fw-bold">{order.user?.name}</div>
                              <small className="text-muted">{order.user?.phone}</small>
                            </div>
                          </td>
                          <td>
                            <div>
                              {order.items?.map((item, index) => (
                                <div key={index} className="small">
                                  {item.quantity}x {item.menuItem?.name}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>Rs. {order.totalAmount}</td>
                          <td>{getOrderStatusBadge(order.status)}</td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Button size="sm" variant="outline-primary">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted text-center py-4">No orders found</p>
                )}
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="menu" title="Menu Management">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">Menu Items ({menuItems.length})</h5>
              <Button variant="primary" onClick={() => setShowAddItemModal(true)}>
                Add New Item
              </Button>
            </div>

            <Row>
              {menuItems.map(item => (
                <Col md={6} lg={4} key={item._id} className="mb-4">
                  <Card className="menu-item-card">
                    <div className="item-image">
                      {item.images?.length > 0 ? (
                        <img src={item.images[0]} alt={item.name} />
                      ) : (
                        <div className="no-image">🍽️</div>
                      )}
                      <div className="item-status">
                        <Form.Check
                          type="switch"
                          checked={item.isAvailable}
                          onChange={() => toggleItemAvailability(item._id, item.isAvailable)}
                          label={item.isAvailable ? 'Available' : 'Unavailable'}
                        />
                      </div>
                    </div>
                    <Card.Body>
                      <h6 className="mb-2">{item.name}</h6>
                      <p className="text-muted small mb-2">{item.description}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Rs. {item.basePrice}</span>
                        <div>
                          <Button size="sm" variant="outline-primary" className="me-2">
                            Edit
                          </Button>
                          <Button size="sm" variant="outline-danger">
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Badge bg="secondary" className="me-1">{item.category}</Badge>
                        {item.isVegetarian && <Badge bg="success" className="me-1">Veg</Badge>}
                        {item.isVegan && <Badge bg="success" className="me-1">Vegan</Badge>}
                        {item.isHalal && <Badge bg="info" className="me-1">Halal</Badge>}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Tab>

          <Tab eventKey="settings" title="Shop Settings">
            <Row>
              <Col md={8}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Shop Information</h5>
                  </Card.Header>
                  <Card.Body>
                    <Button variant="primary" onClick={() => navigate('/shop-owner/edit-shop')}>
                      Update Shop Profile
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>

        {/* Add Menu Item Modal */}
        <Modal show={showAddItemModal} onHide={() => setShowAddItemModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Add New Menu Item</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleAddMenuItem}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Item Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Base Price (Rs.) *</Form.Label>
                    <Form.Control
                      type="number"
                      value={newItem.basePrice}
                      onChange={(e) => setNewItem({...newItem, basePrice: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category *</Form.Label>
                    <Form.Select
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="appetizers">Appetizers</option>
                      <option value="main_course">Main Course</option>
                      <option value="desserts">Desserts</option>
                      <option value="beverages">Beverages</option>
                      <option value="snacks">Snacks</option>
                      <option value="salads">Salads</option>
                      <option value="soups">Soups</option>
                      <option value="sides">Sides</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Preparation Time (minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      value={newItem.preparationTime}
                      onChange={(e) => setNewItem({...newItem, preparationTime: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={3}>
                  <Form.Check
                    type="checkbox"
                    label="Vegetarian"
                    checked={newItem.isVegetarian}
                    onChange={(e) => setNewItem({...newItem, isVegetarian: e.target.checked})}
                  />
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="checkbox"
                    label="Vegan"
                    checked={newItem.isVegan}
                    onChange={(e) => setNewItem({...newItem, isVegan: e.target.checked})}
                  />
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="checkbox"
                    label="Halal"
                    checked={newItem.isHalal}
                    onChange={(e) => setNewItem({...newItem, isHalal: e.target.checked})}
                  />
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="checkbox"
                    label="Spicy"
                    checked={newItem.isSpicy}
                    onChange={(e) => setNewItem({...newItem, isSpicy: e.target.checked})}
                  />
                </Col>
              </Row>

              <Form.Group className="mb-3 mt-3">
                <Form.Label>Item Images</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setItemImages(Array.from(e.target.files))}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAddItemModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add Item
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};

export default ShopDashboardScreen;