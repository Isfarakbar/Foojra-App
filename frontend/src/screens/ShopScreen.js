import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Row, Col, ListGroup, Card, Button, Container, Badge } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ShopScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchShopAndMenu = async () => {
      try {
        // Fetch shop details
        const shopResponse = await fetch(`/api/shops/${id}`);
      const shopData = await shopResponse.json();

      if (!shopResponse.ok) {
        throw new Error(shopData.message || 'Shop not found');
      }

      setShop(shopData);

      // Fetch menu items for this shop
      const menuResponse = await fetch(`/api/menu/shop/${id}`);
        const menuData = await menuResponse.json();

        if (!menuResponse.ok) {
          throw new Error(menuData.message || 'Failed to fetch menu items');
        }

        setMenuItems(menuData);

        // Extract unique categories
        const uniqueCategories = [...new Set(menuData.map(item => item.category))];
        setCategories(uniqueCategories);
        
        if (uniqueCategories.length > 0) {
          setActiveCategory(uniqueCategories[0]);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchShopAndMenu();
  }, [id]);

  const addToCartHandler = (menuItem) => {
    navigate(`/cart/${id}?itemId=${menuItem._id}&qty=1`);
  };

  // Filter menu items by category
  const filteredMenuItems = activeCategory 
    ? menuItems.filter(item => item.category === activeCategory)
    : menuItems;

  return (
    <Container className="my-5">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <Row className="mb-4">
            <Col lg={8} md={12} className="mb-4">
              <h1>{shop.name}</h1>
              <p className="text-muted">{shop.cuisine}</p>
              <p>{shop.description}</p>
              <div className="shop-info mb-3">
                <p>
                  <i className="fas fa-map-marker-alt me-2"></i> {shop.address}
                </p>
                <p>
                  <i className="fas fa-phone me-2"></i> {shop.phone}
                </p>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <div className="rating">
                    <i className="fas fa-star text-warning"></i> {shop.rating || 'New'}
                    {shop.totalReviews > 0 && (
                      <small className="text-muted ms-1">({shop.totalReviews})</small>
                    )}
                  </div>
                  <div className="delivery-info">
                    <span>Delivery: ${shop.deliveryFee}</span>
                  </div>
                  <div className="min-order">
                    <span>Min. Order: ${shop.minOrderAmount}</span>
                  </div>
                  <div>
                    <Link to={`/shop/${shop._id}/reviews`} className="btn btn-outline-primary btn-sm">
                      <i className="fas fa-star me-1"></i>
                      View Reviews
                    </Link>
                  </div>
                </div>
              </div>
              {shop.isOpen ? (
                <Badge bg="success" className="mb-3">Open</Badge>
              ) : (
                <Badge bg="danger" className="mb-3">Closed</Badge>
              )}
            </Col>
            <Col lg={4} md={12}>
              <Card>
                <Card.Img 
                  variant="top" 
                  src={shop.image} 
                  alt={shop.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/shop-placeholder.svg';
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <div className="category-tabs">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? 'primary' : 'outline-primary'}
                    className="me-2 mb-2"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
                {categories.length > 0 && (
                  <Button
                    variant={activeCategory === '' ? 'primary' : 'outline-primary'}
                    className="me-2 mb-2"
                    onClick={() => setActiveCategory('')}
                  >
                    All Items
                  </Button>
                )}
              </div>
            </Col>
          </Row>

          <Row>
            {filteredMenuItems.length === 0 ? (
              <Message>No menu items found</Message>
            ) : (
              filteredMenuItems.map((menuItem) => (
                <Col key={menuItem._id} sm={12} md={6} lg={4} className="mb-4">
                  <Card className="menu-item-card h-100">
                    <Card.Img 
                      variant="top" 
                      src={menuItem.image} 
                      alt={menuItem.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/food-placeholder.svg';
                      }}
                    />
                    <Card.Body>
                      <Card.Title>{menuItem.name}</Card.Title>
                      <Card.Text className="menu-description">
                        {menuItem.description}
                      </Card.Text>
                      <ListGroup variant="flush" className="mb-3">
                        <ListGroup.Item className="px-0">
                          <Row>
                            <Col>Price:</Col>
                            <Col className="text-end">${menuItem.price}</Col>
                          </Row>
                        </ListGroup.Item>
                        <ListGroup.Item className="px-0">
                          <Row>
                            <Col>Prep Time:</Col>
                            <Col className="text-end">{menuItem.prepTime} mins</Col>
                          </Row>
                        </ListGroup.Item>
                      </ListGroup>
                      <div className="dietary-info mb-3">
                        {menuItem.isVegetarian && (
                          <Badge bg="success" className="me-1">Vegetarian</Badge>
                        )}
                        {menuItem.isVegan && (
                          <Badge bg="success" className="me-1">Vegan</Badge>
                        )}
                        {menuItem.isGlutenFree && (
                          <Badge bg="success" className="me-1">Gluten-Free</Badge>
                        )}
                      </div>
                      
                      <div className="menu-item-rating mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <i className="fas fa-star text-warning"></i>
                            <span className="ms-1">
                              {menuItem.analytics?.rating ? menuItem.analytics.rating.toFixed(1) : 'New'}
                            </span>
                            {menuItem.analytics?.reviewCount > 0 && (
                              <small className="text-muted ms-1">
                                ({menuItem.analytics.reviewCount} reviews)
                              </small>
                            )}
                          </div>
                          <Link 
                            to={`/menu-item/${menuItem._id}/reviews`}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            View Reviews
                          </Link>
                        </div>
                      </div>
                    </Card.Body>
                    <Card.Footer className="bg-white border-0">
                      <Button
                        className="w-100"
                        type="button"
                        disabled={!menuItem.isAvailable || !shop.isOpen}
                        onClick={() => addToCartHandler(menuItem)}
                      >
                        {menuItem.isAvailable ? 'Add To Cart' : 'Out of Stock'}
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </>
      )}
    </Container>
  );
};

export default ShopScreen;