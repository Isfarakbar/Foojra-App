import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';

const ShippingScreen = () => {
  const navigate = useNavigate();
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfo) {
      navigate('/login?redirect=shipping');
    }
    
    // Pre-fill with user's address if available
    if (userInfo && userInfo.address) {
      try {
        const addressParts = userInfo.address.split(', ');
        if (addressParts.length >= 4) {
          setAddress(addressParts[0]);
          setCity(addressParts[1]);
          setPostalCode(addressParts[2]);
          setCountry(addressParts[3]);
        }
      } catch (err) {
        // Error parsing address
      }
    }
    
    // Pre-fill with user's phone if available
    if (userInfo && userInfo.phone) {
      setPhone(userInfo.phone);
    }
  }, [navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    
    if (!address || !city || !postalCode || !country || !phone) {
      setError('Please fill in all fields');
      return;
    }

    // Save shipping address to localStorage
    const shippingAddress = {
      address,
      city,
      postalCode,
      country,
      phone,
    };
    
    localStorage.setItem('shippingAddress', JSON.stringify(shippingAddress));
    
    // Navigate to payment screen
    navigate('/payment');
  };

  return (
    <div className="form-container shipping-form my-5">
      <h1 className="text-center mb-4">Shipping</h1>
      {error && <Message variant="danger">{error}</Message>}
      <Form onSubmit={submitHandler}>
        <Form.Group controlId="address" className="mb-3">
          <Form.Label>Address</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="city" className="mb-3">
          <Form.Label>City</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="postalCode" className="mb-3">
          <Form.Label>Postal Code</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter postal code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="country" className="mb-3">
          <Form.Label>Country</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="phone" className="mb-4">
          <Form.Label>Phone Number</Form.Label>
          <Form.Control
            type="tel"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary" className="w-100 py-2">
          Continue
        </Button>
      </Form>
    </div>
  );
};

export default ShippingScreen;