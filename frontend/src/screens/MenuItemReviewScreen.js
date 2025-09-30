import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import Message from '../components/Message';

const MenuItemReviewScreen = () => {
  const { orderId, menuItemId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [aspects, setAspects] = useState({
    taste: 5,
    presentation: 5,
    portionSize: 5,
    valueForMoney: 5
  });
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch order details
        const orderResponse = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${userInfo.token}`,
          },
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
          throw new Error(orderData.message || 'Failed to fetch order');
        }

        if (orderData.status !== 'Delivered') {
          setError('You can only review delivered orders');
          setLoading(false);
          return;
        }

        // Find the menu item in the order
        const orderItem = orderData.orderItems.find(item => 
          item.menuItem === menuItemId || item.menuItem?._id === menuItemId
        );

        if (!orderItem) {
          setError('Menu item not found in this order');
          setLoading(false);
          return;
        }

        // Fetch menu item details
        const menuItemResponse = await fetch(`/api/menu-items/${menuItemId}`);
        const menuItemData = await menuItemResponse.json();

        if (!menuItemResponse.ok) {
          throw new Error(menuItemData.message || 'Failed to fetch menu item');
        }

        setOrder(orderData);
        setMenuItem(menuItemData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, menuItemId, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const userInfo = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null;

      if (!userInfo) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/menu-item-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({
          menuItem: menuItemId,
          order: orderId,
          rating,
          comment,
          aspects,
          wouldRecommend,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      setSuccess(true);
      toast.success('Menu item review submitted successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating, onStarClick) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <i
        key={star}
        className={`fas fa-star ${star <= currentRating ? 'text-warning' : 'text-muted'}`}
        style={{ cursor: 'pointer', fontSize: '1.2rem', marginRight: '3px' }}
        onClick={() => onStarClick && onStarClick(star)}
      />
    ));
  };

  const handleAspectRating = (aspect, value) => {
    setAspects(prev => ({
      ...prev,
      [aspect]: value
    }));
  };

  if (loading) return <Loader />;

  if (error && !order) {
    return (
      <Container className="my-5">
        <Message variant="danger">{error}</Message>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header>
              <h3>Review Menu Item</h3>
            </Card.Header>
            <Card.Body>
              {success && (
                <Alert variant="success">
                  Review submitted successfully! Redirecting to dashboard...
                </Alert>
              )}
              
              {error && <Alert variant="danger">{error}</Alert>}

              {order && menuItem && (
                <>
                  <div className="mb-4">
                    <Row>
                      <Col md={4}>
                        <img
                          src={menuItem.images?.[0] || menuItem.image || '/images/menu-placeholder.svg'}
                          alt={menuItem.name}
                          className="img-fluid rounded"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                        />
                      </Col>
                      <Col md={8}>
                        <h5>{menuItem.name}</h5>
                        <p className="text-muted">{menuItem.description}</p>
                        <p><strong>Price:</strong> ${menuItem.basePrice || menuItem.price}</p>
                        <p><strong>Restaurant:</strong> {order.shop?.name}</p>
                        <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                        <Badge bg="primary">{menuItem.category}</Badge>
                      </Col>
                    </Row>
                  </div>

                  <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-4">
                      <Form.Label><strong>Overall Rating</strong></Form.Label>
                      <div className="mb-2">
                        {renderStars(rating, setRating)}
                      </div>
                      <Form.Text className="text-muted">
                        Click on stars to rate (1 = Poor, 5 = Excellent)
                      </Form.Text>
                    </Form.Group>

                    <div className="mb-4">
                      <h6>Rate Specific Aspects:</h6>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Taste</Form.Label>
                            <div>
                              {renderStars(aspects.taste, (value) => handleAspectRating('taste', value))}
                            </div>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Presentation</Form.Label>
                            <div>
                              {renderStars(aspects.presentation, (value) => handleAspectRating('presentation', value))}
                            </div>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Portion Size</Form.Label>
                            <div>
                              {renderStars(aspects.portionSize, (value) => handleAspectRating('portionSize', value))}
                            </div>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Value for Money</Form.Label>
                            <div>
                              {renderStars(aspects.valueForMoney, (value) => handleAspectRating('valueForMoney', value))}
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="wouldRecommend"
                        label="I would recommend this item to others"
                        checked={wouldRecommend}
                        onChange={(e) => setWouldRecommend(e.target.checked)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Your Review</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Share your experience with this menu item..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        maxLength={500}
                      />
                      <Form.Text className="text-muted">
                        {comment.length}/500 characters
                      </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-between">
                      <Button
                        variant="secondary"
                        onClick={() => navigate('/dashboard')}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={submitting || !comment.trim()}
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </div>
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MenuItemReviewScreen;