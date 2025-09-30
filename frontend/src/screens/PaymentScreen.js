import React, { useState, useEffect } from 'react';
import { Form, Button, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';

const PaymentScreen = () => {
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if shipping address exists
    const shippingAddress = localStorage.getItem('shippingAddress')
      ? JSON.parse(localStorage.getItem('shippingAddress'))
      : null;
    
    if (!shippingAddress) {
      navigate('/shipping');
    }
    
    // Check if user is logged in
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfo) {
      navigate('/login');
    }
  }, [navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    // Save payment method to localStorage
    localStorage.setItem('paymentMethod', paymentMethod);
    
    // Navigate to place order screen
    navigate('/placeorder');
  };

  return (
    <div className="form-container payment-form my-5">
      <h1 className="text-center mb-4">Payment Method</h1>
      {error && <Message variant="danger">{error}</Message>}
      <Form onSubmit={submitHandler}>
        <Form.Group>
          <Form.Label as="legend">Select Method</Form.Label>
          <Col>
            <Form.Check
              type="radio"
              label="EasyPaisa"
              id="EasyPaisa"
              name="paymentMethod"
              value="EasyPaisa"
              checked={paymentMethod === 'EasyPaisa'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mb-3"
            />
            <Form.Check
              type="radio"
              label="JazzCash"
              id="JazzCash"
              name="paymentMethod"
              value="JazzCash"
              checked={paymentMethod === 'JazzCash'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mb-3"
            />
            <Form.Check
              type="radio"
              label="PayPal or Credit Card"
              id="PayPal"
              name="paymentMethod"
              value="PayPal"
              checked={paymentMethod === 'PayPal'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mb-3"
            />
            <Form.Check
              type="radio"
              label="Cash on Delivery"
              id="Cash"
              name="paymentMethod"
              value="Cash on Delivery"
              checked={paymentMethod === 'Cash on Delivery'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mb-3"
            />
            <Form.Check
              type="radio"
              label="Mobile Banking"
              id="MobileBanking"
              name="paymentMethod"
              value="MobileBanking"
              checked={paymentMethod === 'MobileBanking'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mb-4"
            />
          </Col>
        </Form.Group>

        <Button type="submit" variant="primary" className="w-100 py-2">
          Continue
        </Button>
      </Form>
    </div>
  );
};

export default PaymentScreen;