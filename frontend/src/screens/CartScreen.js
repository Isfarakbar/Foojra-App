import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Form, Button, Card } from 'react-bootstrap';
import Message from '../components/Message';

const CartScreen = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [shop, setShop] = useState(null);

  // Get item ID and quantity from URL if they exist
  const queryParams = new URLSearchParams(location.search);
  const itemId = queryParams.get('itemId');
  const qty = queryParams.get('qty') ? Number(queryParams.get('qty')) : 1;

  useEffect(() => {
    // Load cart from localStorage
    const loadCart = () => {
      const cartFromStorage = localStorage.getItem('cartItems')
        ? JSON.parse(localStorage.getItem('cartItems'))
        : [];
      setCartItems(cartFromStorage);

      // If there are items in cart, set the shop
      if (cartFromStorage.length > 0) {
        setShop({
          _id: cartFromStorage[0].shopId,
          name: cartFromStorage[0].shopName,
          deliveryFee: cartFromStorage[0].deliveryFee,
          minOrderAmount: cartFromStorage[0].minOrderAmount
        });
      }
    };

    // If we have a new item to add to cart
    const addItemToCart = async () => {
      if (id && itemId) {
        try {
          // Fetch shop details
          const shopResponse = await fetch(`/api/shops/${id}`);
          const shopData = await shopResponse.json();

          if (!shopResponse.ok) {
            throw new Error('Failed to fetch shop details');
          }

          // Fetch menu item details
          const itemResponse = await fetch(`/api/menu/${itemId}`);
          const itemData = await itemResponse.json();

          if (!itemResponse.ok) {
            throw new Error('Failed to fetch item details');
          }

          // Check if we already have items from a different shop
          const existingCart = localStorage.getItem('cartItems')
            ? JSON.parse(localStorage.getItem('cartItems'))
            : [];

          if (existingCart.length > 0 && existingCart[0].shopId !== id) {
            if (window.confirm('Your cart contains items from another restaurant. Would you like to clear your cart and add this item?')) {
              // Clear cart and add new item
              const newItem = {
                menuItemId: itemData._id,
                name: itemData.name,
                image: itemData.image,
                price: itemData.price,
                shopId: id,
                shopName: shopData.name,
                deliveryFee: shopData.deliveryFee,
                minOrderAmount: shopData.minOrderAmount,
                quantity: qty
              };

              localStorage.setItem('cartItems', JSON.stringify([newItem]));
              setCartItems([newItem]);
              setShop(shopData);
            } else {
              // User chose not to clear cart, load existing cart
              loadCart();
            }
          } else {
            // Check if item already exists in cart
            const existingItemIndex = existingCart.findIndex(
              (item) => item.menuItemId === itemData._id
            );

            if (existingItemIndex >= 0) {
              // Update quantity if item exists
              const updatedCart = [...existingCart];
              updatedCart[existingItemIndex].quantity += qty;
              localStorage.setItem('cartItems', JSON.stringify(updatedCart));
              setCartItems(updatedCart);
            } else {
              // Add new item to cart
              const newItem = {
                menuItemId: itemData._id,
                name: itemData.name,
                image: itemData.image,
                price: itemData.price,
                shopId: id,
                shopName: shopData.name,
                deliveryFee: shopData.deliveryFee,
                minOrderAmount: shopData.minOrderAmount,
                quantity: qty
              };

              const updatedCart = [...existingCart, newItem];
              localStorage.setItem('cartItems', JSON.stringify(updatedCart));
              setCartItems(updatedCart);
              setShop(shopData);
            }
          }
        } catch (error) {
           // Error adding item to cart
         }
      } else {
        // No new item to add, just load existing cart
        loadCart();
      }
    };

    addItemToCart();
  }, [id, itemId, qty]);

  const removeFromCartHandler = (id) => {
    const updatedCartItems = cartItems.filter((item) => item.menuItemId !== id);
    setCartItems(updatedCartItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));

    // If cart is empty, clear shop info
    if (updatedCartItems.length === 0) {
      setShop(null);
    }
  };

  const updateQuantityHandler = (id, quantity) => {
    const updatedCartItems = cartItems.map((item) =>
      item.menuItemId === id ? { ...item, quantity: Number(quantity) } : item
    );
    setCartItems(updatedCartItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
  };

  const checkoutHandler = () => {
    // Check if user is logged in
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfo) {
      navigate('/login?redirect=shipping');
    } else {
      navigate('/shipping');
    }
  };

  // Calculate prices
  const itemsPrice = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
    0
  );
  const deliveryFee = shop && shop.deliveryFee ? shop.deliveryFee : 0;
  const taxPrice = 0.15 * itemsPrice; // 15% tax
  const totalPrice = itemsPrice + deliveryFee + taxPrice;

  // Check if minimum order amount is met
  const minOrderMet = shop ? itemsPrice >= (shop.minOrderAmount || 0) : true;

  return (
    <div className="cart-screen my-5">
      <Row>
        <Col md={8}>
          <h1>Shopping Cart</h1>
          {cartItems.length === 0 ? (
            <Message>
              Your cart is empty <Link to="/shops">Go Back</Link>
            </Message>
          ) : (
            <>
              {shop && (
                <div className="mb-3">
                  <h4>
                    <Link to={`/shop/${shop._id}`}>{shop.name}</Link>
                  </h4>
                </div>
              )}
              <ListGroup variant="flush">
                {cartItems.map((item) => (
                  <ListGroup.Item key={item.menuItemId}>
                    <Row className="align-items-center">
                      <Col md={2}>
                        <Image
                          src={item.image}
                          alt={item.name}
                          fluid
                          rounded
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/food-placeholder.svg';
                          }}
                        />
                      </Col>
                      <Col md={3}>
                        <Link to={`/shop/${item.shopId}?itemId=${item.menuItemId}`}>
                          {item.name}
                        </Link>
                      </Col>
                      <Col md={2}>${item.price}</Col>
                      <Col md={2}>
                        <Form.Control
                          as="select"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantityHandler(item.menuItemId, Number(e.target.value))
                          }
                        >
                          {[...Array(10).keys()].map((x) => (
                            <option key={x + 1} value={x + 1}>
                              {x + 1}
                            </option>
                          ))}
                        </Form.Control>
                      </Col>
                      <Col md={2}>
                        <Button
                          type="button"
                          variant="light"
                          onClick={() => removeFromCartHandler(item.menuItemId)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
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
                  <Col>${itemsPrice.toFixed(2)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Delivery</Col>
                  <Col>${deliveryFee.toFixed(2)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>${taxPrice.toFixed(2)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Total</Col>
                  <Col>${totalPrice.toFixed(2)}</Col>
                </Row>
              </ListGroup.Item>
              {shop && !minOrderMet && (
                <ListGroup.Item>
                  <Message variant="warning">
                    Minimum order amount is ${shop.minOrderAmount}. Please add more items.
                  </Message>
                </ListGroup.Item>
              )}
              <ListGroup.Item>
                <Button
                  type="button"
                  className="w-100"
                  disabled={cartItems.length === 0 || !minOrderMet}
                  onClick={checkoutHandler}
                >
                  Proceed To Checkout
                </Button>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CartScreen;