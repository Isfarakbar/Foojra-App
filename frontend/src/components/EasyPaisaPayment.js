import React, { useState } from 'react';
import { Form, Button, Alert, Modal, Spinner } from 'react-bootstrap';

const EasyPaisaPayment = ({ amount, onSuccess, onError, show, onHide }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone number format
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid EasyPaisa phone number (03XXXXXXXXX)');
      setLoading(false);
      return;
    }

    // Validate PIN
    if (pin.length !== 5) {
      setError('Please enter a valid 5-digit PIN');
      setLoading(false);
      return;
    }

    try {
      // Simulate EasyPaisa API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock payment processing
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      if (success) {
        const paymentResult = {
          transactionId: `EP${Date.now()}`,
          status: 'COMPLETED',
          amount: amount,
          phoneNumber: phoneNumber,
          timestamp: new Date().toISOString(),
          method: 'EasyPaisa'
        };
        
        onSuccess(paymentResult);
      } else {
        throw new Error('Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setPin('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>EasyPaisa Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-3">
          <h5>Amount to Pay: PKR {amount}</h5>
        </div>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handlePayment}>
          <Form.Group className="mb-3">
            <Form.Label>EasyPaisa Phone Number</Form.Label>
            <Form.Control
              type="tel"
              placeholder="03XXXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              maxLength="11"
              required
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Enter your registered EasyPaisa phone number
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>PIN</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter 5-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength="5"
              required
              disabled={loading}
            />
          </Form.Group>

          <div className="d-grid gap-2">
            <Button 
              variant="success" 
              type="submit" 
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Processing Payment...
                </>
              ) : (
                `Pay PKR ${amount}`
              )}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </Form>

        <div className="mt-3 text-center">
          <small className="text-muted">
            Secure payment powered by EasyPaisa
          </small>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default EasyPaisaPayment;