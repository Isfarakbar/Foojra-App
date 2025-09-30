import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Modal, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './ShopProfileScreen.css';

const ShopProfileScreen = () => {
  const navigate = useNavigate();
  
  // Shop data state
  const [shopData, setShopData] = useState({
    name: '',
    description: '',
    phone: '',
    address: {
      street: '',
      area: '',
      city: 'Gojra',
      postalCode: '',
      coordinates: { latitude: '', longitude: '' }
    },
    businessInfo: {
      businessName: '',
      businessType: 'Restaurant',
      ownerName: '',
      ownerCNIC: '',
      taxNumber: ''
    },
    cuisine: '',
    category: 'Restaurant',
    operatingHours: {
      monday: { open: '09:00', close: '22:00', isClosed: false },
      tuesday: { open: '09:00', close: '22:00', isClosed: false },
      wednesday: { open: '09:00', close: '22:00', isClosed: false },
      thursday: { open: '09:00', close: '22:00', isClosed: false },
      friday: { open: '09:00', close: '22:00', isClosed: false },
      saturday: { open: '09:00', close: '22:00', isClosed: false },
      sunday: { open: '10:00', close: '21:00', isClosed: false }
    },
    deliveryInfo: {
      deliveryFee: 50,
      freeDeliveryThreshold: 500,
      estimatedDeliveryTime: { min: 30, max: 60 },
      deliveryAreas: [
        { area: 'City Center', additionalFee: 0 },
        { area: 'Satellite Town', additionalFee: 20 },
        { area: 'Model Town', additionalFee: 30 }
      ],
      acceptsOnlinePayment: true,
      acceptsCashOnDelivery: true
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      whatsapp: ''
    },
    features: {
      hasTableBooking: false,
      hasPickup: true,
      hasDelivery: true,
      acceptsPreOrders: false
    },
    isOpen: true
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [newArea, setNewArea] = useState({ area: '', additionalFee: 0 });
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewLogo, setPreviewLogo] = useState('');

  const fetchShopData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get user info from localStorage
      const userInfo = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null;

      if (!userInfo) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/shops/my-shop', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShopData(data);
        if (data.images && data.images.length > 0) {
          setPreviewImages(data.images.map(img => img.url));
        }
        if (data.logo) {
          setPreviewLogo(data.logo);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch shop data');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [navigate, setPreviewImages, setPreviewLogo]);

  // Load shop data on component mount
  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  const handleInputChange = (section, field, value) => {
    if (section) {
      setShopData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setShopData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setShopData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...previews]);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedLogo(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const removeImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    if (index < selectedImages.length) {
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addDeliveryArea = () => {
    if (newArea.area.trim()) {
      setShopData(prev => ({
        ...prev,
        deliveryInfo: {
          ...prev.deliveryInfo,
          deliveryAreas: [...prev.deliveryInfo.deliveryAreas, { ...newArea }]
        }
      }));
      setNewArea({ area: '', additionalFee: 0 });
      setShowAreaModal(false);
    }
  };

  const removeDeliveryArea = (index) => {
    setShopData(prev => ({
      ...prev,
      deliveryInfo: {
        ...prev.deliveryInfo,
        deliveryAreas: prev.deliveryInfo.deliveryAreas.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      
      // Add basic shop data
      formData.append('name', shopData.name);
      formData.append('description', shopData.description);
      formData.append('phone', shopData.phone);
      formData.append('cuisine', shopData.cuisine);
      formData.append('category', shopData.category);
      formData.append('isOpen', shopData.isOpen);
      
      // Add complex objects as JSON strings
      formData.append('address', JSON.stringify(shopData.address));
      formData.append('businessInfo', JSON.stringify(shopData.businessInfo));
      formData.append('operatingHours', JSON.stringify(shopData.operatingHours));
      formData.append('deliveryInfo', JSON.stringify(shopData.deliveryInfo));
      formData.append('socialMedia', JSON.stringify(shopData.socialMedia));
      formData.append('features', JSON.stringify(shopData.features));
      
      // Add images
      selectedImages.forEach(image => {
        formData.append('shopImage', image);
      });
      
      if (selectedLogo) {
        formData.append('shopLogo', selectedLogo);
      }

      const response = await fetch('/api/shops/my-shop', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Shop profile updated successfully!');
        toast.success('Shop profile updated successfully!');
        // Refresh shop data
        fetchShopData();
      } else {
        setError(data.message || 'Failed to update shop profile');
        toast.error(data.message || 'Failed to update shop profile');
      }
    } catch (error) {
      setError('Network error occurred');
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleShopStatus = async () => {
    try {
      const response = await fetch('/api/shops/toggle-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setShopData(prev => ({ ...prev, isOpen: data.isOpen }));
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to toggle shop status');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  if (loading && !shopData.name) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="shop-profile-screen mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>Shop Profile Management</h2>
              <p className="text-muted">Manage your shop information and settings</p>
            </div>
            <div>
              <Button 
                variant={shopData.isOpen ? 'success' : 'danger'} 
                onClick={toggleShopStatus}
                className="me-2"
              >
                {shopData.isOpen ? 'Shop Open' : 'Shop Closed'}
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/shop-owner/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
              {/* Basic Information Tab */}
              <Tab eventKey="basic" title="Basic Info">
                <Card>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Shop Name *</Form.Label>
                          <Form.Control
                            type="text"
                            value={shopData.name}
                            onChange={(e) => handleInputChange(null, 'name', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number *</Form.Label>
                          <Form.Control
                            type="tel"
                            value={shopData.phone}
                            onChange={(e) => handleInputChange(null, 'phone', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Description *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={shopData.description}
                        onChange={(e) => handleInputChange(null, 'description', e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cuisine Type *</Form.Label>
                          <Form.Control
                            type="text"
                            value={shopData.cuisine}
                            onChange={(e) => handleInputChange(null, 'cuisine', e.target.value)}
                            placeholder="e.g., Pakistani, Chinese, Italian"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Category *</Form.Label>
                          <Form.Select
                            value={shopData.category}
                            onChange={(e) => handleInputChange(null, 'category', e.target.value)}
                            required
                          >
                            <option value="Restaurant">Restaurant</option>
                            <option value="Mart">Mart</option>
                            <option value="Home Shop">Home Shop</option>
                            <option value="Others">Others</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Address Tab */}
              <Tab eventKey="address" title="Address">
                <Card>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Street Address *</Form.Label>
                          <Form.Control
                            type="text"
                            value={shopData.address.street}
                            onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Area/Locality *</Form.Label>
                          <Form.Control
                            type="text"
                            value={shopData.address.area}
                            onChange={(e) => handleInputChange('address', 'area', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            value={shopData.address.city}
                            onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                            readOnly
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Postal Code *</Form.Label>
                          <Form.Control
                            type="text"
                            value={shopData.address.postalCode}
                            onChange={(e) => handleInputChange('address', 'postalCode', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Latitude (Optional)</Form.Label>
                          <Form.Control
                            type="number"
                            step="any"
                            value={shopData.address.coordinates.latitude}
                            onChange={(e) => handleInputChange('address', 'coordinates', {
                              ...shopData.address.coordinates,
                              latitude: e.target.value
                            })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Longitude (Optional)</Form.Label>
                          <Form.Control
                            type="number"
                            step="any"
                            value={shopData.address.coordinates.longitude}
                            onChange={(e) => handleInputChange('address', 'coordinates', {
                              ...shopData.address.coordinates,
                              longitude: e.target.value
                            })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Images Tab */}
              <Tab eventKey="images" title="Images">
                <Card>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Shop Logo</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                          />
                          {previewLogo && (
                            <div className="mt-2">
                              <img 
                                src={previewLogo} 
                                alt="Logo Preview" 
                                className="img-thumbnail"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Shop Images</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {previewImages.length > 0 && (
                      <div>
                        <h6>Image Previews:</h6>
                        <Row>
                          {previewImages.map((image, index) => (
                            <Col md={3} key={index} className="mb-3">
                              <div className="position-relative">
                                <img 
                                  src={image} 
                                  alt={`Preview ${index + 1}`} 
                                  className="img-thumbnail w-100"
                                  style={{ height: '150px', objectFit: 'cover' }}
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="position-absolute top-0 end-0"
                                  onClick={() => removeImage(index)}
                                >
                                  ×
                                </Button>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab>

              {/* Operating Hours Tab */}
              <Tab eventKey="hours" title="Operating Hours">
                <Card>
                  <Card.Body>
                    {Object.entries(shopData.operatingHours).map(([day, hours]) => (
                      <Row key={day} className="mb-3 align-items-center">
                        <Col md={2}>
                          <strong className="text-capitalize">{day}</strong>
                        </Col>
                        <Col md={2}>
                          <Form.Check
                            type="checkbox"
                            label="Closed"
                            checked={hours.isClosed}
                            onChange={(e) => handleOperatingHoursChange(day, 'isClosed', e.target.checked)}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Control
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                            disabled={hours.isClosed}
                          />
                        </Col>
                        <Col md={1} className="text-center">
                          <span>to</span>
                        </Col>
                        <Col md={3}>
                          <Form.Control
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                            disabled={hours.isClosed}
                          />
                        </Col>
                      </Row>
                    ))}
                  </Card.Body>
                </Card>
              </Tab>

              {/* Delivery Settings Tab */}
              <Tab eventKey="delivery" title="Delivery Settings">
                <Card>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Delivery Fee (PKR)</Form.Label>
                          <Form.Control
                            type="number"
                            value={shopData.deliveryInfo.deliveryFee}
                            onChange={(e) => handleInputChange('deliveryInfo', 'deliveryFee', parseInt(e.target.value))}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Free Delivery Threshold (PKR)</Form.Label>
                          <Form.Control
                            type="number"
                            value={shopData.deliveryInfo.freeDeliveryThreshold}
                            onChange={(e) => handleInputChange('deliveryInfo', 'freeDeliveryThreshold', parseInt(e.target.value))}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Min Delivery Time (minutes)</Form.Label>
                          <Form.Control
                            type="number"
                            value={shopData.deliveryInfo.estimatedDeliveryTime.min}
                            onChange={(e) => handleInputChange('deliveryInfo', 'estimatedDeliveryTime', {
                              ...shopData.deliveryInfo.estimatedDeliveryTime,
                              min: parseInt(e.target.value)
                            })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Max Delivery Time (minutes)</Form.Label>
                          <Form.Control
                            type="number"
                            value={shopData.deliveryInfo.estimatedDeliveryTime.max}
                            onChange={(e) => handleInputChange('deliveryInfo', 'estimatedDeliveryTime', {
                              ...shopData.deliveryInfo.estimatedDeliveryTime,
                              max: parseInt(e.target.value)
                            })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6>Delivery Areas</h6>
                        <Button variant="outline-primary" size="sm" onClick={() => setShowAreaModal(true)}>
                          Add Area
                        </Button>
                      </div>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Area</th>
                            <th>Additional Fee (PKR)</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shopData.deliveryInfo.deliveryAreas.map((area, index) => (
                            <tr key={index}>
                              <td>{area.area}</td>
                              <td>{area.additionalFee}</td>
                              <td>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => removeDeliveryArea(index)}
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Accept Online Payment"
                          checked={shopData.deliveryInfo.acceptsOnlinePayment}
                          onChange={(e) => handleInputChange('deliveryInfo', 'acceptsOnlinePayment', e.target.checked)}
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Accept Cash on Delivery"
                          checked={shopData.deliveryInfo.acceptsCashOnDelivery}
                          onChange={(e) => handleInputChange('deliveryInfo', 'acceptsCashOnDelivery', e.target.checked)}
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Features & Social Media Tab */}
              <Tab eventKey="features" title="Features & Social">
                <Card>
                  <Card.Body>
                    <h6>Features</h6>
                    <Row className="mb-4">
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Table Booking"
                          checked={shopData.features.hasTableBooking}
                          onChange={(e) => handleInputChange('features', 'hasTableBooking', e.target.checked)}
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Pickup Available"
                          checked={shopData.features.hasPickup}
                          onChange={(e) => handleInputChange('features', 'hasPickup', e.target.checked)}
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Delivery Available"
                          checked={shopData.features.hasDelivery}
                          onChange={(e) => handleInputChange('features', 'hasDelivery', e.target.checked)}
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Accept Pre-orders"
                          checked={shopData.features.acceptsPreOrders}
                          onChange={(e) => handleInputChange('features', 'acceptsPreOrders', e.target.checked)}
                        />
                      </Col>
                    </Row>

                    <h6>Social Media</h6>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Facebook</Form.Label>
                          <Form.Control
                            type="url"
                            value={shopData.socialMedia.facebook}
                            onChange={(e) => handleInputChange('socialMedia', 'facebook', e.target.value)}
                            placeholder="https://facebook.com/yourpage"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Instagram</Form.Label>
                          <Form.Control
                            type="url"
                            value={shopData.socialMedia.instagram}
                            onChange={(e) => handleInputChange('socialMedia', 'instagram', e.target.value)}
                            placeholder="https://instagram.com/yourpage"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>WhatsApp</Form.Label>
                          <Form.Control
                            type="tel"
                            value={shopData.socialMedia.whatsapp}
                            onChange={(e) => handleInputChange('socialMedia', 'whatsapp', e.target.value)}
                            placeholder="+92xxxxxxxxxx"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>

            <div className="text-center">
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                disabled={loading}
                className="px-5"
              >
                {loading ? 'Updating...' : 'Update Shop Profile'}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>

      {/* Add Delivery Area Modal */}
      <Modal show={showAreaModal} onHide={() => setShowAreaModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Delivery Area</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Area Name</Form.Label>
            <Form.Control
              type="text"
              value={newArea.area}
              onChange={(e) => setNewArea(prev => ({ ...prev, area: e.target.value }))}
              placeholder="e.g., Satellite Town"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Additional Fee (PKR)</Form.Label>
            <Form.Control
              type="number"
              value={newArea.additionalFee}
              onChange={(e) => setNewArea(prev => ({ ...prev, additionalFee: parseInt(e.target.value) || 0 }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAreaModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={addDeliveryArea}>
            Add Area
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ShopProfileScreen;