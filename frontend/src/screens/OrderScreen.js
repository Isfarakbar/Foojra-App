import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Button } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';

const OrderScreen = () => {
  const { id } = useParams();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingPay, setLoadingPay] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        
        if (!userInfo || !userInfo.token) {
          setError('Please log in to view your orders');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch order details');
        }

        setOrder(data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const updatePaymentStatusHandler = async () => {
    setLoadingPay(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      if (!userInfo || !userInfo.token) {
        setError('Please log in to update payment status');
        setLoadingPay(false);
        return;
      }
      
      const response = await fetch(`/api/orders/${id}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({
          id: id,
          status: 'PAID',
          update_time: Date.now(),
          email_address: userInfo.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update payment status');
      }

      setOrder({ ...order, isPaid: true, paidAt: Date.now() });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <div className="order-screen my-5">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <h1>Order {order._id}</h1>
          <Row>
            <Col md={8}>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <h2>Shipping</h2>
                  <p>
                    <strong>Name: </strong> {order.user.name}
                  </p>
                  <p>
                    <strong>Email: </strong>{' '}
                    <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
                  </p>
                  <p>
                    <strong>Address: </strong>
                    {order.deliveryAddress?.address || order.shippingAddress?.address}, {order.deliveryAddress?.city || order.shippingAddress?.city}{' '}
                    {order.deliveryAddress?.postalCode || order.shippingAddress?.postalCode},{' '}
                    {order.deliveryAddress?.country || order.shippingAddress?.country || 'Pakistan'}
                  </p>
                  <div className="order-status">
                    {order.isDelivered ? (
                      <Message variant="success">
                        Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                      </Message>
                    ) : (
                      <Message variant="warning">Not Delivered</Message>
                    )}
                  </div>
                </ListGroup.Item>

                <ListGroup.Item>
                  <h2>Payment Method</h2>
                  <p>
                    <strong>Method: </strong>
                    {order.paymentMethod}
                  </p>
                  <div className="order-status">
                    {order.isPaid ? (
                      <Message variant="success">
                        Paid on {new Date(order.paidAt).toLocaleDateString()}
                      </Message>
                    ) : (
                      <Message variant="warning">Not Paid</Message>
                    )}
                  </div>
                </ListGroup.Item>

                <ListGroup.Item>
                  <h2>Order Items</h2>
                  {order.orderItems.length === 0 ? (
                    <Message>Order is empty</Message>
                  ) : (
                    <ListGroup variant="flush">
                      {order.orderItems.map((item, index) => (
                        <ListGroup.Item key={index}>
                          <Row className="align-items-center">
                            <Col md={2}>
                              <Image
                                src={item.images?.[0] || item.image || '/images/food-placeholder.svg'}
                                alt={item.name}
                                fluid
                                rounded
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/food-placeholder.svg';
                                }}
                              />
                            </Col>
                            <Col>
                              <Link to={`/shop/${order.shop._id}?itemId=${item.menuItem}`}>
                                {item.name}
                              </Link>
                            </Col>
                            <Col md={4}>
                              {item.quantity} x ${item.basePrice || item.price} = ${item.totalPrice || (item.quantity * (item.basePrice || item.price)).toFixed(2)}
                              {order.isDelivered && (
                                <div className="mt-2">
                                  <Link 
                                    to={`/review/${order._id}/menu-item/${item.menuItem}`}
                                    className="btn btn-sm btn-outline-primary me-2"
                                  >
                                    Review Item
                                  </Link>
                                  <Link 
                                    to={`/menu-item/${item.menuItem}/reviews`}
                                    className="btn btn-sm btn-outline-secondary"
                                  >
                                    View Reviews
                                  </Link>
                                </div>
                              )}
                            </Col>
                          </Row>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Col>
            <Col md={4}>
              <Card>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <h2>Order Summary</h2>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Items</Col>
                      <Col>${order.orderSummary?.itemsPrice || (order.totalPrice - (order.orderSummary?.taxPrice || order.taxPrice || 0) - (order.orderSummary?.deliveryFee || order.deliveryFee || 0))}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Delivery</Col>
                      <Col>${order.orderSummary?.deliveryFee || order.deliveryFee || 0}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Tax</Col>
                      <Col>${order.orderSummary?.taxPrice || order.taxPrice || 0}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Total</Col>
                      <Col>${order.orderSummary?.totalPrice || order.totalPrice}</Col>
                    </Row>
                  </ListGroup.Item>
                  {!order.isPaid && order.paymentMethod !== 'Cash' && (
                    <ListGroup.Item>
                      {loadingPay ? (
                        <Loader />
                      ) : (
                        <Button
                          type="button"
                          className="w-100"
                          onClick={updatePaymentStatusHandler}
                        >
                          Mark As Paid
                        </Button>
                      )}
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default OrderScreen;