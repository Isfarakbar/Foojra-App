import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Nav, Tab } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';

const ShopOwnerDashboardScreen = () => {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [shopInfo, setShopInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userInfoFromStorage = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfoFromStorage) {
      navigate('/login');
      return;
    }

    if (userInfoFromStorage.role !== 'shopOwner') {
      navigate('/dashboard');
      return;
    }

    setUserInfo(userInfoFromStorage);

    const fetchShopData = async () => {
      try {
        // Fetch shop information
        const shopResponse = await fetch('/api/shops/my-shop', {
          headers: {
            Authorization: `Bearer ${userInfoFromStorage.token}`,
          },
        });

        const shopData = await shopResponse.json();

        if (!shopResponse.ok) {
          throw new Error(shopData.message || 'Failed to fetch shop information');
        }

        setShopInfo(shopData);

        // Fetch shop's menu items
        const menuResponse = await fetch(`/api/menu/shop/${shopData._id}`, {
          headers: {
            Authorization: `Bearer ${userInfoFromStorage.token}`,
          },
        });

        const menuData = await menuResponse.json();

        if (!menuResponse.ok) {
          throw new Error(menuData.message || 'Failed to fetch menu items');
        }

        setMenuItems(menuData);

        // Fetch shop's orders
        const ordersResponse = await fetch(`/api/orders/shop/${shopData._id}`, {
          headers: {
            Authorization: `Bearer ${userInfoFromStorage.token}`,
          },
        });

        const ordersData = await ordersResponse.json();

        if (!ordersResponse.ok) {
          throw new Error(ordersData.message || 'Failed to fetch orders');
        }

        setOrders(ordersData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchShopData();
  }, [navigate]);

  // Helper function to get badge color based on order status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Processing':
        return 'info';
      case 'Out for delivery':
        return 'primary';
      case 'Delivered':
        return 'success';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      // Update orders in state
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: status } : order
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteMenuItem = async (menuItemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        const response = await fetch(`/api/menu/${menuItemId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete menu item');
        }

        // Update menu items in state
        setMenuItems(menuItems.filter((item) => item._id !== menuItemId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="dashboard-container my-5">
      <h1 className="mb-4">Shop Owner Dashboard</h1>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Shop Information</Card.Title>
                  <div className="shop-info">
                    <p><strong>Name:</strong> {shopInfo.name}</p>
                    <p><strong>Cuisine:</strong> {shopInfo.cuisine}</p>
                    <p><strong>Address:</strong> {shopInfo.address}</p>
                    <p><strong>Phone:</strong> {shopInfo.phone}</p>
                    <p><strong>Status:</strong> {shopInfo.isOpen ? 'Open' : 'Closed'}</p>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    className="w-100 mt-3 mb-2"
                    onClick={() => navigate('/shop-owner/profile')}
                  >
                    Manage Shop Profile
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={() => navigate('/shop-owner/edit-shop')}
                  >
                    Edit Shop Details
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={8}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Dashboard Overview</Card.Title>
                  <Row>
                    <Col md={4}>
                      <Card className="text-center mb-3">
                        <Card.Body>
                          <h3>{orders.length}</h3>
                          <p>Total Orders</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center mb-3">
                        <Card.Body>
                          <h3>{menuItems.length}</h3>
                          <p>Menu Items</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center mb-3">
                        <Card.Body>
                          <h3>
                            ${orders.reduce((acc, order) => acc + order.totalPrice, 0).toFixed(2)}
                          </h3>
                          <p>Total Revenue</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <div className="d-grid gap-2 mt-3">
                    <Button 
                      variant="primary" 
                      onClick={() => navigate('/shop-owner/add-menu-item')}
                    >
                      Add New Menu Item
                    </Button>
                    <Button 
                      variant={shopInfo.isOpen ? 'danger' : 'success'} 
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/shops/${shopInfo._id}/toggle-status`, {
                            method: 'PUT',
                            headers: {
                              Authorization: `Bearer ${userInfo.token}`,
                            },
                          });
                          
                          const data = await response.json();
                          
                          if (!response.ok) {
                            throw new Error(data.message || 'Failed to update shop status');
                          }
                          
                          setShopInfo({
                            ...shopInfo,
                            isOpen: !shopInfo.isOpen,
                          });
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                    >
                      {shopInfo.isOpen ? 'Close Shop' : 'Open Shop'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Tab.Container id="dashboard-tabs" defaultActiveKey="orders">
            <Row>
              <Col>
                <Nav variant="tabs" className="mb-3">
                  <Nav.Item>
                    <Nav.Link eventKey="orders">Orders</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="menu">Menu Items</Nav.Link>
                  </Nav.Item>
                </Nav>
                
                <Tab.Content>
                  <Tab.Pane eventKey="orders">
                    <Card>
                      <Card.Body>
                        <Card.Title>Recent Orders</Card.Title>
                        {orders.length === 0 ? (
                          <Message>No orders yet.</Message>
                        ) : (
                          <Table striped bordered hover responsive className="table-sm">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Paid</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map((order) => (
                                <tr key={order._id}>
                                  <td>{order._id.substring(0, 8)}...</td>
                                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                  <td>{order.user.name}</td>
                                  <td>${order.totalPrice}</td>
                                  <td>
                                    {order.isPaid ? (
                                      <Badge bg="success">Paid</Badge>
                                    ) : (
                                      <Badge bg="danger">Not Paid</Badge>
                                    )}
                                  </td>
                                  <td>
                                    <Badge bg={getStatusBadge(order.status)}>
                                      {order.status}
                                    </Badge>
                                  </td>
                                  <td>
                                    <div className="d-flex">
                                      <LinkContainer to={`/order/${order._id}`}>
                                        <Button variant="light" size="sm" className="me-2">
                                          Details
                                        </Button>
                                      </LinkContainer>
                                      
                                      <div className="dropdown">
                                        <Button 
                                          variant="outline-secondary" 
                                          size="sm" 
                                          className="dropdown-toggle" 
                                          id={`dropdown-${order._id}`}
                                          data-bs-toggle="dropdown"
                                        >
                                          Update
                                        </Button>
                                        <ul className="dropdown-menu" aria-labelledby={`dropdown-${order._id}`}>
                                          <li>
                                            <Button 
                                              variant="link" 
                                              className="dropdown-item"
                                              onClick={() => updateOrderStatus(order._id, 'Processing')}
                                            >
                                              Processing
                                            </Button>
                                          </li>
                                          <li>
                                            <Button 
                                              variant="link" 
                                              className="dropdown-item"
                                              onClick={() => updateOrderStatus(order._id, 'Out for delivery')}
                                            >
                                              Out for Delivery
                                            </Button>
                                          </li>
                                          <li>
                                            <Button 
                                              variant="link" 
                                              className="dropdown-item"
                                              onClick={() => updateOrderStatus(order._id, 'Delivered')}
                                            >
                                              Delivered
                                            </Button>
                                          </li>
                                          <li>
                                            <Button 
                                              variant="link" 
                                              className="dropdown-item"
                                              onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                                            >
                                              Cancel
                                            </Button>
                                          </li>
                                        </ul>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="menu">
                    <Card>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <Card.Title>Menu Items</Card.Title>
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => navigate('/shop-owner/add-menu-item')}
                          >
                            Add New Item
                          </Button>
                        </div>
                        
                        {menuItems.length === 0 ? (
                          <Message>No menu items yet. Add some items to your menu!</Message>
                        ) : (
                          <Table striped bordered hover responsive className="table-sm">
                            <thead>
                              <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Available</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {menuItems.map((item) => (
                                <tr key={item._id}>
                                  <td>
                                    <img 
                                      src={item.image || '/images/food-placeholder.svg'} 
                                      alt={item.name}
                                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                    />
                                  </td>
                                  <td>{item.name}</td>
                                  <td>{item.category}</td>
                                  <td>${item.price}</td>
                                  <td>
                                    {item.isAvailable ? (
                                      <Badge bg="success">Yes</Badge>
                                    ) : (
                                      <Badge bg="danger">No</Badge>
                                    )}
                                  </td>
                                  <td>
                                    <Button 
                                      variant="light" 
                                      size="sm" 
                                      className="me-2"
                                      onClick={() => navigate(`/shop-owner/edit-menu-item/${item._id}`)}
                                    >
                                      <i className="fas fa-edit"></i>
                                    </Button>
                                    <Button 
                                      variant="danger" 
                                      size="sm"
                                      onClick={() => deleteMenuItem(item._id)}
                                    >
                                      <i className="fas fa-trash"></i>
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </>
      )}
    </div>
  );
};

export default ShopOwnerDashboardScreen;