import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Tabs, Tab, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AdminDashboardScreen.css';

const AdminDashboardScreen = () => {
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Shop data
  const [pendingShops, setPendingShops] = useState([]);
  const [approvedShops, setApprovedShops] = useState([]);
  const [rejectedShops, setRejectedShops] = useState([]);
  const [allShops, setAllShops] = useState([]);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Analytics data
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      totalShops: 0,
      totalOrders: 0,
      totalMenuItems: 0,
      totalRevenue: 0,
      periodRevenue: 0,
      newUsersThisPeriod: 0,
      newShopsThisPeriod: 0,
      newOrdersThisPeriod: 0,
    },
    userStats: {
      total: 0,
      customers: 0,
      shopOwners: 0,
      admins: 0,
      newUsers: 0,
    },
    shopStats: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      newShops: 0,
    },
    orderStats: {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      newOrders: 0,
      averageOrderValue: 0,
    },
    revenueStats: {
      total: 0,
      period: 0,
      averagePerOrder: 0,
      averagePerDay: 0,
    },
    popularItems: [],
    topShops: [],
    dailyStats: {},
  });
  
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  
  // Statistics (legacy - keeping for backward compatibility)
  const [stats, setStats] = useState({
    totalShops: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    todayRegistrations: 0,
    weeklyRegistrations: 0
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      const userInfo = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null;

      if (!userInfo || userInfo.role !== 'admin') {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/admin/analytics?period=${analyticsPeriod}`, {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error('Failed to fetch analytics data');
    }
  }, [navigate, analyticsPeriod]);

  const fetchAllShops = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get user info from localStorage
      const userInfo = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null;

      if (!userInfo || userInfo.role !== 'admin') {
        navigate('/login');
        return;
      }
      
      // Fetch shops by status
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch('/api/shops/admin/pending', {
          headers: { 'Authorization': `Bearer ${userInfo.token}` }
        }),
        fetch('/api/shops/admin/approved', {
          headers: { 'Authorization': `Bearer ${userInfo.token}` }
        }),
        fetch('/api/shops/admin/rejected', {
          headers: { 'Authorization': `Bearer ${userInfo.token}` }
        })
      ]);

      const [pending, approved, rejected] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        rejectedRes.json()
      ]);

      // Handle the new API response structure with shops array and pagination
      const pendingShops = pending.shops || pending || [];
      const approvedShops = approved.shops || approved || [];
      const rejectedShops = rejected.shops || rejected || [];

      setPendingShops(pendingShops);
      setApprovedShops(approvedShops);
      setRejectedShops(rejectedShops);
      
      const all = [...pendingShops, ...approvedShops, ...rejectedShops];
      setAllShops(all);
      
      // Calculate statistics
      const today = new Date().toDateString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      setStats({
        totalShops: all.length,
        pendingCount: pending.length,
        approvedCount: approved.length,
        rejectedCount: rejected.length,
        todayRegistrations: all.filter(shop => 
          new Date(shop.createdAt).toDateString() === today
        ).length,
        weeklyRegistrations: all.filter(shop => 
          new Date(shop.createdAt) >= weekAgo
        ).length
      });

    } catch (error) {
      setError('Failed to fetch shops data');
      toast.error('Failed to fetch shops data');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Check admin access and fetch data
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAllShops();
    fetchAnalytics();
  }, [navigate, fetchAllShops, fetchAnalytics]);

  // Refetch analytics when period changes
  useEffect(() => {
    fetchAnalytics();
  }, [analyticsPeriod, fetchAnalytics]);

  const handleViewDetails = (shop) => {
    setSelectedShop(shop);
    setShowDetailsModal(true);
  };

  const handleApproveShop = async () => {
    if (!selectedShop) return;

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

      const response = await fetch(`/api/shops/admin/${selectedShop._id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ adminNotes })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Shop approved successfully!');
        setShowApprovalModal(false);
        setAdminNotes('');
        fetchAllShops(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to approve shop');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectShop = async () => {
    if (!selectedShop || !adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

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

      const response = await fetch(`/api/shops/admin/${selectedShop._id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ adminNotes })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Shop rejected successfully!');
        setShowRejectionModal(false);
        setAdminNotes('');
        fetchAllShops(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to reject shop');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'approved':
        return <Badge bg="success">Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && allShops.length === 0) {
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
    <Container fluid className="admin-dashboard-screen mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>Admin Dashboard</h2>
              <p className="text-muted">Manage shop registrations and approvals</p>
            </div>
            <div>
              <Button variant="outline-primary" className="me-2" onClick={() => navigate('/admin/users')}>
                Manage Users
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/admin')}>
                Back to Admin Panel
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="stat-card text-center">
                <Card.Body>
                  <div className="stat-icon total">🏪</div>
                  <h3>{stats.totalShops}</h3>
                  <p className="mb-0">Total Shops</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card text-center">
                <Card.Body>
                  <div className="stat-icon pending">⏳</div>
                  <h3>{stats.pendingCount}</h3>
                  <p className="mb-0">Pending Approval</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card text-center">
                <Card.Body>
                  <div className="stat-icon approved">✅</div>
                  <h3>{stats.approvedCount}</h3>
                  <p className="mb-0">Approved</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card text-center">
                <Card.Body>
                  <div className="stat-icon rejected">❌</div>
                  <h3>{stats.rejectedCount}</h3>
                  <p className="mb-0">Rejected</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Additional Stats */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Body>
                  <h6>Registration Activity</h6>
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{stats.todayRegistrations}</strong>
                      <small className="d-block text-muted">Today</small>
                    </div>
                    <div>
                      <strong>{stats.weeklyRegistrations}</strong>
                      <small className="d-block text-muted">This Week</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100">
                <Card.Body>
                  <h6>Approval Rate</h6>
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>
                        {stats.totalShops > 0 
                          ? Math.round((stats.approvedCount / stats.totalShops) * 100)
                          : 0}%
                      </strong>
                      <small className="d-block text-muted">Approved</small>
                    </div>
                    <div>
                      <strong>
                        {stats.totalShops > 0 
                          ? Math.round((stats.rejectedCount / stats.totalShops) * 100)
                          : 0}%
                      </strong>
                      <small className="d-block text-muted">Rejected</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Shops Management Tabs */}
          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            <Tab eventKey="overview" title="Analytics Overview">
              <Row className="mb-4">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Platform Analytics</h5>
                    <Form.Select 
                      value={analyticsPeriod} 
                      onChange={(e) => setAnalyticsPeriod(e.target.value)}
                      style={{ width: 'auto' }}
                    >
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                      <option value="1y">Last Year</option>
                    </Form.Select>
                  </div>
                </Col>
              </Row>

              {/* Overview Statistics */}
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="stat-card text-center">
                    <Card.Body>
                      <div className="stat-icon total">👥</div>
                      <h3>{analytics.overview.totalUsers}</h3>
                      <p className="mb-0">Total Users</p>
                      <small className="text-success">+{analytics.overview.newUsersThisPeriod} this period</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="stat-card text-center">
                    <Card.Body>
                      <div className="stat-icon total">🏪</div>
                      <h3>{analytics.overview.totalShops}</h3>
                      <p className="mb-0">Total Shops</p>
                      <small className="text-success">+{analytics.overview.newShopsThisPeriod} this period</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="stat-card text-center">
                    <Card.Body>
                      <div className="stat-icon total">📦</div>
                      <h3>{analytics.overview.totalOrders}</h3>
                      <p className="mb-0">Total Orders</p>
                      <small className="text-success">+{analytics.overview.newOrdersThisPeriod} this period</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="stat-card text-center">
                    <Card.Body>
                      <div className="stat-icon total">💰</div>
                      <h3>PKR {analytics.overview.totalRevenue.toLocaleString()}</h3>
                      <p className="mb-0">Total Revenue</p>
                      <small className="text-success">PKR {analytics.overview.periodRevenue.toLocaleString()} this period</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Detailed Analytics */}
              <Row className="mb-4">
                <Col md={6}>
                  <Card>
                    <Card.Body>
                      <h6>User Statistics</h6>
                      <Row>
                        <Col md={6}>
                          <p><strong>Customers:</strong> {analytics.userStats.customers}</p>
                          <p><strong>Shop Owners:</strong> {analytics.userStats.shopOwners}</p>
                          <p><strong>Admins:</strong> {analytics.userStats.admins}</p>
                        </Col>
                        <Col md={6}>
                          <p><strong>New Users:</strong> {analytics.userStats.newUsers}</p>
                          <p><strong>Growth Rate:</strong> {analytics.userStats.total > 0 ? Math.round((analytics.userStats.newUsers / analytics.userStats.total) * 100) : 0}%</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Body>
                      <h6>Order Statistics</h6>
                      <Row>
                        <Col md={6}>
                          <p><strong>Pending:</strong> {analytics.orderStats.pending}</p>
                          <p><strong>Processing:</strong> {analytics.orderStats.processing}</p>
                          <p><strong>Delivered:</strong> {analytics.orderStats.delivered}</p>
                        </Col>
                        <Col md={6}>
                          <p><strong>Cancelled:</strong> {analytics.orderStats.cancelled}</p>
                          <p><strong>Avg Order Value:</strong> PKR {analytics.orderStats.averageOrderValue}</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Popular Items and Top Shops */}
              <Row className="mb-4">
                <Col md={6}>
                  <Card>
                    <Card.Body>
                      <h6>Popular Items</h6>
                      {analytics.popularItems.length > 0 ? (
                        <Table responsive size="sm">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Orders</th>
                              <th>Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.popularItems.slice(0, 5).map((item, index) => (
                              <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.orderCount}</td>
                                <td>PKR {item.revenue.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="text-muted">No data available</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Body>
                      <h6>Top Performing Shops</h6>
                      {analytics.topShops.length > 0 ? (
                        <Table responsive size="sm">
                          <thead>
                            <tr>
                              <th>Shop</th>
                              <th>Orders</th>
                              <th>Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.topShops.slice(0, 5).map((shop, index) => (
                              <tr key={index}>
                                <td>{shop.name}</td>
                                <td>{shop.orderCount}</td>
                                <td>PKR {shop.revenue.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="text-muted">No data available</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Revenue Analytics */}
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Body>
                      <h6>Revenue Analytics</h6>
                      <Row>
                        <Col md={3}>
                          <div className="text-center">
                            <h4>PKR {analytics.revenueStats.total.toLocaleString()}</h4>
                            <small className="text-muted">Total Revenue</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <h4>PKR {analytics.revenueStats.period.toLocaleString()}</h4>
                            <small className="text-muted">Period Revenue</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <h4>PKR {analytics.revenueStats.averagePerOrder}</h4>
                            <small className="text-muted">Avg per Order</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <h4>PKR {analytics.revenueStats.averagePerDay}</h4>
                            <small className="text-muted">Avg per Day</small>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="pending" title={`Pending (${stats.pendingCount})`}>
              <Card>
                <Card.Body>
                  <h5>Shops Awaiting Approval</h5>
                  {pendingShops.length === 0 ? (
                    <Alert variant="info">No pending shops for approval.</Alert>
                  ) : (
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Shop Name</th>
                          <th>Owner</th>
                          <th>Category</th>
                          <th>Location</th>
                          <th>Registered</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingShops.map((shop) => (
                          <tr key={shop._id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <img 
                                  src={shop.logo || '/images/logo-placeholder.svg'} 
                                  alt={shop.name}
                                  className="shop-logo me-2"
                                />
                                <div>
                                  <strong>{shop.name}</strong>
                                  <small className="d-block text-muted">{shop.cuisine}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{shop.businessInfo?.ownerName || 'N/A'}</strong>
                                <small className="d-block text-muted">{shop.owner?.email}</small>
                              </div>
                            </td>
                            <td>{shop.category}</td>
                            <td>{shop.address?.area}, {shop.address?.city}</td>
                            <td>{formatDate(shop.createdAt)}</td>
                            <td>{getStatusBadge(shop.approvalStatus)}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleViewDetails(shop)}
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="success" 
                                size="sm" 
                                className="me-2"
                                onClick={() => {
                                  setSelectedShop(shop);
                                  setShowApprovalModal(true);
                                }}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => {
                                  setSelectedShop(shop);
                                  setShowRejectionModal(true);
                                }}
                              >
                                Reject
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="approved" title={`Approved (${stats.approvedCount})`}>
              <Card>
                <Card.Body>
                  <h5>Approved Shops</h5>
                  {approvedShops.length === 0 ? (
                    <Alert variant="info">No approved shops yet.</Alert>
                  ) : (
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Shop Name</th>
                          <th>Owner</th>
                          <th>Category</th>
                          <th>Location</th>
                          <th>Approved Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedShops.map((shop) => (
                          <tr key={shop._id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <img 
                                  src={shop.logo || '/images/logo-placeholder.svg'} 
                                  alt={shop.name}
                                  className="shop-logo me-2"
                                />
                                <div>
                                  <strong>{shop.name}</strong>
                                  <small className="d-block text-muted">{shop.cuisine}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{shop.businessInfo?.ownerName || 'N/A'}</strong>
                                <small className="d-block text-muted">{shop.owner?.email}</small>
                              </div>
                            </td>
                            <td>{shop.category}</td>
                            <td>{shop.address?.area}, {shop.address?.city}</td>
                            <td>{formatDate(shop.updatedAt)}</td>
                            <td>
                              {getStatusBadge(shop.approvalStatus)}
                              {shop.isOpen && <Badge bg="success" className="ms-1">Open</Badge>}
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleViewDetails(shop)}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="rejected" title={`Rejected (${stats.rejectedCount})`}>
              <Card>
                <Card.Body>
                  <h5>Rejected Shops</h5>
                  {rejectedShops.length === 0 ? (
                    <Alert variant="info">No rejected shops.</Alert>
                  ) : (
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Shop Name</th>
                          <th>Owner</th>
                          <th>Category</th>
                          <th>Location</th>
                          <th>Rejected Date</th>
                          <th>Reason</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejectedShops.map((shop) => (
                          <tr key={shop._id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <img 
                                  src={shop.logo || '/images/logo-placeholder.svg'} 
                                  alt={shop.name}
                                  className="shop-logo me-2"
                                />
                                <div>
                                  <strong>{shop.name}</strong>
                                  <small className="d-block text-muted">{shop.cuisine}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{shop.businessInfo?.ownerName || 'N/A'}</strong>
                                <small className="d-block text-muted">{shop.owner?.email}</small>
                              </div>
                            </td>
                            <td>{shop.category}</td>
                            <td>{shop.address?.area}, {shop.address?.city}</td>
                            <td>{formatDate(shop.updatedAt)}</td>
                            <td>
                              <small className="text-muted">
                                {shop.adminNotes || 'No reason provided'}
                              </small>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleViewDetails(shop)}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="all" title={`All Shops (${stats.totalShops})`}>
              <Card>
                <Card.Body>
                  <h5>All Registered Shops</h5>
                  {allShops.length === 0 ? (
                    <Alert variant="info">No shops registered yet.</Alert>
                  ) : (
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Shop Name</th>
                          <th>Owner</th>
                          <th>Category</th>
                          <th>Location</th>
                          <th>Registered</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allShops.map((shop) => (
                          <tr key={shop._id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <img 
                                  src={shop.logo || '/images/logo-placeholder.svg'} 
                                  alt={shop.name}
                                  className="shop-logo me-2"
                                />
                                <div>
                                  <strong>{shop.name}</strong>
                                  <small className="d-block text-muted">{shop.cuisine}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{shop.businessInfo?.ownerName || 'N/A'}</strong>
                                <small className="d-block text-muted">{shop.owner?.email}</small>
                              </div>
                            </td>
                            <td>{shop.category}</td>
                            <td>{shop.address?.area}, {shop.address?.city}</td>
                            <td>{formatDate(shop.createdAt)}</td>
                            <td>
                              {getStatusBadge(shop.approvalStatus)}
                              {shop.isOpen && shop.approvalStatus === 'approved' && (
                                <Badge bg="success" className="ms-1">Open</Badge>
                              )}
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleViewDetails(shop)}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Shop Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Shop Details - {selectedShop?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedShop && (
            <Tabs defaultActiveKey="basic" className="mb-3">
              <Tab eventKey="basic" title="Basic Info">
                <Row>
                  <Col md={6}>
                    <h6>Shop Information</h6>
                    <p><strong>Name:</strong> {selectedShop.name}</p>
                    <p><strong>Description:</strong> {selectedShop.description}</p>
                    <p><strong>Cuisine:</strong> {selectedShop.cuisine}</p>
                    <p><strong>Category:</strong> {selectedShop.category}</p>
                    <p><strong>Phone:</strong> {selectedShop.phone}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedShop.approvalStatus)}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Address</h6>
                    <p><strong>Street:</strong> {selectedShop.address?.street}</p>
                    <p><strong>Area:</strong> {selectedShop.address?.area}</p>
                    <p><strong>City:</strong> {selectedShop.address?.city}</p>
                    <p><strong>Postal Code:</strong> {selectedShop.address?.postalCode}</p>
                    {selectedShop.address?.coordinates && (
                      <p><strong>Coordinates:</strong> {selectedShop.address.coordinates.latitude}, {selectedShop.address.coordinates.longitude}</p>
                    )}
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="business" title="Business Info">
                <Row>
                  <Col md={6}>
                    <h6>Business Details</h6>
                    <p><strong>Business Name:</strong> {selectedShop.businessInfo?.businessName}</p>
                    <p><strong>Business Type:</strong> {selectedShop.businessInfo?.businessType}</p>
                    <p><strong>Owner Name:</strong> {selectedShop.businessInfo?.ownerName}</p>
                    <p><strong>Owner CNIC:</strong> {selectedShop.businessInfo?.ownerCNIC}</p>
                    <p><strong>Tax Number:</strong> {selectedShop.businessInfo?.taxNumber}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Contact Information</h6>
                    <p><strong>Owner Email:</strong> {selectedShop.owner?.email}</p>
                    <p><strong>Phone:</strong> {selectedShop.phone}</p>
                    {selectedShop.socialMedia && (
                      <>
                        {selectedShop.socialMedia.facebook && (
                          <p><strong>Facebook:</strong> {selectedShop.socialMedia.facebook}</p>
                        )}
                        {selectedShop.socialMedia.instagram && (
                          <p><strong>Instagram:</strong> {selectedShop.socialMedia.instagram}</p>
                        )}
                        {selectedShop.socialMedia.whatsapp && (
                          <p><strong>WhatsApp:</strong> {selectedShop.socialMedia.whatsapp}</p>
                        )}
                      </>
                    )}
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="delivery" title="Delivery Info">
                {selectedShop.deliveryInfo && (
                  <Row>
                    <Col md={6}>
                      <h6>Delivery Settings</h6>
                      <p><strong>Delivery Fee:</strong> PKR {selectedShop.deliveryInfo.deliveryFee}</p>
                      <p><strong>Free Delivery Threshold:</strong> PKR {selectedShop.deliveryInfo.freeDeliveryThreshold}</p>
                      <p><strong>Estimated Time:</strong> {selectedShop.deliveryInfo.estimatedDeliveryTime?.min}-{selectedShop.deliveryInfo.estimatedDeliveryTime?.max} minutes</p>
                      <p><strong>Online Payment:</strong> {selectedShop.deliveryInfo.acceptsOnlinePayment ? 'Yes' : 'No'}</p>
                      <p><strong>Cash on Delivery:</strong> {selectedShop.deliveryInfo.acceptsCashOnDelivery ? 'Yes' : 'No'}</p>
                    </Col>
                    <Col md={6}>
                      <h6>Delivery Areas</h6>
                      {selectedShop.deliveryInfo.deliveryAreas?.length > 0 ? (
                        <ul>
                          {selectedShop.deliveryInfo.deliveryAreas.map((area, index) => (
                            <li key={index}>
                              {area.area} {area.additionalFee > 0 && `(+PKR ${area.additionalFee})`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No delivery areas specified</p>
                      )}
                    </Col>
                  </Row>
                )}
              </Tab>

              <Tab eventKey="images" title="Images">
                <Row>
                  <Col md={6}>
                    <h6>Shop Logo</h6>
                    {selectedShop.logo ? (
                      <Image src={selectedShop.logo} alt="Shop Logo" thumbnail style={{ maxWidth: '200px' }} />
                    ) : (
                      <p>No logo uploaded</p>
                    )}
                  </Col>
                  <Col md={6}>
                    <h6>Shop Images</h6>
                    {selectedShop.images && selectedShop.images.length > 0 ? (
                      <Row>
                        {selectedShop.images.map((image, index) => (
                          <Col md={6} key={index} className="mb-2">
                            <Image src={image.url} alt={`Shop ${index + 1}`} thumbnail />
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <p>No images uploaded</p>
                    )}
                  </Col>
                </Row>
              </Tab>

              {selectedShop.adminNotes && (
                <Tab eventKey="notes" title="Admin Notes">
                  <div>
                    <h6>Admin Notes</h6>
                    <p>{selectedShop.adminNotes}</p>
                  </div>
                </Tab>
              )}
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedShop?.approvalStatus === 'pending' && (
            <>
              <Button 
                variant="success" 
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowApprovalModal(true);
                }}
              >
                Approve Shop
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowRejectionModal(true);
                }}
              >
                Reject Shop
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Approval Modal */}
      <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Approve Shop</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to approve <strong>{selectedShop?.name}</strong>?</p>
          <Form.Group>
            <Form.Label>Admin Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any notes for the shop owner..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleApproveShop} disabled={loading}>
            {loading ? 'Approving...' : 'Approve Shop'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Rejection Modal */}
      <Modal show={showRejectionModal} onHide={() => setShowRejectionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Shop</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to reject <strong>{selectedShop?.name}</strong>?</p>
          <Form.Group>
            <Form.Label>Reason for Rejection *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Please provide a clear reason for rejection..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectionModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRejectShop} disabled={loading || !adminNotes.trim()}>
            {loading ? 'Rejecting...' : 'Reject Shop'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboardScreen;