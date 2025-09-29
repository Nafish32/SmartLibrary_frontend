import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [returningBook, setReturningBook] = useState(false);
  const { isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (isLoggedIn()) {
        fetchBookings();
      } else {
        setLoading(false);
      }
    }
  }, [isLoggedIn, authLoading]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await apiService.getUserBookings();
      if (result.success) {
        // Sort bookings by date (newest first)
        const sortedBookings = result.data.sort((a, b) => 
          new Date(b.bookingDate) - new Date(a.bookingDate)
        );
        setBookings(sortedBookings);
      } else {
        setError(result.error);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load your bookings. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnClick = (booking) => {
    setSelectedBooking(booking);
    setShowReturnModal(true);
  };

  const confirmReturnBook = async () => {
    if (!selectedBooking) return;

    setReturningBook(true);
    setError('');

    try {
      const result = await apiService.returnBook(selectedBooking.id);
      if (result.success) {
        setSuccessMessage('Book returned successfully!');
        setShowReturnModal(false);
        setSelectedBooking(null);
        fetchBookings(); // Refresh the list
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error returning book:', error);
      setError('Failed to return book. Please try again.');
    } finally {
      setReturningBook(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'RETURNED':
        return 'primary';
      case 'OVERDUE':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return '📖';
      case 'RETURNED': return '✅';
      case 'OVERDUE': return '⚠️';
      default: return '📚';
    }
  };

  const calculateDaysSinceBooking = (bookingDate) => {
    const booking = new Date(bookingDate);
    const today = new Date();
    const diffTime = Math.abs(today - booking);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (authLoading || loading) {
    return (
      <Container>
        <div className="loading-container">
          <Spinner animation="border" role="status" className="mx-auto">
            <span className="visually-hidden">Loading bookings...</span>
          </Spinner>
          <p className="loading-text">Loading your bookings...</p>
        </div>
      </Container>
    );
  }

  if (!isLoggedIn()) {
    return (
      <Container>
        <Alert variant="warning" className="text-center py-5">
          <h4>🔐 Authentication Required</h4>
          <p>Please sign in to view your bookings and manage your borrowed books.</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h1 className="text-gradient mb-3">📚 My Bookings</h1>
        <p className="text-muted">
          Track your borrowed books and manage your library account
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      {/* Summary Statistics */}
      {bookings.length > 0 && (
        <Row className="mb-4">
          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-card text-center h-100">
              <Card.Body>
                <h5 className="display-6">📖</h5>
                <h3>{bookings.filter(b => b.status === 'ACTIVE').length}</h3>
                <p className="mb-0">Active Bookings</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-card text-center h-100">
              <Card.Body>
                <h5 className="display-6">✅</h5>
                <h3>{bookings.filter(b => b.status === 'RETURNED').length}</h3>
                <p className="mb-0">Returned Books</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-card text-center h-100">
              <Card.Body>
                <h5 className="display-6">⚠️</h5>
                <h3>{bookings.filter(b => b.status === 'OVERDUE').length}</h3>
                <p className="mb-0">Overdue Books</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-card text-center h-100">
              <Card.Body>
                <h5 className="display-6">📊</h5>
                <h3>{bookings.length}</h3>
                <p className="mb-0">Total Bookings</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Bookings Content */}
      {bookings.length === 0 ? (
        <Alert variant="info" className="text-center py-5">
          <h4>📚 No books found</h4>
          <p>You haven't booked any books yet. Start exploring our collection!</p>
          <div className="d-flex gap-3 justify-content-center">
            <Button variant="primary" onClick={() => navigate('/search')}>
              📖 Browse Books
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/chat')}>
              🤖 Get AI Recommendations
            </Button>
          </div>
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              📋 Your Bookings ({bookings.length})
            </h5>
            <Button variant="outline-primary" onClick={() => navigate('/search')}>
              ➕ Book More
            </Button>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Booking Info</th>
                    <th>Status</th>
                    <th>Days</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <div>
                          <strong className="d-block">
                            {booking.book?.title || 'Unknown Book'}
                          </strong>
                          <small className="text-muted">
                            by {booking.book?.author || 'Unknown Author'}
                          </small>
                          {booking.book?.genre && (
                            <div className="mt-1">
                              <Badge bg="secondary" className="me-2">
                                {booking.book.genre}
                              </Badge>
                              {booking.book?.publishedYear && (
                                <small className="text-muted">
                                  {booking.book.publishedYear}
                                </small>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong className="d-block">
                            {booking.bookingDate
                              ? new Date(booking.bookingDate).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'N/A'
                            }
                          </strong>
                          {booking.returnDate && (
                            <small className="text-muted d-block">
                              Returned: {new Date(booking.returnDate).toLocaleDateString()}
                            </small>
                          )}
                          {booking.notes && (
                            <small className="text-muted d-block mt-1">
                              📝 {booking.notes}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge 
                          bg={getStatusBadgeVariant(booking.status)} 
                          className="status-badge d-flex align-items-center gap-1"
                        >
                          {getStatusIcon(booking.status)} {booking.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="text-center">
                          <strong className="d-block">
                            {calculateDaysSinceBooking(booking.bookingDate)}
                          </strong>
                          <small className="text-muted">
                            {booking.status === 'RETURNED' ? 'Total' : 'Days'}
                          </small>
                        </div>
                      </td>
                      <td>
                        {booking.status === 'ACTIVE' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleReturnClick(booking)}
                          >
                            ↩️ Return
                          </Button>
                        )}
                        {booking.status === 'RETURNED' && (
                          <Badge bg="success" className="status-badge">
                            ✅ Complete
                          </Badge>
                        )}
                        {booking.status === 'OVERDUE' && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleReturnClick(booking)}
                          >
                            ⚠️ Return Now
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Quick Actions */}
      {bookings.length > 0 && (
        <Card className="mt-4">
          <Card.Body className="text-center">
            <h6 className="mb-3">Quick Actions</h6>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button variant="primary" onClick={() => navigate('/search')}>
                📖 Browse More Books
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/chat')}>
                🤖 Get AI Recommendations
              </Button>
              <Button variant="outline-info" onClick={() => window.location.reload()}>
                🔄 Refresh Bookings
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Return Confirmation Modal */}
      <Modal 
        show={showReturnModal} 
        onHide={() => setShowReturnModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>↩️ Return Book</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <div>
              <p>Are you sure you want to return this book?</p>
              <div className="bg-light p-3 rounded">
                <strong>{selectedBooking.book?.title}</strong>
                <div className="text-muted">by {selectedBooking.book?.author}</div>
                <div className="mt-2">
                  <small className="text-muted">
                    Booked on: {new Date(selectedBooking.bookingDate).toLocaleDateString()}
                  </small>
                </div>
              </div>
              <div className="mt-3">
                <small className="text-muted">
                  ℹ️ Once returned, you won't be able to access this book unless you book it again.
                </small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowReturnModal(false)}
            disabled={returningBook}
          >
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={confirmReturnBook}
            disabled={returningBook}
          >
            {returningBook ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Returning...
              </>
            ) : (
              '↩️ Confirm Return'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserBookings;
