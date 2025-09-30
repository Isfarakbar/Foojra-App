import React from 'react';
import { Modal, Row, Col, Badge, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const OrderDetailsModal = ({ show, onHide, order }) => {
  const navigate = useNavigate();

  if (!order) return null;

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

  const getStatusIcon = (status) => {
    const icons = {
      'Pending': 'fas fa-clock',
      'Confirmed': 'fas fa-check-circle',
      'Preparing': 'fas fa-utensils',
      'Ready for Pickup': 'fas fa-box',
      'Out for Delivery': 'fas fa-truck',
      'Delivered': 'fas fa-check-double',
      'Cancelled': 'fas fa-times-circle',
      'Refunded': 'fas fa-undo'
    };
    return icons[status] || 'fas fa-info-circle';
  };

  const handleTrackOrder = () => {
    onHide();
    navigate(`/order/${order._id}/track`);
  };

  const handleOrderAgain = () => {
    onHide();
    navigate(`/shop/${order.shop?._id}`);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center">
          <i className="fas fa-receipt me-2 text-primary"></i>
          Order Details
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="px-4">
        {/* Order Header */}
        <div className="text-center mb-4 p-3 bg-light rounded">
          <div className="mb-2">
            <i className={`${getStatusIcon(order.status)} fa-2x text-primary`}></i>
          </div>
          <h5 className="mb-2">Order #{order.orderNumber || order._id.slice(-6)}</h5>
          {getStatusBadge(order.status)}
          <div className="mt-2">
            <small className="text-muted">
              Placed on {formatDate(order.createdAt)}
            </small>
          </div>
        </div>

        <Row>
          <Col md={6}>
            {/* Restaurant Information */}
            <Card className="mb-3 border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-3">
                  <i className="fas fa-store me-2"></i>
                  Restaurant
                </h6>
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                         style={{ width: '50px', height: '50px' }}>
                      <i className="fas fa-utensils"></i>
                    </div>
                  </div>
                  <div>
                    <h6 className="mb-1">{order.shop?.name || 'Restaurant Name'}</h6>
                    <small className="text-muted">
                      {order.shop?.address || 'Restaurant Address'}
                    </small>
                    {order.shop?.phone && (
                      <div>
                        <small className="text-muted">
                          <i className="fas fa-phone me-1"></i>
                          {order.shop.phone}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Delivery Information */}
            <Card className="mb-3 border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-3">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Delivery Address
                </h6>
                <div className="d-flex align-items-start">
                  <div className="me-3">
                    <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center" 
                         style={{ width: '40px', height: '40px' }}>
                      <i className="fas fa-home"></i>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1">
                      {order.shippingAddress?.address || order.deliveryAddress?.address}
                    </div>
                    <small className="text-muted">
                      {order.shippingAddress?.city || order.deliveryAddress?.city}, {' '}
                      {order.shippingAddress?.postalCode || order.deliveryAddress?.postalCode}
                    </small>
                    {(order.shippingAddress?.phone || order.deliveryAddress?.phone) && (
                      <div>
                        <small className="text-muted">
                          <i className="fas fa-phone me-1"></i>
                          {order.shippingAddress?.phone || order.deliveryAddress?.phone}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            {/* Payment Information */}
            <Card className="mb-3 border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-3">
                  <i className="fas fa-credit-card me-2"></i>
                  Payment Details
                </h6>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Payment Method:</span>
                  <span className="fw-bold">{order.paymentMethod || 'Cash on Delivery'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Payment Status:</span>
                  <Badge bg={order.isPaid ? 'success' : 'warning'}>
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
                {order.paidAt && (
                  <div className="mt-2">
                    <small className="text-muted">
                      Paid on {formatDate(order.paidAt)}
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Delivery Partner */}
            {order.deliveryPartner && (
              <Card className="mb-3 border-0 shadow-sm">
                <Card.Body>
                  <h6 className="text-muted mb-3">
                    <i className="fas fa-motorcycle me-2"></i>
                    Delivery Partner
                  </h6>
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="fas fa-user"></i>
                      </div>
                    </div>
                    <div>
                      <div className="fw-bold">{order.deliveryPartner.name}</div>
                      {order.deliveryPartner.phone && (
                        <small className="text-muted">
                          <i className="fas fa-phone me-1"></i>
                          {order.deliveryPartner.phone}
                        </small>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Order Items */}
        <Card className="mb-3 border-0 shadow-sm">
          <Card.Body>
            <h6 className="text-muted mb-3">
              <i className="fas fa-shopping-bag me-2"></i>
              Order Items ({order.orderItems?.length || 0} items)
            </h6>
            
            {order.orderItems?.map((item, index) => (
              <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div className="d-flex align-items-center">
                  <Badge bg="secondary" className="me-3">{item.qty}</Badge>
                  <div>
                    <div className="fw-bold">{item.name}</div>
                    {item.description && (
                      <small className="text-muted">{item.description}</small>
                    )}
                    <div className="text-muted small">
                      {formatPrice(item.price)} each
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="fw-bold">{formatPrice(item.price * item.qty)}</div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>

        {/* Order Summary */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <h6 className="text-muted mb-3">
              <i className="fas fa-calculator me-2"></i>
              Order Summary
            </h6>
            
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal:</span>
              <span>{formatPrice(order.orderSummary?.itemsPrice || order.itemsPrice || 0)}</span>
            </div>
            
            <div className="d-flex justify-content-between mb-2">
              <span>Delivery Fee:</span>
              <span>{formatPrice(order.orderSummary?.shippingPrice || order.shippingPrice || 0)}</span>
            </div>
            
            <div className="d-flex justify-content-between mb-2">
              <span>Tax:</span>
              <span>{formatPrice(order.orderSummary?.taxPrice || order.taxPrice || 0)}</span>
            </div>
            
            {(order.orderSummary?.discount || order.discount) && (
              <div className="d-flex justify-content-between mb-2 text-success">
                <span>Discount:</span>
                <span>-{formatPrice(order.orderSummary?.discount || order.discount)}</span>
              </div>
            )}
            
            <hr />
            
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Total Amount:</h5>
              <h4 className="mb-0 text-primary">
                {formatPrice(order.orderSummary?.totalPrice || order.totalPrice)}
              </h4>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <div className="d-flex gap-2 w-100">
          <Button variant="outline-secondary" onClick={onHide}>
            Close
          </Button>
          
          {['Pending', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(order.status) && (
            <Button variant="primary" onClick={handleTrackOrder}>
              <i className="fas fa-map-marker-alt me-2"></i>
              Track Order
            </Button>
          )}
          
          {order.status === 'Delivered' && (
            <Button variant="success" onClick={handleOrderAgain}>
              <i className="fas fa-redo me-2"></i>
              Order Again
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderDetailsModal;