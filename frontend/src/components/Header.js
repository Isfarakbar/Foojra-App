import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Header = () => {
  // This will be replaced with Redux state management
  const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;
  
  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <header>
      <Navbar expand='lg' collapseOnSelect>
        <Container>
          <LinkContainer to='/'>
            <Navbar.Brand>
              <i className='fas fa-utensils'></i> Foojra
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='ms-auto'>
              <LinkContainer to='/shops'>
                <Nav.Link>
                  <i className='fas fa-store'></i> Shops
                </Nav.Link>
              </LinkContainer>
              <LinkContainer to='/cart'>
                <Nav.Link>
                  <i className='fas fa-shopping-cart'></i> Cart
                </Nav.Link>
              </LinkContainer>
              {userInfo ? (
                <NavDropdown title={userInfo.name} id='username'>
                  {userInfo.role === 'admin' ? (
                    <>
                      <LinkContainer to='/admin'>
                        <NavDropdown.Item>
                          <i className='fas fa-cogs me-2'></i>
                          Admin Panel
                        </NavDropdown.Item>
                      </LinkContainer>
                      <NavDropdown.Divider />
                    </>
                  ) : null}
                  {userInfo.role === 'shopOwner' ? (
                    <>
                      <LinkContainer to='/shop-owner/dashboard'>
                        <NavDropdown.Item>Dashboard</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to='/shop-owner/register'>
                        <NavDropdown.Item>Register Shop</NavDropdown.Item>
                      </LinkContainer>
                    </>
                  ) : userInfo.role === 'user' ? (
                    <>
                      <LinkContainer to='/orders'>
                        <NavDropdown.Item>
                          <i className='fas fa-receipt me-2'></i>
                          My Orders
                        </NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to='/dashboard'>
                        <NavDropdown.Item>Dashboard</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to='/shop-owner/register'>
                        <NavDropdown.Item>Become Shop Owner</NavDropdown.Item>
                      </LinkContainer>
                    </>
                  ) : null}
                  <LinkContainer to='/profile'>
                    <NavDropdown.Item>Profile</NavDropdown.Item>
                  </LinkContainer>
                  <NavDropdown.Item onClick={logoutHandler}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <LinkContainer to='/login'>
                  <Nav.Link>
                    <i className='fas fa-user'></i> Sign In
                  </Nav.Link>
                </LinkContainer>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;