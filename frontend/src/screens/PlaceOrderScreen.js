import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Row, Col, ListGroup, Image, Card } from 'react-bootstrap';
import Message from '../components/Message';
import EasyPaisaPayment from '../components/EasyPaisaPayment';
import JazzCashPayment from '../components/JazzCashPayment';
import { toast } from 'react-toastify';

const PlaceOrderScreen = () => {
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEasyPaisa, setShowEasyPaisa] = useState(false);
  const [showJazzCash, setShowJazzCash] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfo) {
      navigate('/login');
      return;
    }

    // Get cart items
    const cart = localStorage.getItem('cartItems')
      ? JSON.parse(localStorage.getItem('cartItems'))
      : [];
    
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }
    
    setCartItems(cart);

    // Get shipping address
    const shipping = localStorage.getItem('shippingAddress')
      ? JSON.parse(localStorage.getItem('shippingAddress'))
      : {};
    
    if (!shipping.address) {
      navigate('/shipping');
      return;
    }
    
    setShippingAddress(shipping);

    // Get payment method
    const payment = localStorage.getItem('paymentMethod') || '';
    
    if (!payment) {
      navigate('/payment');
      return;
    }
    
    setPaymentMethod(payment);
  }, [navigate]);

  // Calculate prices
  const addDecimals = (num) => {
    return (Math.round(num * 100) / 100).toFixed(2);
  };

  const itemsPrice = addDecimals(
    cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0)
  );

  const deliveryFee = cartItems.length > 0 ? addDecimals(cartItems[0].deliveryFee || 0) : 0;
  const totalPrice = addDecimals(Number(itemsPrice) + Number(deliveryFee));

  const placeOrderHandler = async () => {
    // Handle mobile payment methods
    if (paymentMethod === 'EasyPaisa') {
      setShowEasyPaisa(true);
      return;
    }
    
    if (paymentMethod === 'JazzCash') {
      setShowJazzCash(true);
      return;
    }
    
    // Handle other payment methods
    await processOrder();
  };

  const processOrder = async (paymentResult = null) => {
    setLoading(true);
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          images: item.image ? [item.image] : [],
          basePrice: item.price,
          totalPrice: (item.quantity || 0) * (item.price || 0),
          menuItem: item.menuItemId,
        })),
        deliveryAddress: {
          fullName: shippingAddress.fullName || shippingAddress.name || 'Customer',
          phone: shippingAddress.phone || '',
          address: shippingAddress.address || '',
          area: shippingAddress.area || shippingAddress.city || 'Gojra',
          city: shippingAddress.city || 'Gojra',
          postalCode: shippingAddress.postalCode || '',
          landmark: shippingAddress.landmark || '',
        },
        paymentMethod,
        paymentResult: paymentResult,
        orderSummary: {
          itemsPrice: Number(itemsPrice),
          deliveryFee: Number(deliveryFee),
          totalPrice: Number(totalPrice),
        },
        shop: cartItems[0].shopId,
        isPaid: paymentResult ? true : paymentMethod === 'Cash on Delivery' ? false : false,
      };

      console.log('Order data being sent to backend:', JSON.stringify(orderData, null, 2));
      console.log('Payment method:', paymentMethod);
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        const order = result.data; // Extract order from the data property
        
        // Clear cart
        localStorage.removeItem('cartItems');
        localStorage.removeItem('shippingAddress');
        localStorage.removeItem('paymentMethod');
        
        toast.success('Order placed successfully!');
        navigate(`/order/${order._id}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to place order');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentResult) => {
    setShowEasyPaisa(false);
    setShowJazzCash(false);
    toast.success(`Payment successful via ${paymentResult.method}!`);
    processOrder(paymentResult);
  };

  const handlePaymentError = (error) => {
    setShowEasyPaisa(false);
    setShowJazzCash(false);
    toast.error('Payment failed. Please try again.');
  };

  return (
    <>
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Address: </strong>
                {shippingAddress.address}, {shippingAddress.city}{' '}
                {shippingAddress.postalCode}, {shippingAddress.country}
              </p>
              {shippingAddress.phone && (
                <p>
                  <strong>Phone: </strong>
                  {shippingAddress.phone}
                </p>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Payment Method</h2>
              <strong>Method: </strong>
              {paymentMethod}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Order Items</h2>
              {cartItems.length === 0 ? (
                <Message>Your cart is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {cartItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={1}>
                          <Image
                            src={item.image || '/images/food-placeholder.svg'}
                            alt={item.name}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col>
                          <Link to={`/shop/${item.shopId}`}>
                            {item.name}
                          </Link>
                        </Col>
                        <Col md={4}>
                          {item.quantity} x ${item.price} = ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}
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
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>${itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Delivery</Col>
                  <Col>${deliveryFee}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Total</Col>
                  <Col>${totalPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Button
                  type='button'
                  className='w-100'
                  disabled={cartItems.length === 0 || loading}
                  onClick={placeOrderHandler}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
      
      {/* Payment Modals */}
      <EasyPaisaPayment
        amount={totalPrice}
        show={showEasyPaisa}
        onHide={() => setShowEasyPaisa(false)}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
      
      <JazzCashPayment
        amount={totalPrice}
        show={showJazzCash}
        onHide={() => setShowJazzCash(false)}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </>
  );
};

export default PlaceOrderScreen;