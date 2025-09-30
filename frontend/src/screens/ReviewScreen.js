import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ReviewScreen = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
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

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${userInfo.token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch order');
        }

        if (data.status !== 'Delivered') {
          setError('You can only review delivered orders');
          setLoading(false);
          return;
        }

        setOrder(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

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

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({
          shop: order.shop._id,
          order: orderId,
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <i
        key={star}
        className={`fas fa-star ${star <= rating ? 'text-warning' : 'text-muted'}`}
        style={{ cursor: 'pointer', fontSize: '1.5rem', marginRight: '5px' }}
        onClick={() => setRating(star)}
      />
    ));
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
              <h3>Write a Review</h3>
            </Card.Header>
            <Card.Body>
              {success && (
                <Alert variant="success">
                  Review submitted successfully! Redirecting to dashboard...
                </Alert>
              )}
              
              {error && <Alert variant="danger">{error}</Alert>}

              {order && (
                <>
                  <div className="mb-4">
                    <h5>Order Details</h5>
                    <p><strong>Restaurant:</strong> {order.shop.name}</p>
                    <p><strong>Order ID:</strong> {order._id}</p>
                    <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ${order.total}</p>
                  </div>

                  <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-3">
                      <Form.Label>Rating</Form.Label>
                      <div className="mb-2">
                        {renderStars()}
                      </div>
                      <Form.Text className="text-muted">
                        Click on stars to rate (1 = Poor, 5 = Excellent)
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Comment</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Share your experience with this restaurant..."
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

export default ReviewScreen;