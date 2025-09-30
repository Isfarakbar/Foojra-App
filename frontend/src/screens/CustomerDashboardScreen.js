import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';

const CustomerDashboardScreen = () => {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
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

    if (userInfoFromStorage.role !== 'customer') {
      navigate('/shop-owner/dashboard');
      return;
    }

    setUserInfo(userInfoFromStorage);

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders/myorders', {
          headers: {
            Authorization: `Bearer ${userInfoFromStorage.token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch orders');
        }

        setOrders(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrders();
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

  return (
    <div className="dashboard-container my-5">
      <h1 className="mb-4">My Dashboard</h1>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Row>
          <Col lg={4} md={12} className="mb-4">
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Profile Information</Card.Title>
                <div className="user-info">
                  <p><strong>Name:</strong> {userInfo.name}</p>
                  <p><strong>Email:</strong> {userInfo.email}</p>
                  <p><strong>Phone:</strong> {userInfo.phone || 'Not provided'}</p>
                  <p><strong>Address:</strong> {userInfo.address || 'Not provided'}</p>
                </div>
                <Button 
                  variant="outline-primary" 
                  className="w-100 mt-3"
                  onClick={() => navigate('/profile')}
                >
                  Edit Profile
                </Button>
              </Card.Body>
            </Card>
            
            <Card>
              <Card.Body>
                <Card.Title>Quick Actions</Card.Title>
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/')}
                  >
                    Browse Restaurants
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/cart')}
                  >
                    View Cart
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={8} md={12}>
            <Card>
              <Card.Body>
                <Card.Title>My Orders</Card.Title>
                {orders.length === 0 ? (
                  <Message>You haven't placed any orders yet.</Message>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover className="table-sm">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Date</th>
                          <th>Restaurant</th>
                          <th>Total</th>
                          <th className="d-none d-md-table-cell">Paid</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id}>
                            <td>{order._id.substring(0, 8)}...</td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>{order.shop.name}</td>
                            <td>${order.totalPrice}</td>
                            <td className="d-none d-md-table-cell">
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
                              <div className="d-flex flex-column flex-md-row gap-1">
                                <LinkContainer to={`/order/${order._id}`}>
                                  <Button variant="light" size="sm">
                                    Details
                                  </Button>
                                </LinkContainer>
                                {order.status === 'Delivered' && (
                                  <LinkContainer to={`/review/${order._id}`}>
                                    <Button variant="success" size="sm">
                                      Review
                                    </Button>
                                  </LinkContainer>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default CustomerDashboardScreen;