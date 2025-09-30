import React, { useState, useEffect } from 'react';
import { Row, Col, Container, Card, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ShopListScreen = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [cuisines, setCuisines] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch('/api/shops/approved');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch shops');
        }

        // Handle the new API response structure with shops array and pagination
        const shopsArray = data.shops || data || [];
        setShops(shopsArray);
        
        // Extract unique cuisines for filter
        const uniqueCuisines = [...new Set(shopsArray.map(shop => shop.cuisine))];
        setCuisines(uniqueCuisines);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  // Filter shops based on search term and cuisine
  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         shop.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = cuisineFilter === '' || shop.cuisine === cuisineFilter;
    return matchesSearch && matchesCuisine;
  });

  return (
    <Container className="my-5">
      <h1 className="text-center mb-4">All Restaurants</h1>
      
      {/* Search and Filter */}
      <Row className="mb-4">
        <Col md={8}>
          <Form.Group controlId="search">
            <Form.Control
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="cuisineFilter">
            <Form.Select
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
            >
              <option value="">All Cuisines</option>
              {cuisines.map((cuisine, index) => (
                <option key={index} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : filteredShops.length === 0 ? (
        <Message>No restaurants found matching your criteria</Message>
      ) : (
        <Row>
          {filteredShops.map((shop) => (
            <Col key={shop._id} sm={12} md={6} lg={4} className="mb-4">
              <Card className="shop-card h-100">
                <Card.Img 
                  variant="top" 
                  src={shop.image} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/shop-placeholder.svg';
                  }}
                />
                <Card.Body>
                  <Card.Title>{shop.name}</Card.Title>
                  <Card.Text className="text-muted">{shop.cuisine}</Card.Text>
                  <Card.Text className="shop-description">{shop.description.substring(0, 100)}...</Card.Text>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="rating">
                      <i className="fas fa-star"></i> {shop.rating || 'New'}
                    </div>
                    <div className="delivery-info">
                      <small>Delivery: ${shop.deliveryFee}</small>
                    </div>
                  </div>
                  <div className="shop-status mt-2">
                    {shop.isOpen ? (
                      <span className="badge bg-success">Open</span>
                    ) : (
                      <span className="badge bg-danger">Closed</span>
                    )}
                    <small className="ms-2">Min. Order: ${shop.minOrderAmount}</small>
                  </div>
                </Card.Body>
                <Card.Footer className="bg-white border-0">
                  <Link to={`/shop/${shop._id}`}>
                    <Button variant="outline-primary" className="w-100">
                      View Menu
                    </Button>
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ShopListScreen;