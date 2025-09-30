import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';

const ShopEditScreen = () => {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [image, setImage] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is a shop owner
    const userInfoFromStorage = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfoFromStorage) {
      navigate('/login');
      return;
    }

    if (userInfoFromStorage.role !== 'shop-owner') {
      navigate('/dashboard');
      return;
    }

    const fetchShopInfo = async () => {
      try {
        const response = await fetch('/api/shops/myshop', {
          headers: {
            Authorization: `Bearer ${userInfoFromStorage.token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch shop information');
        }

        setName(data.name);
        setCuisine(data.cuisine);
        setAddress(data.address);
        setPhone(data.phone);
        setDescription(data.description);
        setDeliveryFee(data.deliveryFee);
        setMinOrderAmount(data.minOrderAmount);
        setImage(data.image || '');
        setIsOpen(data.isOpen);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchShopInfo();
  }, [navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userInfo = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null;

      if (!userInfo) {
        navigate('/login');
        return;
      }
      
      const shopData = {
        name,
        cuisine,
        address,
        phone,
        description,
        deliveryFee: Number(deliveryFee),
        minOrderAmount: Number(minOrderAmount),
        image,
        isOpen,
      };
      
      const response = await fetch('/api/shops/myshop', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(shopData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update shop information');
      }
      
      setSuccess(true);
      setLoading(false);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/shop-owner/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="my-5">
      <Button 
        variant="light" 
        onClick={() => navigate('/shop-owner/dashboard')}
        className="mb-3"
      >
        Go Back
      </Button>
      
      <Card>
        <Card.Body>
          <h1>Edit Shop Information</h1>
          
          {loading && <Loader />}
          {error && <Message variant="danger">{error}</Message>}
          {success && (
            <Message variant="success">
              Shop information updated successfully!
            </Message>
          )}
          
          {!loading && (
            <Form onSubmit={submitHandler}>
              <Form.Group controlId="name" className="mb-3">
                <Form.Label>Shop Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter shop name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group controlId="cuisine" className="mb-3">
                <Form.Label>Cuisine Type</Form.Label>
                <Form.Control
                  as="select"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  required
                >
                  <option value="">Select Cuisine</option>
                  <option value="Italian">Italian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Indian">Indian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Japanese">Japanese</option>
                  <option value="American">American</option>
                  <option value="Thai">Thai</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Other">Other</option>
                </Form.Control>
              </Form.Group>
              
              <Form.Group controlId="address" className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter shop address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group controlId="phone" className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group controlId="description" className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter shop description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group controlId="deliveryFee" className="mb-3">
                <Form.Label>Delivery Fee ($)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter delivery fee"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </Form.Group>
              
              <Form.Group controlId="minOrderAmount" className="mb-3">
                <Form.Label>Minimum Order Amount ($)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter minimum order amount"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </Form.Group>
              
              <Form.Group controlId="image" className="mb-3">
                <Form.Label>Shop Image URL</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter image URL"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Provide a URL to an image of your shop
                </Form.Text>
              </Form.Group>
              
              <Form.Group controlId="isOpen" className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Shop is currently open"
                  checked={isOpen}
                  onChange={(e) => setIsOpen(e.target.checked)}
                />
              </Form.Group>
              
              <Button type="submit" variant="primary">
                Update Shop Information
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ShopEditScreen;