import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';

const AdminPanelScreen = () => {
  const [pendingShops, setPendingShops] = useState([]);
  const [approvedShops, setApprovedShops] = useState([]);
  const [rejectedShops, setRejectedShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [actionType, setActionType] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    fetchShops();
  }, [navigate]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      // Fetch pending shops
      const pendingResponse = await fetch('/api/shops/pending', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });
      
      // Fetch approved shops
      const approvedResponse = await fetch('/api/shops/approved', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });
      
      // Fetch rejected shops
      const rejectedResponse = await fetch('/api/shops/rejected', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingShops(pendingData.shops || pendingData || []);
      }
      
      if (approvedResponse.ok) {
        const approvedData = await approvedResponse.json();
        setApprovedShops(approvedData.shops || approvedData || []);
      }
      
      if (rejectedResponse.ok) {
        const rejectedData = await rejectedResponse.json();
        setRejectedShops(rejectedData.shops || rejectedData || []);
      }
      
    } catch (error) {
      setError('Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  };

  const handleShopAction = async (shopId, action) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      const response = await fetch(`/api/shops/${shopId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });

      if (response.ok) {
        setSuccess(`Shop ${action}d successfully!`);
        setShowModal(false);
        fetchShops(); // Refresh the data
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Failed to ${action} shop`);
      }
    } catch (error) {
      setError(`Failed to ${action} shop`);
    }
  };

  const openConfirmModal = (shop, action) => {
    setSelectedShop(shop);
    setActionType(action);
    setShowModal(true);
  };

  const renderShopCard = (shop) => (
    <Card key={shop._id} className="mb-3 shadow-sm">
      <Card.Body>
        <Row>
          <Col md={3}>
            <img
              src={shop.logo || '/images/logo-placeholder.svg'}
              alt={shop.name}
              className="img-fluid rounded"
              style={{ height: '100px', width: '100px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/logo-placeholder.svg';
              }}
            />
          </Col>
          <Col md={6}>
            <h5>{shop.name}</h5>
            <p className="text-muted mb-1">
              <Badge bg="secondary">{shop.category}</Badge>
            </p>
            <p className="mb-1"><strong>Address:</strong> {shop.address}</p>
            <p className="mb-1"><strong>Phone:</strong> {shop.phone}</p>
            <p className="mb-1"><strong>Owner:</strong> {shop.owner?.name || 'N/A'}</p>
            <p className="mb-1"><strong>Email:</strong> {shop.owner?.email || 'N/A'}</p>
            <p className="mb-1"><strong>Delivery Fee:</strong> ${shop.deliveryFee}</p>
            <p className="mb-1"><strong>Min Order:</strong> ${shop.minOrderAmount}</p>
            {shop.description && (
              <p className="text-muted"><strong>Description:</strong> {shop.description}</p>
            )}
          </Col>
          <Col md={3} className="d-flex flex-column justify-content-center">
            {activeTab === 'pending' && (
              <>
                <Button
                  variant="success"
                  className="mb-2"
                  onClick={() => openConfirmModal(shop, 'approve')}
                >
                  <i className="fas fa-check me-2"></i>
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => openConfirmModal(shop, 'reject')}
                >
                  <i className="fas fa-times me-2"></i>
                  Reject
                </Button>
              </>
            )}
            {activeTab === 'approved' && (
              <Button
                variant="warning"
                onClick={() => openConfirmModal(shop, 'reject')}
              >
                <i className="fas fa-ban me-2"></i>
                Suspend
              </Button>
            )}
            {activeTab === 'rejected' && (
              <Button
                variant="success"
                onClick={() => openConfirmModal(shop, 'approve')}
              >
                <i className="fas fa-check me-2"></i>
                Approve
              </Button>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  const getShopsToDisplay = () => {
    switch (activeTab) {
      case 'pending':
        return pendingShops;
      case 'approved':
        return approvedShops;
      case 'rejected':
        return rejectedShops;
      default:
        return [];
    }
  };

  if (loading) return <Loader />;

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="mb-0">
              <i className="fas fa-cogs me-3"></i>
              Admin Panel - Shop Management
            </h1>
            <Button 
              variant="primary" 
              onClick={() => navigate('/admin/dashboard')}
              className="d-flex align-items-center"
            >
              <i className="fas fa-chart-bar me-2"></i>
              Advanced Dashboard
            </Button>
          </div>

          {error && <Message variant="danger">{error}</Message>}
          {success && <Message variant="success">{success}</Message>}

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center bg-warning text-white">
                <Card.Body>
                  <h3>{pendingShops.length}</h3>
                  <p>Pending Approval</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center bg-success text-white">
                <Card.Body>
                  <h3>{approvedShops.length}</h3>
                  <p>Approved Shops</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center bg-danger text-white">
                <Card.Body>
                  <h3>{rejectedShops.length}</h3>
                  <p>Rejected Shops</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tab Navigation */}
          <div className="mb-4">
            <Button
              variant={activeTab === 'pending' ? 'primary' : 'outline-primary'}
              className="me-2"
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pendingShops.length})
            </Button>
            <Button
              variant={activeTab === 'approved' ? 'success' : 'outline-success'}
              className="me-2"
              onClick={() => setActiveTab('approved')}
            >
              Approved ({approvedShops.length})
            </Button>
            <Button
              variant={activeTab === 'rejected' ? 'danger' : 'outline-danger'}
              onClick={() => setActiveTab('rejected')}
            >
              Rejected ({rejectedShops.length})
            </Button>
          </div>

          {/* Shops List */}
          <div>
            {getShopsToDisplay().length === 0 ? (
              <Alert variant="info">
                No {activeTab} shops found.
              </Alert>
            ) : (
              getShopsToDisplay().map(renderShopCard)
            )}
          </div>
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedShop && (
            <div>
              <p>
                Are you sure you want to <strong>{actionType}</strong> the shop:
              </p>
              <div className="bg-light p-3 rounded">
                <h5>{selectedShop.name}</h5>
                <p className="mb-1"><strong>Category:</strong> {selectedShop.category}</p>
                <p className="mb-1"><strong>Owner:</strong> {selectedShop.owner?.name}</p>
                <p className="mb-0"><strong>Address:</strong> {selectedShop.address}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant={actionType === 'approve' ? 'success' : 'danger'}
            onClick={() => handleShopAction(selectedShop._id, actionType)}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'} Shop
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPanelScreen;