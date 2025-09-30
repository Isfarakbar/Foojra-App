import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ShopReviewsScreen = () => {
  const { shopId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const fetchShopAndReviews = async () => {
      try {
        // Fetch shop details
        const shopResponse = await fetch(`/api/shops/${shopId}`);
      const shopData = await shopResponse.json();

      if (!shopResponse.ok) {
        throw new Error(shopData.message || 'Shop not found');
      }

      setShop(shopData);

      // Fetch reviews for this shop
      const reviewsResponse = await fetch(
        `/api/reviews/shop/${shopId}?page=${currentPage}&limit=10`
        );
        const reviewsData = await reviewsResponse.json();

        if (!reviewsResponse.ok) {
          throw new Error(reviewsData.message || 'Failed to fetch reviews');
        }

        setReviews(reviewsData.reviews);
        setTotalPages(reviewsData.totalPages);
        setTotalReviews(reviewsData.totalReviews);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchShopAndReviews();
  }, [shopId, currentPage]);

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <i
        key={star}
        className={`fas fa-star ${star <= rating ? 'text-warning' : 'text-muted'}`}
        style={{ fontSize: '0.9rem' }}
      />
    ));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setLoading(true);
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <Container className="my-5">
        <Message variant="danger">{error}</Message>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      {shop && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={2}>
                    <img
                      src={shop.logo || shop.image || '/images/logo-placeholder.svg'}
                      alt={shop.name}
                      className="img-fluid rounded"
                      style={{ maxHeight: '100px', objectFit: 'cover' }}
                    />
                  </Col>
                  <Col md={6}>
                    <h3>{shop.name}</h3>
                    <p className="text-muted mb-1">{shop.description}</p>
                    <Badge bg="primary" className="me-2">{shop.category}</Badge>
                    <Badge bg="secondary">{shop.cuisine}</Badge>
                  </Col>
                  <Col md={4} className="text-end">
                    <div className="mb-2">
                      <div className="d-flex align-items-center justify-content-end">
                        {renderStars(Math.round(shop.rating))}
                        <span className="ms-2 h5 mb-0">{shop.rating}</span>
                      </div>
                      <small className="text-muted">
                        Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                      </small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <h4 className="mb-4">Customer Reviews ({totalReviews})</h4>
          
          {reviews.length === 0 ? (
            <Message>No reviews yet for this restaurant.</Message>
          ) : (
            <>
              {reviews.map((review) => (
                <Card key={review._id} className="mb-3">
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <div className="d-flex align-items-center mb-2">
                          <strong className="me-3">{review.user.name}</strong>
                          <div className="me-3">
                            {renderStars(review.rating)}
                          </div>
                          <small className="text-muted">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                        <p className="mb-0">{review.comment}</p>
                      </Col>
                      <Col md={4} className="text-end">
                        {review.isVerified && (
                          <Badge bg="success" className="mb-2">
                            <i className="fas fa-check-circle me-1"></i>
                            Verified Purchase
                          </Badge>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <div className="btn-group">
                    <Button
                      variant="outline-primary"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    
                    {[...Array(totalPages)].map((_, index) => (
                      <Button
                        key={index + 1}
                        variant={currentPage === index + 1 ? 'primary' : 'outline-primary'}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline-primary"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ShopReviewsScreen;