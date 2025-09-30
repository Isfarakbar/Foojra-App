import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';

const MenuItemEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

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

    setUserInfo(userInfoFromStorage);

    // If we have an ID, fetch the menu item details
    if (id) {
      const fetchMenuItem = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/menu/${id}`, {
            headers: {
              Authorization: `Bearer ${userInfoFromStorage.token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch menu item');
          }

          setName(data.name);
          setPrice(data.price);
          setImage(data.image || '');
          setCategory(data.category);
          setDescription(data.description);
          setIsAvailable(data.isAvailable);
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };

      fetchMenuItem();
    }
  }, [id, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const menuItem = {
        name,
        price: Number(price),
        image,
        category,
        description,
        isAvailable,
      };
      
      const url = id
        ? `/api/menu/${id}`
        : '/api/menu';
      
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(menuItem),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save menu item');
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
          <h1>{id ? 'Edit Menu Item' : 'Add New Menu Item'}</h1>
          
          {loading && <Loader />}
          {error && <Message variant="danger">{error}</Message>}
          {success && (
            <Message variant="success">
              Menu item {id ? 'updated' : 'created'} successfully!
            </Message>
          )}
          
          <Form onSubmit={submitHandler}>
            <Form.Group controlId="name" className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group controlId="price" className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </Form.Group>
            
            <Form.Group controlId="image" className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter image URL"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
              <Form.Text className="text-muted">
                Provide a URL to an image of your menu item
              </Form.Text>
            </Form.Group>
            
            <Form.Group controlId="category" className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                as="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                <option value="Appetizers">Appetizers</option>
                <option value="Main Course">Main Course</option>
                <option value="Desserts">Desserts</option>
                <option value="Beverages">Beverages</option>
                <option value="Sides">Sides</option>
                <option value="Specials">Specials</option>
              </Form.Control>
            </Form.Group>
            
            <Form.Group controlId="description" className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group controlId="isAvailable" className="mb-3">
              <Form.Check
                type="checkbox"
                label="Available"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
            </Form.Group>
            
            <Button type="submit" variant="primary">
              {id ? 'Update' : 'Create'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MenuItemEditScreen;