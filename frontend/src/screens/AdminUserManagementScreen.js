import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AdminUserManagementScreen = () => {
  const navigate = useNavigate();
  
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      const response = await fetch(`/api/users/admin/all?page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalUsers(data.pagination?.totalUsers || 0);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    // Check if user is admin
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchUsers();
  }, [navigate, fetchUsers]);

  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const updateUserRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      const response = await fetch(`/api/users/admin/${selectedUser._id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('User role updated successfully!');
        setShowRoleModal(false);
        fetchUsers(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to update user role');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      const response = await fetch(`/api/users/admin/${user._id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'User status updated successfully!');
        fetchUsers(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to update user status');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'shopOwner': return 'warning';
      case 'customer': return 'primary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (isActive) => {
    return isActive ? 'success' : 'secondary';
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>User Management</h3>
              <p className="mb-0 text-muted">Manage all users in the system</p>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Total Users: {totalUsers}</h5>
              </div>

              <Table responsive striped bordered hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(user.isActive !== false)}>
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleRoleChange(user)}
                        >
                          Change Role
                        </Button>
                        <Button
                          variant={user.isActive !== false ? 'outline-danger' : 'outline-success'}
                          size="sm"
                          onClick={() => toggleUserStatus(user)}
                        >
                          {user.isActive !== false ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center">
                  <Pagination>
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    />
                    {[...Array(totalPages)].map((_, index) => (
                      <Pagination.Item
                        key={index + 1}
                        active={index + 1 === currentPage}
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Role Change Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p><strong>User:</strong> {selectedUser.name} ({selectedUser.email})</p>
              <Form.Group>
                <Form.Label>Select New Role</Form.Label>
                <Form.Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="customer">Customer</option>
                  <option value="shopOwner">Shop Owner</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={updateUserRole}>
            Update Role
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUserManagementScreen;