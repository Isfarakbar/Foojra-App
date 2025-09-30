import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const OrderTrackingScreen = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchOrder = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      if (!userInfo) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setOrder(data);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch order details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (!loading) {
        fetchOrder(true); // Silent refresh
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [fetchOrder, loading]);

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
    return <Badge bg={statusColors[status] || 'secondary'} className="px-3 py-2">{status}</Badge>;
  };

  const getStatusProgress = (status) => {
    const statusOrder = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Pending': { icon: 'fas fa-clock', color: '#ffc107' },
      'Confirmed': { icon: 'fas fa-check-circle', color: '#17a2b8' },
      'Preparing': { icon: 'fas fa-utensils', color: '#007bff' },
      'Ready for Pickup': { icon: 'fas fa-box', color: '#28a745' },
      'Out for Delivery': { icon: 'fas fa-truck', color: '#17a2b8' },
      'Delivered': { icon: 'fas fa-check-double', color: '#28a745' },
      'Cancelled': { icon: 'fas fa-times-circle', color: '#dc3545' },
      'Refunded': { icon: 'fas fa-undo', color: '#6c757d' }
    };
    return icons[status] || { icon: 'fas fa-info-circle', color: '#6c757d' };
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

  const getEstimatedDeliveryTime = () => {
    if (!order) return null;
    
    if (order.estimatedDeliveryTime) {
      const estimatedTime = new Date(order.estimatedDeliveryTime);
      const now = new Date();
      const diffMinutes = Math.ceil((estimatedTime - now) / (1000 * 60));
      
      if (diffMinutes > 0) {
        return `Estimated delivery in ${diffMinutes} minutes`;
      } else if (order.status === 'Delivered') {
        return `Delivered at ${formatDate(order.deliveredAt || order.updatedAt)}`;
      } else {
        return 'Arriving soon';
      }
    }
    
    // Fallback estimation based on status
    const estimations = {
      'Pending': '45-60 minutes',
      'Confirmed': '40-55 minutes',
      'Preparing': '25-35 minutes',
      'Ready for Pickup': '15-25 minutes',
      'Out for Delivery': '10-15 minutes',
      'Delivered': 'Order delivered',
      'Cancelled': 'Order cancelled'
    };
    
    return estimations[order.status] || 'Time not available';
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch(`/api/orders/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({ reason: 'Cancelled by customer' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Order cancelled successfully');
        fetchOrder(); // Refresh the order details
      } else {
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  const canCancelOrder = () => {
    return order && ['Pending', 'Confirmed'].includes(order.status);
  };

  const renderStatusTimeline = () => {
    const statusOrder = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];
    const currentStatusIndex = statusOrder.indexOf(order?.status);
    
    return (
      <div className="status-timeline">
        {statusOrder.map((status, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          const statusInfo = getStatusIcon(status);
          
          return (
            <div key={status} className="timeline-item d-flex mb-4">
              <div className="timeline-marker">
                <div 
                  className={`timeline-dot ${isCurrent ? 'current' : isCompleted ? 'completed' : 'pending'}`}
                  style={{ 
                    backgroundColor: isCompleted ? statusInfo.color : '#e9ecef',
                    border: `2px solid ${isCompleted ? statusInfo.color : '#dee2e6'}`
                  }}
                >
                  <i 
                    className={statusInfo.icon} 
                    style={{ 
                      color: isCompleted ? 'white' : '#6c757d',
                      fontSize: '12px'
                    }}
                  ></i>
                </div>
                {index < statusOrder.length - 1 && (
                  <div 
                    className="timeline-line"
                    style={{
                      backgroundColor: isCompleted ? statusInfo.color : '#dee2e6'
                    }}
                  ></div>
                )}
              </div>
              <div className="timeline-content ms-3 flex-grow-1">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className={`mb-1 ${isCurrent ? 'text-primary fw-bold' : isCompleted ? 'text-success' : 'text-muted'}`}>
                    {status}
                  </h6>
                  {isCurrent && (
                    <small className="text-primary fw-bold">Current Status</small>
                  )}
                </div>
                {isCurrent && (
                  <p className="text-muted mb-0 small">
                    {getEstimatedDeliveryTime()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOrderSummary = () => {
    if (!order) return null;

    return (
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Order Summary</h5>
          <small className="text-muted">#{order.orderNumber || order._id.slice(-6)}</small>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <h6 className="text-muted mb-2">Restaurant</h6>
            <div className="d-flex align-items-center">
              <div className="me-3">
                <i className="fas fa-store-alt fa-2x text-primary"></i>
              </div>
              <div>
                <h6 className="mb-1">{order.shop?.name}</h6>
                <small className="text-muted">{order.shop?.address}</small>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <h6 className="text-muted mb-2">Delivery Address</h6>
            <div className="d-flex align-items-start">
              <i className="fas fa-map-marker-alt text-danger me-2 mt-1"></i>
              <div>
                <div>{order.shippingAddress?.address}</div>
                <small className="text-muted">
                  {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                </small>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <h6 className="text-muted mb-2">Order Items</h6>
            {order.orderItems?.map((item, index) => (
              <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <Badge bg="secondary" className="me-2">{item.qty}</Badge>
                  <span>{item.name}</span>
                </div>
                <span className="fw-bold">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          <hr />
          
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Total Amount</h6>
            <h5 className="mb-0 text-primary">{formatPrice(order.orderSummary?.totalPrice || order.totalPrice)}</h5>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container className="my-5">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading order details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Order</Alert.Heading>
          {error}
          <div className="mt-3">
            <Button variant="outline-primary" onClick={() => navigate('/orders')} className="me-2">
              Back to Orders
            </Button>
            <Button variant="outline-danger" onClick={() => fetchOrder()}>
              Try Again
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          Order not found.
          <div className="mt-3">
            <Button variant="outline-primary" onClick={() => navigate('/orders')}>
              Back to Orders
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Row>
        <Col>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="mb-2">
                <i className="fas fa-map-marker-alt me-2"></i>
                Track Order
              </h1>
              <p className="text-muted mb-0">Order #{order.orderNumber || order._id.slice(-6)}</p>
            </div>
            <div className="text-end">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => fetchOrder()}
                disabled={refreshing}
                className="me-2"
              >
                {refreshing ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt me-1"></i>
                    Refresh
                  </>
                )}
              </Button>
              <Button variant="outline-primary" size="sm" onClick={() => navigate('/orders')}>
                <i className="fas fa-arrow-left me-1"></i>
                Back to Orders
              </Button>
            </div>
          </div>

          <Row>
            <Col lg={8}>
              {/* Status Card */}
              <Card className="mb-4">
                <Card.Body>
                  <div className="text-center mb-4">
                    <div className="mb-3">
                      {(() => {
                        const statusInfo = getStatusIcon(order.status);
                        return (
                          <i 
                            className={statusInfo.icon} 
                            style={{ 
                              fontSize: '3rem', 
                              color: statusInfo.color 
                            }}
                          ></i>
                        );
                      })()}
                    </div>
                    <h3 className="mb-2">{order.status}</h3>
                    {getStatusBadge(order.status)}
                    <div className="mt-3">
                      <h5 className="text-primary">{getEstimatedDeliveryTime()}</h5>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <ProgressBar 
                      now={getStatusProgress(order.status)} 
                      variant="success"
                      style={{ height: '8px' }}
                    />
                  </div>

                  {/* Status Timeline */}
                  {renderStatusTimeline()}

                  {/* Action Buttons */}
                  <div className="text-center mt-4">
                    {canCancelOrder() && (
                      <Button 
                        variant="outline-danger" 
                        onClick={handleCancelOrder}
                        className="me-2"
                      >
                        <i className="fas fa-times me-1"></i>
                        Cancel Order
                      </Button>
                    )}
                    <Button 
                      variant="outline-primary" 
                      onClick={() => navigate(`/order/${order._id}`)}
                    >
                      <i className="fas fa-eye me-1"></i>
                      View Order Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              {/* Order Summary */}
              {renderOrderSummary()}

              {/* Contact Information */}
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Need Help?</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="outline-primary" size="sm">
                      <i className="fas fa-phone me-2"></i>
                      Call Restaurant
                    </Button>
                    <Button variant="outline-info" size="sm">
                      <i className="fas fa-comments me-2"></i>
                      Chat Support
                    </Button>
                  </div>
                  <hr />
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Order placed on {formatDate(order.createdAt)}
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Custom CSS for timeline */}
      <style jsx>{`
        .timeline-item {
          position: relative;
        }
        
        .timeline-marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .timeline-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }
        
        .timeline-line {
          width: 2px;
          height: 40px;
          margin-top: 8px;
        }
        
        .timeline-content {
          padding-top: 8px;
        }
        
        @media (max-width: 768px) {
          .timeline-dot {
            width: 32px;
            height: 32px;
          }
          
          .timeline-line {
            height: 32px;
          }
        }
      `}</style>
    </Container>
  );
};

export default OrderTrackingScreen;