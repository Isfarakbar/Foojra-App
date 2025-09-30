import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, ProgressBar, Alert } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';

const MenuItemReviewsScreen = () => {
  const { menuItemId } = useParams();
  
  const [menuItem, setMenuItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    aspectAverages: {
      taste: 0,
      presentation: 0,
      portionSize: 0,
      valueForMoney: 0
    },
    recommendationPercentage: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch menu item details
        const menuItemResponse = await fetch(`/api/menu-items/${menuItemId}`);
        const menuItemData = await menuItemResponse.json();

        if (!menuItemResponse.ok) {
          throw new Error(menuItemData.message || 'Failed to fetch menu item');
        }

        // Fetch reviews for this menu item
        const reviewsResponse = await fetch(`/api/menu-item-reviews/menu-item/${menuItemId}`);
        const reviewsData = await reviewsResponse.json();

        if (!reviewsResponse.ok) {
          throw new Error(reviewsData.message || 'Failed to fetch reviews');
        }

        setMenuItem(menuItemData);
        setReviews(reviewsData);
        calculateStats(reviewsData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [menuItemId]);

  const calculateStats = (reviewsData) => {
    if (reviewsData.length === 0) {
      return;
    }

    const totalReviews = reviewsData.length;
    const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    // Rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    // Aspect averages
    const aspectTotals = {
      taste: 0,
      presentation: 0,
      portionSize: 0,
      valueForMoney: 0
    };

    reviewsData.forEach(review => {
      if (review.aspects) {
        aspectTotals.taste += review.aspects.taste || 0;
        aspectTotals.presentation += review.aspects.presentation || 0;
        aspectTotals.portionSize += review.aspects.portionSize || 0;
        aspectTotals.valueForMoney += review.aspects.valueForMoney || 0;
      }
    });

    const aspectAverages = {
      taste: aspectTotals.taste / totalReviews,
      presentation: aspectTotals.presentation / totalReviews,
      portionSize: aspectTotals.portionSize / totalReviews,
      valueForMoney: aspectTotals.valueForMoney / totalReviews
    };

    // Recommendation percentage
    const recommendCount = reviewsData.filter(review => review.wouldRecommend).length;
    const recommendationPercentage = (recommendCount / totalReviews) * 100;

    setStats({
      averageRating,
      totalReviews,
      ratingDistribution,
      aspectAverages,
      recommendationPercentage
    });
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <i
        key={star}
        className={`fas fa-star ${star <= rating ? 'text-warning' : 'text-muted'}`}
        style={{ fontSize: '0.9rem', marginRight: '2px' }}
      />
    ));
  };

  const formatAspectName = (aspect) => {
    const names = {
      taste: 'Taste',
      presentation: 'Presentation',
      portionSize: 'Portion Size',
      valueForMoney: 'Value for Money'
    };
    return names[aspect] || aspect;
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
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h3>Reviews for {menuItem?.name}</h3>
            </Card.Header>
            <Card.Body>
              {menuItem && (
                <Row className="mb-4">
                  <Col md={3}>
                    <img
                      src={menuItem.images?.[0] || menuItem.image || '/images/menu-placeholder.svg'}
                      alt={menuItem.name}
                      className="img-fluid rounded"
                      style={{ maxHeight: '150px', objectFit: 'cover' }}
                    />
                  </Col>
                  <Col md={9}>
                    <h5>{menuItem.name}</h5>
                    <p className="text-muted">{menuItem.description}</p>
                    <p><strong>Price:</strong> ${menuItem.basePrice || menuItem.price}</p>
                    <Badge bg="primary">{menuItem.category}</Badge>
                  </Col>
                </Row>
              )}

              {reviews.length === 0 ? (
                <Alert variant="info">
                  No reviews yet for this menu item. Be the first to leave a review!
                </Alert>
              ) : (
                <div>
                  {reviews.map((review) => (
                    <Card key={review._id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <strong>{review.user?.name || 'Anonymous'}</strong>
                            <div className="mt-1">
                              {renderStars(review.rating)}
                              <span className="ms-2 text-muted">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {review.wouldRecommend && (
                            <Badge bg="success">Recommends</Badge>
                          )}
                        </div>
                        
                        <p className="mb-2">{review.comment}</p>
                        
                        {review.aspects && (
                          <div className="mt-3">
                            <small className="text-muted">Detailed Ratings:</small>
                            <Row className="mt-2">
                              {Object.entries(review.aspects).map(([aspect, rating]) => (
                                <Col key={aspect} xs={6} md={3} className="mb-2">
                                  <div className="text-center">
                                    <small className="d-block text-muted">
                                      {formatAspectName(aspect)}
                                    </small>
                                    <div>{renderStars(rating)}</div>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h5>Review Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-4">
                <h2 className="mb-1">{stats.averageRating.toFixed(1)}</h2>
                <div className="mb-2">{renderStars(Math.round(stats.averageRating))}</div>
                <p className="text-muted mb-0">{stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}</p>
              </div>

              {stats.totalReviews > 0 && (
                <>
                  <div className="mb-4">
                    <h6>Rating Distribution</h6>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="d-flex align-items-center mb-2">
                        <span className="me-2" style={{ minWidth: '20px' }}>{rating}</span>
                        <i className="fas fa-star text-warning me-2" />
                        <ProgressBar
                          now={(stats.ratingDistribution[rating] / stats.totalReviews) * 100}
                          className="flex-grow-1 me-2"
                          style={{ height: '8px' }}
                        />
                        <span className="text-muted" style={{ minWidth: '30px', fontSize: '0.8rem' }}>
                          {stats.ratingDistribution[rating]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <h6>Aspect Ratings</h6>
                    {Object.entries(stats.aspectAverages).map(([aspect, average]) => (
                      <div key={aspect} className="d-flex justify-content-between align-items-center mb-2">
                        <span>{formatAspectName(aspect)}</span>
                        <div>
                          {renderStars(Math.round(average))}
                          <span className="ms-2 text-muted">({average.toFixed(1)})</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <div className="mb-2">
                      <strong>{stats.recommendationPercentage.toFixed(0)}%</strong>
                    </div>
                    <p className="text-muted mb-0">would recommend this item</p>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MenuItemReviewsScreen;