import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createApiUrl } from '../utils/api';
import { Row, Col, Container, Card, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';

const HomeScreen = () => {
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch(createApiUrl('api/shops/approved'));
        console.log('Fetching from:', createApiUrl('api/shops/approved')); // Debug log
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch shops');
        }

        // Handle the new API response structure with shops array and pagination
        const shopsArray = data.shops || data || [];
        setShops(shopsArray);
        setFilteredShops(shopsArray);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  // Filter shops based on search term, category, cuisine, and area
  useEffect(() => {
    let filtered = shops;

    // Filter by search term (shop name)
    if (searchTerm) {
      filtered = filtered.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(shop => shop.category === selectedCategory);
    }

    // Filter by cuisine
    if (selectedCuisine) {
      filtered = filtered.filter(shop => shop.cuisine === selectedCuisine);
    }

    // Filter by delivery area
    if (selectedArea) {
      filtered = filtered.filter(shop => {
        // Check if shop delivers to the selected area
        return shop.deliveryInfo?.deliveryAreas?.some(area => 
          area.area.toLowerCase().includes(selectedArea.toLowerCase())
        ) || shop.address?.area?.toLowerCase().includes(selectedArea.toLowerCase());
      });
    }

    setFilteredShops(filtered);
  }, [shops, searchTerm, selectedCategory, selectedCuisine, selectedArea]);

  // Get unique categories, cuisines, and areas for filter options
  const categories = [...new Set(shops.map(shop => shop.category))].filter(Boolean);
  const cuisines = [...new Set(shops.map(shop => shop.cuisine))].filter(Boolean);
  
  // Get unique areas from both shop addresses and delivery areas
  const areas = [...new Set([
    ...shops.map(shop => shop.address?.area).filter(Boolean),
    ...shops.flatMap(shop => 
      shop.deliveryInfo?.deliveryAreas?.map(area => area.area) || []
    ).filter(Boolean)
  ])].sort();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleCuisineChange = (e) => {
    setSelectedCuisine(e.target.value);
  };

  const handleAreaChange = (e) => {
    setSelectedArea(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedCuisine('');
    setSelectedArea('');
  };

  return (
    <>
      {/* Hero Section */}
      <div className="hero-section">
        <Container>
          <Row>
            <Col md={6} className="hero-content">
              <h1>Delicious food delivered to your doorstep</h1>
              <p>
                Order from your favorite local restaurants with Foojra. Fast delivery, easy payment, and a wide selection of cuisines.
              </p>
              <Link to="/shops">
                <Button variant="primary" size="lg">
                  Browse Shops
                </Button>
              </Link>
            </Col>
            <Col md={6} className="hero-image">
              <img 
                src="/images/hero-food.svg" 
                alt="Food Delivery" 
                className="img-fluid"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/hero-placeholder.svg';
                }}
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* All Approved Shops Section */}
      <Container className="my-5">
        <h2 className="text-center mb-4">Available Shops</h2>
        
        {/* Search and Filter Section */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <InputGroup>
              <InputGroup.Text>
                <i className="fas fa-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search shops by name..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </InputGroup>
          </Col>
          <Col lg={2} md={6} className="mb-3">
            <Form.Select value={selectedCategory} onChange={handleCategoryChange}>
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={2} md={6} className="mb-3">
            <Form.Select value={selectedCuisine} onChange={handleCuisineChange}>
              <option value="">All Cuisines</option>
              {cuisines.map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Form.Select value={selectedArea} onChange={handleAreaChange}>
              <option value="">All Areas in Gojra</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={2} md={6} className="mb-3">
            <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
              <i className="fas fa-times me-1"></i>
              Clear
            </Button>
          </Col>
        </Row>

        {/* Results Summary */}
        {(searchTerm || selectedCategory || selectedCuisine || selectedArea) && (
          <div className="mb-3">
            <small className="text-muted">
              Showing {filteredShops.length} of {shops.length} shops
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedCategory && ` in ${selectedCategory}`}
              {selectedCuisine && ` serving ${selectedCuisine}`}
              {selectedArea && ` delivering to ${selectedArea}`}
            </small>
          </div>
        )}

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : filteredShops.length === 0 ? (
          <Message>
            {shops.length === 0 
              ? "No approved shops available at the moment." 
              : "No shops match your search criteria. Try adjusting your filters."
            }
          </Message>
        ) : (
          <Row>
            {filteredShops.map((shop) => (
              <Col key={shop._id} sm={12} md={6} lg={4} xl={3} className="mb-4">
                <Card className="shop-card h-100 shadow-sm">
                  <div className="position-relative">
                    <Card.Img 
                      variant="top" 
                      src={shop.logo || shop.image || '/images/logo-placeholder.svg'} 
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/logo-placeholder.svg';
                      }}
                    />
                    <Badge 
                      bg="primary" 
                      className="position-absolute top-0 end-0 m-2"
                    >
                      {shop.category}
                    </Badge>
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="h5">{shop.name}</Card.Title>
                    <Card.Text className="text-muted small flex-grow-1">
                      {shop.description || 'Delicious food awaits you!'}
                    </Card.Text>
                    <div className="shop-info mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="rating">
                          <i className="fas fa-star text-warning"></i> 
                          <span className="ms-1">{shop.rating || 'New'}</span>
                          {shop.totalReviews > 0 && (
                            <small className="text-muted ms-1">({shop.totalReviews})</small>
                          )}
                        </div>
                        <div className="delivery-info">
                          <small className="text-muted">
                            <i className="fas fa-truck"></i> ${shop.deliveryFee}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="fas fa-clock"></i> 30-45 min
                        </small>
                        <small className="text-muted">
                          Min: ${shop.minOrderAmount}
                        </small>
                      </div>
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-white border-0 pt-0">
                    <Link to={`/shop/${shop._id}`}>
                      <Button variant="primary" className="w-100">
                        <i className="fas fa-utensils me-2"></i>
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

      {/* How It Works Section */}
      <div className="how-it-works bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">How It Works</h2>
          <Row>
            <Col md={4} className="text-center mb-4">
              <div className="step-icon mb-3">
                <i className="fas fa-store fa-3x"></i>
              </div>
              <h4>Choose a Restaurant</h4>
              <p>Browse from our diverse range of restaurants and cuisines</p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="step-icon mb-3">
                <i className="fas fa-utensils fa-3x"></i>
              </div>
              <h4>Select Your Meal</h4>
              <p>Pick your favorite dishes from the restaurant's menu</p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="step-icon mb-3">
                <i className="fas fa-truck fa-3x"></i>
              </div>
              <h4>Delivery to Your Door</h4>
              <p>Get your food delivered quickly to your location</p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default HomeScreen;