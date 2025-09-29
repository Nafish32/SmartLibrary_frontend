import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const Dashboard = () => {
  const { isLoggedIn, isAdmin, currentUser } = useAuth();
  const [availableBooks, setAvailableBooks] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    totalUsers: 0,
    activeBookings: 0,
    userActiveBookings: 0,
    overdueBookings: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load books
      const booksResult = await apiService.getAvailableBooks();
      if (booksResult.success) {
        setAvailableBooks(booksResult.data.slice(0, 6));
      }
      
      // Load user bookings if logged in
      if (isLoggedIn()) {
        const bookingsResult = await apiService.getUserBookings();
        if (bookingsResult.success) {
          const bookingsData = bookingsResult.data;
          setUserBookings(bookingsData);
          
          // Calculate user stats
          const activeBookings = bookingsData.filter(b => b.status === 'ACTIVE').length;
          const overdueBookings = bookingsData.filter(b => {
            const dueDate = new Date(b.dueDate);
            return b.status === 'ACTIVE' && dueDate < new Date();
          }).length;
          
          setStats(prev => ({
            ...prev,
            userActiveBookings: activeBookings,
            overdueBookings: overdueBookings
          }));
        }
      }
      
      // Load admin stats if admin
      if (isAdmin()) {
        try {
          const allBooksResult = await apiService.getAllBooks();
          const allUsersResult = await apiService.getAllUsers();
          const allBookingsResult = await apiService.getAllBookings();
          
          if (allBooksResult.success && allUsersResult.success && allBookingsResult.success) {
            const allBooksData = allBooksResult.data || [];
            const allUsersData = allUsersResult.data || [];
            const allBookingsData = allBookingsResult.data || [];
            
            const totalBookQuantity = allBooksData.reduce((sum, book) => sum + (book.quantity || 0), 0);
            const availableBooksCount = allBooksData.filter(book => (book.quantity || 0) > 0).length;
            const activeBookingsCount = allBookingsData.filter(b => b.status === 'ACTIVE').length;
            
            setStats(prev => ({
              ...prev,
              totalBooks: totalBookQuantity,
              availableBooks: availableBooksCount,
              totalUsers: allUsersData.length,
              activeBookings: activeBookingsCount
            }));
            
            // Generate recent activity
            const recentBookings = allBookingsData
              .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
              .slice(0, 5)
              .map(booking => ({
                id: booking.id,
                type: 'booking',
                message: `${booking.user?.firstName || 'User'} ${booking.user?.lastName || ''} booked "${booking.book?.title || 'Unknown Book'}"`,
                timestamp: booking.bookingDate,
                status: booking.status
              }));
            
            setRecentActivity(recentBookings);
          } else {
            console.error('Failed to load admin data:', {
              books: allBooksResult.error,
              users: allUsersResult.error,
              bookings: allBookingsResult.error
            });
            const errorMessages = [];
            if (!allBooksResult.success) errorMessages.push(`Books: ${allBooksResult.error}`);
            if (!allUsersResult.success) errorMessages.push(`Users: ${allUsersResult.error}`);
            if (!allBookingsResult.success) errorMessages.push(`Bookings: ${allBookingsResult.error}`);
            setError(`Failed to load admin data: ${errorMessages.join(', ')}`);
            return; // Exit early to prevent clearing error
          }
        } catch (adminError) {
          console.error('Error loading admin data:', adminError);
          setError('Error loading admin data. Please try again.');
          return; // Exit early to prevent clearing error
        }
      }
      
      // Only clear error if we get here without issues
      setError('');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const bookBook = async (bookId) => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    try {
      const result = await apiService.bookBook(bookId);
      
      if (result.success) {
        // Show success message
        const successEvent = new CustomEvent('showAlert', {
          detail: { message: 'Book booked successfully!', type: 'success' }
        });
        window.dispatchEvent(successEvent);
        
        // Refresh data
        loadDashboardData();
      } else {
        const errorEvent = new CustomEvent('showAlert', {
          detail: { message: result.error || 'Error booking book', type: 'danger' }
        });
        window.dispatchEvent(errorEvent);
      }
    } catch (error) {
      const errorEvent = new CustomEvent('showAlert', {
        detail: { message: error.message || 'Error booking book', type: 'danger' }
      });
      window.dispatchEvent(errorEvent);
    }
  };

  if (!isLoggedIn()) {
    return (
      <Container className="dashboard-container">
        <div className="hero-section text-center">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to Smart Library</h1>
            <p className="hero-subtitle">
              Discover books with our AI-powered search and chat system.
              Search in both English and Bangla!
            </p>
            <div className="hero-actions">
              <Button
                className="hero-btn primary-btn me-3"
                onClick={() => navigate('/login')}
              >
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Login to Start
              </Button>
              <Button
                className="hero-btn secondary-btn"
                onClick={() => navigate('/register')}
              >
                <i className="bi bi-person-plus me-2"></i>
                Create Account
              </Button>
            </div>
          </div>
        </div>
        
        <div className="features-section">
          <Row>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon">
                    <i className="bi bi-search"></i>
                  </div>
                  <Card.Title>Smart Search</Card.Title>
                  <Card.Text>
                    Find books quickly with our advanced search system supporting multiple languages.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon">
                    <i className="bi bi-robot"></i>
                  </div>
                  <Card.Title>AI Assistant</Card.Title>
                  <Card.Text>
                    Get personalized book recommendations from our AI chat assistant.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon">
                    <i className="bi bi-calendar-check"></i>
                  </div>
                  <Card.Title>Easy Booking</Card.Title>
                  <Card.Text>
                    Book and manage your library reservations with just a few clicks.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </Container>
    );
  }

  return (
    <Container className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          Welcome back, {currentUser?.username || 'User'}!
          {isAdmin() && <Badge bg="warning" className="ms-2">Admin</Badge>}
        </h2>
        <p className="dashboard-subtitle">
          {isAdmin() ? 'Manage your library system' : 'Discover and manage your books'}
        </p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" className="loading-spinner" />
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <Row className="stats-section mb-4">
            {isAdmin() ? (
              <>
                <Col lg={3} md={6} className="mb-3">
                  <Card className="stat-card">
                    <Card.Body>
                      <div className="stat-content">
                        <div className="stat-icon admin">
                          <i className="bi bi-book"></i>
                        </div>
                        <div className="stat-info">
                          <h4 className="stat-number">{stats.totalBooks}</h4>
                          <p className="stat-label">Total Books</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <Card className="stat-card">
                    <Card.Body>
                      <div className="stat-content">
                        <div className="stat-icon success">
                          <i className="bi bi-check-circle"></i>
                        </div>
                        <div className="stat-info">
                          <h4 className="stat-number">{stats.availableBooks}</h4>
                          <p className="stat-label">Available Books</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <Card className="stat-card">
                    <Card.Body>
                      <div className="stat-content">
                        <div className="stat-icon info">
                          <i className="bi bi-people"></i>
                        </div>
                        <div className="stat-info">
                          <h4 className="stat-number">{stats.totalUsers}</h4>
                          <p className="stat-label">Total Users</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <Card className="stat-card">
                    <Card.Body>
                      <div className="stat-content">
                        <div className="stat-icon warning">
                          <i className="bi bi-bookmark"></i>
                        </div>
                        <div className="stat-info">
                          <h4 className="stat-number">{stats.activeBookings}</h4>
                          <p className="stat-label">Active Bookings</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </>
            ) : (
              <>
                <Col lg={4} md={6} className="mb-3">
                  <Card className="stat-card">
                    <Card.Body>
                      <div className="stat-content">
                        <div className="stat-icon primary">
                          <i className="bi bi-bookmark-check"></i>
                        </div>
                        <div className="stat-info">
                          <h4 className="stat-number">{stats.userActiveBookings}</h4>
                          <p className="stat-label">My Active Books</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={4} md={6} className="mb-3">
                  <Card className="stat-card">
                    <Card.Body>
                      <div className="stat-content">
                        <div className="stat-icon success">
                          <i className="bi bi-check-circle"></i>
                        </div>
                        <div className="stat-info">
                          <h4 className="stat-number">{availableBooks.length}</h4>
                          <p className="stat-label">Books Available</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={4} md={6} className="mb-3">
                  <Card className="stat-card">
                    <Card.Body>
                      <div className="stat-content">
                        <div className={`stat-icon ${stats.overdueBookings > 0 ? 'danger' : 'success'}`}>
                          <i className={`bi ${stats.overdueBookings > 0 ? 'bi-exclamation-triangle' : 'bi-check-all'}`}></i>
                        </div>
                        <div className="stat-info">
                          <h4 className="stat-number">{stats.overdueBookings}</h4>
                          <p className="stat-label">Overdue Books</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </>
            )}
          </Row>

          {/* Quick Actions */}
          <Row className="mb-4">
            <Col>
              <Card className="quick-actions-card">
                <Card.Header>
                  <h5 className="mb-0">
                    <i className="bi bi-lightning me-2"></i>
                    Quick Actions
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="quick-actions">
                    <Button
                      className="action-btn search-btn"
                      onClick={() => navigate('/search')}
                    >
                      <i className="bi bi-search"></i>
                      Search Books
                    </Button>
                    <Button
                      className="action-btn chat-btn"
                      onClick={() => navigate('/chat')}
                    >
                      <i className="bi bi-robot"></i>
                      AI Assistant
                    </Button>
                    <Button
                      className="action-btn bookings-btn"
                      onClick={() => navigate('/bookings')}
                    >
                      <i className="bi bi-bookmark"></i>
                      My Bookings
                    </Button>
                    {isAdmin() && (
                      <Button
                        className="action-btn admin-btn"
                        onClick={() => navigate('/admin')}
                      >
                        <i className="bi bi-gear"></i>
                        Admin Panel
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Content based on role */}
          <Row>
            {isAdmin() && recentActivity.length > 0 && (
              <Col lg={6} className="mb-4">
                <Card className="recent-activity-card h-100">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-clock-history me-2"></i>
                      Recent Activity
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="activity-list">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="activity-item">
                          <div className="activity-content">
                            <p className="activity-message">{activity.message}</p>
                            <small className="activity-time">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </small>
                          </div>
                          <Badge 
                            bg={activity.status === 'ACTIVE' ? 'success' : 'secondary'}
                            className="activity-badge"
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}

            <Col lg={isAdmin() && recentActivity.length > 0 ? 6 : 12}>
              <Card className="featured-books-card h-100">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi bi-star me-2"></i>
                      Featured Books
                    </h5>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate('/search')}
                    >
                      View All
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  {availableBooks.length > 0 ? (
                    <div className="featured-books-grid">
                      {availableBooks.map((book) => (
                        <div key={book.id} className="featured-book-item">
                          <div className="book-info">
                            <h6 className="book-title">{book.title}</h6>
                            <p className="book-author">by {book.author}</p>
                            <div className="book-meta">
                              <Badge 
                                bg={book.quantity > 0 ? 'success' : 'secondary'}
                                className="availability-badge"
                              >
                                {book.quantity > 0 ? `${book.quantity} available` : 'Unavailable'}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant={book.quantity > 0 ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => bookBook(book.id)}
                            disabled={book.quantity === 0}
                          >
                            {book.quantity > 0 ? 'Book Now' : 'Unavailable'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="bi bi-book display-4 text-muted"></i>
                      <p className="mt-3 text-muted">No books available at the moment</p>
                      <Button
                        variant="outline-primary"
                        onClick={() => navigate('/search')}
                      >
                        Browse Library
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
