import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Tabs, Tab, Spinner, Badge, InputGroup } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const AdminPanel = () => {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    authorBengali: '',
    publishedYear: '',
    quantity: '',
    isbn: '',
    genre: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('books');
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin()) {
        navigate('/');
        return;
      }
      fetchData();
    }
  }, [isAdmin, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [booksResult, usersResult, bookingsResult] = await Promise.all([
        apiService.getAllBooks(),
        apiService.getAllUsers(),
        apiService.getAllBookings()
      ]);

      if (booksResult.success) setBooks(booksResult.data);
      if (usersResult.success) setUsers(usersResult.data);
      if (bookingsResult.success) setBookings(bookingsResult.data);

      // Check for any errors
      if (!booksResult.success || !usersResult.success || !bookingsResult.success) {
        setError('Some data could not be loaded. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBookForm()) return;

    setSubmitting(true);
    setError('');
    
    try {
      const bookData = {
        ...bookForm,
        publishedYear: parseInt(bookForm.publishedYear),
        quantity: parseInt(bookForm.quantity)
      };

      let result;
      if (editingBook) {
        result = await apiService.updateBook(editingBook.id, bookData);
      } else {
        result = await apiService.createBook(bookData);
      }

      if (result.success) {
        setShowBookModal(false);
        setEditingBook(null);
        resetBookForm();
        fetchData();
        setSuccessMessage(`Book ${editingBook ? 'updated' : 'created'} successfully!`);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error saving book:', error);
      setError('Failed to save book. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const validateBookForm = () => {
    if (!bookForm.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!bookForm.author.trim()) {
      setError('Author is required');
      return false;
    }
    if (!bookForm.publishedYear || bookForm.publishedYear < 1000) {
      setError('Valid published year is required');
      return false;
    }
    if (!bookForm.quantity || bookForm.quantity < 0) {
      setError('Valid quantity is required');
      return false;
    }
    return true;
  };

  const deleteBook = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      try {
        const result = await apiService.deleteBook(id);
        if (result.success) {
          fetchData();
          setSuccessMessage('Book deleted successfully!');
        } else {
          setError(result.error);
        }
      } catch (error) {
        console.error('Error deleting book:', error);
        setError('Failed to delete book. Please try again.');
      }
    }
  };

  const deleteUser = async (id, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      try {
        const result = await apiService.deleteUser(id);
        if (result.success) {
          fetchData();
          setSuccessMessage('User deleted successfully!');
        } else {
          setError(result.error);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  const returnBook = async (bookingId) => {
    try {
      const result = await apiService.adminReturnBook(bookingId);
      if (result.success) {
        fetchData();
        setSuccessMessage('Book return processed successfully!');
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error returning book:', error);
      setError('Failed to process book return. Please try again.');
    }
  };

  const updateBookQuantity = async (bookId, newQuantity) => {
    if (newQuantity < 0) return;

    try {
      const result = await apiService.updateBookQuantity(bookId, newQuantity);
      if (result.success) {
        // Update local state immediately for better UX
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.id === bookId ? { ...book, quantity: newQuantity } : book
          )
        );
        setSuccessMessage('Book quantity updated successfully!');
      } else {
        setError(result.error);
        // Refresh data to revert UI changes
        fetchData();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity. Please try again.');
      fetchData();
    }
  };

  const resetBookForm = () => {
    setBookForm({
      title: '',
      author: '',
      authorBengali: '',
      publishedYear: '',
      quantity: '',
      isbn: '',
      genre: '',
      description: ''
    });
  };

  const openBookModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setBookForm({
        title: book.title || '',
        author: book.author || '',
        authorBengali: book.authorBengali || '',
        publishedYear: book.publishedYear?.toString() || '',
        quantity: book.quantity?.toString() || '',
        isbn: book.isbn || '',
        genre: book.genre || '',
        description: book.description || ''
      });
    } else {
      setEditingBook(null);
      resetBookForm();
    }
    setError('');
    setShowBookModal(true);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'RETURNED': return 'primary';
      case 'OVERDUE': return 'danger';
      default: return 'secondary';
    }
  };

  if (authLoading || (loading && books.length === 0)) {
    return (
      <Container>
        <div className="loading-container">
          <Spinner animation="border" role="status" className="mx-auto">
            <span className="visually-hidden">Loading admin panel...</span>
          </Spinner>
          <p className="loading-text">Loading admin panel...</p>
        </div>
      </Container>
    );
  }

  if (!isAdmin()) {
    return (
      <Container>
        <Alert variant="danger" className="text-center">
          <h4>🚫 Access Denied</h4>
          <p>Admin privileges are required to access this page.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="text-center mb-5">
        <h1 className="text-gradient mb-3">👑 Admin Panel</h1>
        <p className="text-muted">
          Manage books, users, and bookings in your smart library system
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

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="dashboard-card text-center">
            <Card.Body>
              <h5 className="display-6">📚</h5>
              <h3>{books.length}</h3>
              <p className="mb-0">Total Books</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-card text-center">
            <Card.Body>
              <h5 className="display-6">👥</h5>
              <h3>{users.length}</h3>
              <p className="mb-0">Registered Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-card text-center">
            <Card.Body>
              <h5 className="display-6">📖</h5>
              <h3>{bookings.filter(b => b.status === 'ACTIVE').length}</h3>
              <p className="mb-0">Active Bookings</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Management Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onSelect={(k) => setActiveTab(k)} 
        className="mb-4"
      >
        <Tab eventKey="books" title={
          <span>📚 Books ({books.length})</span>
        }>
          <Card className="admin-section">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📚 Book Management</h5>
              <Button variant="primary" onClick={() => openBookModal()}>
                ➕ Add New Book
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Year</th>
                      <th>Quantity</th>
                      <th>Genre</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr key={book.id}>
                        <td>
                          <strong>{book.title}</strong>
                          {book.isbn && (
                            <div className="text-muted small">ISBN: {book.isbn}</div>
                          )}
                        </td>
                        <td>{book.author}</td>
                        <td>{book.publishedYear}</td>
                        <td>
                          <InputGroup size="sm" style={{ width: '100px' }}>
                            <Form.Control
                              type="number"
                              value={book.quantity}
                              onChange={(e) => updateBookQuantity(book.id, parseInt(e.target.value) || 0)}
                              min="0"
                            />
                          </InputGroup>
                        </td>
                        <td>
                          <Badge bg="secondary">
                            {book.genre || 'Unspecified'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openBookModal(book)}
                            >
                              ✏️ Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => deleteBook(book.id, book.title)}
                            >
                              🗑️ Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                {books.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No books found. Add your first book to get started!</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="users" title={
          <span>👥 Users ({users.length})</span>
        }>
          <Card className="admin-section">
            <Card.Header>
              <h5 className="mb-0">👥 User Management</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.userName}</strong>
                        </td>
                        <td>{user.fullName || '-'}</td>
                        <td>{user.email || '-'}</td>
                        <td>
                          {user.roles?.map(role => (
                            <Badge 
                              key={role} 
                              bg={role === 'ROLE_ADMIN' ? 'warning' : 'info'}
                              className="me-1"
                            >
                              {role.replace('ROLE_', '')}
                            </Badge>
                          ))}
                        </td>
                        <td>
                          {user.createdAt 
                            ? new Date(user.createdAt).toLocaleDateString()
                            : '-'
                          }
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => deleteUser(user.id, user.userName)}
                          >
                            🗑️ Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                {users.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No users found.</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="bookings" title={
          <span>📖 Bookings ({bookings.length})</span>
        }>
          <Card className="admin-section">
            <Card.Header>
              <h5 className="mb-0">📖 Booking Management</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Book</th>
                      <th>Booking Date</th>
                      <th>Return Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <strong>{booking.user?.userName || 'Unknown'}</strong>
                        </td>
                        <td>
                          <div>
                            <strong>{booking.book?.title || 'Unknown Book'}</strong>
                            <div className="text-muted small">
                              by {booking.book?.author || 'Unknown Author'}
                            </div>
                          </div>
                        </td>
                        <td>
                          {booking.bookingDate 
                            ? new Date(booking.bookingDate).toLocaleDateString()
                            : 'N/A'
                          }
                        </td>
                        <td>
                          {booking.returnDate 
                            ? new Date(booking.returnDate).toLocaleDateString()
                            : '-'
                          }
                        </td>
                        <td>
                          <Badge bg={getStatusVariant(booking.status)} className="status-badge">
                            {booking.status}
                          </Badge>
                        </td>
                        <td>
                          {booking.status === 'ACTIVE' && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => returnBook(booking.id)}
                            >
                              ↩️ Process Return
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                {bookings.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No bookings found.</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Book Modal */}
      <Modal 
        show={showBookModal} 
        onHide={() => setShowBookModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingBook ? '✏️ Edit Book' : '➕ Add New Book'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleBookSubmit} noValidate>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                    required
                    disabled={submitting}
                    placeholder="Enter book title"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Author <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
                    required
                    disabled={submitting}
                    placeholder="Enter author name"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Author (Bengali)</Form.Label>
                  <Form.Control
                    type="text"
                    value={bookForm.authorBengali}
                    onChange={(e) => setBookForm({...bookForm, authorBengali: e.target.value})}
                    disabled={submitting}
                    placeholder="লেখকের নাম বাংলায় (ঐচ্ছিক)"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Published Year <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    value={bookForm.publishedYear}
                    onChange={(e) => setBookForm({...bookForm, publishedYear: e.target.value})}
                    min="1000"
                    max={new Date().getFullYear()}
                    required
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    value={bookForm.quantity}
                    onChange={(e) => setBookForm({...bookForm, quantity: e.target.value})}
                    min="0"
                    required
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Genre</Form.Label>
                  <Form.Control
                    type="text"
                    value={bookForm.genre}
                    onChange={(e) => setBookForm({...bookForm, genre: e.target.value})}
                    disabled={submitting}
                    placeholder="e.g., Fiction, Science"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>ISBN</Form.Label>
              <Form.Control
                type="text"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                disabled={submitting}
                placeholder="Enter ISBN (optional)"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={bookForm.description}
                onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                disabled={submitting}
                placeholder="Enter book description (optional)"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowBookModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  {editingBook ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingBook ? '✅ Update Book' : '➕ Add Book'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminPanel;
