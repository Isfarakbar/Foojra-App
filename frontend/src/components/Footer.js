import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className='footer'>
      <Container>
        <Row>
          <Col md={4} className='mb-4'>
            <h5>Foojra</h5>
            <p>Your favorite food, delivered fast and fresh.</p>
          </Col>
          <Col md={4} className='mb-4'>
            <h5>Quick Links</h5>
            <ul className='list-unstyled'>
              <li><a href='/'>Home</a></li>
              <li><a href='/shops'>Shops</a></li>
              <li><a href='/register'>Register</a></li>
              <li><a href='/login'>Login</a></li>
            </ul>
          </Col>
          <Col md={4} className='mb-4'>
            <h5>Contact Us</h5>
            <ul className='list-unstyled'>
              <li><i className='fas fa-envelope me-2'></i> support@foojra.com</li>
              <li><i className='fas fa-phone me-2'></i> +1 (555) 123-4567</li>
              <li><i className='fas fa-map-marker-alt me-2'></i> 123 Food Street, Kitchen City</li>
            </ul>
          </Col>
        </Row>
        <Row>
          <Col className='text-center py-3'>
            <p>Copyright &copy; Foojra {new Date().getFullYear()}</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;