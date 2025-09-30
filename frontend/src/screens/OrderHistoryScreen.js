import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, Table, Form, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import OrderDetailsModal from '../components/OrderDetailsModal';

const OrderHistoryScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('desc');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      if (!userInfo) {
        navigate('/login');
        return;
      }

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/orders/myorders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, sortBy, sortOrder, navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status) => {
    const statusColors = {
      'Pending': 'warning',
      'Confirmed': 'info',
      'Preparing': 'primary',
      'Ready for Pickup': 'success',
      'Out for Delivery': 'info',
      'Delivered': 'success',
      'Cancelled': 'danger',
      'Refunded': 'secondary'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `Rs. ${price?.toFixed(2) || '0.00'}`;
  };

  const handleViewOrder = (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowOrderModal(true);
    }
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/order/${orderId}/track`);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });

      if (response.ok) {
        toast.success('Order cancelled successfully');
        fetchOrders(); // Refresh orders
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  const canCancelOrder = (order) => {
    return ['Pending', 'Confirmed'].includes(order.status);
  };

  const getEstimatedDeliveryTime = (order) => {
    if (order.estimatedDeliveryTime) {
      return formatDate(order.estimatedDeliveryTime);
    }
    if (order.status === 'Delivered' && order.deliveredAt) {
      return `Delivered at ${formatDate(order.deliveredAt)}`;
    }
    if (order.status === 'Out for Delivery') {
      return 'Arriving soon';
    }
    if (order.status === 'Preparing') {
      return 'Being prepared';
    }
    return 'Estimated time not available';
  };

  const getOrderIcon = (status) => {
    const icons = {
      'Pending': '⏳',
      'Confirmed': '✅',
      'Preparing': '👨‍🍳',
      'Ready for Pickup': '📦',
      'Out for Delivery': '🚚',
      'Delivered': '✅',
      'Cancelled': '❌',
      'Refunded': '💰'
    };
    return icons[status] || '📋';
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => setCurrentPage(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <div className="d-flex justify-content-center mt-4">
        <Pagination>
          <Pagination.Prev
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          />
          {items}
          <Pagination.Next
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          />
        </Pagination>
      </div>
    );
  };

  return (
    <Container className="my-5">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>
              <i className="fas fa-receipt me-2"></i>
              My Orders
            </h1>
            <Button variant="primary" onClick={() => navigate('/shops')}>
              <i className="fas fa-plus me-2"></i>
              Order Again
            </Button>
          </div>
          
          {/* Filters */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Filter by Status</Form.Label>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All Orders</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready for Pickup">Ready for Pickup</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Sort by</Form.Label>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="createdAt">Order Date</option>
                      <option value="totalPrice">Total Amount</option>
                      <option value="status">Status</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Order</Form.Label>
                    <Form.Select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Orders Display */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" size="lg">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3">Loading your orders...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <Alert.Heading>Error Loading Orders</Alert.Heading>
              {error}
              <div className="mt-3">
                <Button variant="outline-danger" onClick={fetchOrders}>
                  Try Again
                </Button>
              </div>
            </Alert>
          ) : orders.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <div className="mb-4">
                  <i className="fas fa-receipt" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
                </div>
                <h3>No Orders Yet</h3>
                <p className="text-muted mb-4">
                  You haven't placed any orders yet. Start exploring delicious food from local restaurants!
                </p>
                <Button variant="primary" size="lg" onClick={() => navigate('/shops')}>
                  <i className="fas fa-utensils me-2"></i>
                  Browse Restaurants
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              {/* Mobile-friendly Order Cards */}
              <div className="d-block d-md-none">
                {orders.map((order) => (
                  <Card key={order._id} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">
                            {getOrderIcon(order.status)} #{order.orderNumber || order._id.slice(-6)}
                          </h6>
                          <small className="text-muted">{formatDate(order.createdAt)}</small>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="mb-2">
                        <strong>{order.shop?.name}</strong>
                        <br />
                        <small className="text-muted">{order.shop?.address}</small>
                      </div>
                      
                      <div className="mb-2">
                        <small className="text-muted">Items:</small>
                        {order.orderItems?.slice(0, 2).map((item, index) => (
                          <div key={index} className="small">
                            {item.qty}x {item.name}
                          </div>
                        ))}
                        {order.orderItems?.length > 2 && (
                          <small className="text-muted">
                            +{order.orderItems.length - 2} more items
                          </small>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <span>Total:</span>
                          <strong>{formatPrice(order.orderSummary?.totalPrice || order.totalPrice)}</strong>
                        </div>
                        <small className="text-muted">
                          <i className="fas fa-clock me-1"></i>
                          {getEstimatedDeliveryTime(order)}
                        </small>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleViewOrder(order._id)}
                          className="flex-fill"
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-info"
                          onClick={() => handleTrackOrder(order._id)}
                          className="flex-fill"
                        >
                          Track Order
                        </Button>
                        {canCancelOrder(order) && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleCancelOrder(order._id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <Card className="d-none d-md-block">
                <Card.Header>
                  <h5 className="mb-0">Order History</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Shop</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Delivery Info</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">{getOrderIcon(order.status)}</span>
                              <strong>#{order.orderNumber || order._id.slice(-6)}</strong>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-bold">{order.shop?.name}</div>
                              <small className="text-muted">{order.shop?.address}</small>
                            </div>
                          </td>
                          <td>
                            <div>
                              {order.orderItems?.slice(0, 2).map((item, index) => (
                                <div key={index} className="small">
                                  {item.qty}x {item.name}
                                </div>
                              ))}
                              {order.orderItems?.length > 2 && (
                                <small className="text-muted">
                                  +{order.orderItems.length - 2} more items
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <strong>{formatPrice(order.orderSummary?.totalPrice || order.totalPrice)}</strong>
                          </td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td>
                            <small>{formatDate(order.createdAt)}</small>
                          </td>
                          <td>
                            <small className="text-muted">
                              <i className="fas fa-clock me-1"></i>
                              {getEstimatedDeliveryTime(order)}
                            </small>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleViewOrder(order._id)}
                                title="View Details"
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-info"
                                onClick={() => handleTrackOrder(order._id)}
                                title="Track Order"
                              >
                                <i className="fas fa-map-marker-alt"></i>
                              </Button>
                              {canCancelOrder(order) && (
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleCancelOrder(order._id)}
                                  title="Cancel Order"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
              {renderPagination()}
            </>
          )}
        </Col>
      </Row>

      {/* Order Details Modal */}
      <OrderDetailsModal
        show={showOrderModal}
        onHide={() => setShowOrderModal(false)}
        order={selectedOrder}
      />
    </Container>
  );
};

export default OrderHistoryScreen;