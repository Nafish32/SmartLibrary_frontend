import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const BookSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const recognitionRef = React.useRef(null);

  useEffect(() => {
    // Load all available books on component mount
    fetchAllBooks();
    
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
        // Automatically search after voice input
        setTimeout(() => {
          performSearch(transcript);
        }, 500);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setError('Voice recognition error. Please try again.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const fetchAllBooks = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await apiService.getAvailableBooks();
      if (result.success) {
        setBooks(result.data);
      } else {
        setError(result.error);
        setBooks([]);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Failed to load books. Please try again later.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setError('Failed to start voice recognition.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const performSearch = async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      fetchAllBooks();
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const result = await apiService.searchBooks(trimmedQuery);
      if (result.success) {
        setBooks(result.data);
        if (result.data.length === 0) {
          setError(`No books found for "${trimmedQuery}". Try different keywords.`);
        }
      } else {
        setError(result.error);
        setBooks([]);
      }
    } catch (error) {
      console.error('Error searching books:', error);
      setError('Failed to search books. Please try again later.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await performSearch(searchTerm);
  };

  const bookBook = async (bookId) => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await apiService.bookBook({ bookId });
      if (result.success) {
        setSuccessMessage('Book booked successfully! Check your bookings to track the status.');
        // Refresh the search results
        if (searchTerm.trim()) {
          handleSearch({ preventDefault: () => {} });
        } else {
          fetchAllBooks();
        }
        setSelectedBook(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error booking book:', error);
      setError('Failed to book the book. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setHasSearched(false);
    setError('');
    setSuccessMessage('');
    fetchAllBooks();
  };

  const filteredBooks = useMemo(() => {
    return books.sort((a, b) => b.quantity - a.quantity); // Available books first
  }, [books]);

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h1 className="text-gradient mb-3">Book Search</h1>
        <p className="text-muted">
          Discover and book from our extensive digital library collection
        </p>
      </div>

      {/* Search Bar */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup size="lg">
              <Form.Control
                type="text"
                placeholder="Search by title, author or genre. you can also use voice search!🎤"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
              
              {/* Voice Search Button */}
              {speechSupported && (
                <Button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={loading}
                  variant={isListening ? "danger" : "outline-secondary"}
                  title={isListening ? 'Stop voice recording' : 'Search by voice'}
                >
                  {isListening ? (
                    <div className="d-flex align-items-center">
                      <div className="recording-pulse me-1"></div>
                      🎙️
                    </div>
                  ) : (
                    '🎤'
                  )}
                </Button>
              )}
              
              <Button type="submit" disabled={loading} variant="primary">
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
                    Searching...
                  </>
                ) : (
                  <>
                    🔍 Search
                  </>
                )}
              </Button>
              {(searchTerm || hasSearched) && (
                <Button variant="outline-secondary" onClick={clearSearch} disabled={loading}>
                  ✕ Clear
                </Button>
              )}
            </InputGroup>
          </Form>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <Form.Text className="text-muted">
              💡 Supports both English and Bangla. Leave empty to browse all available books. 🎤 Try voice search!
            </Form.Text>
            {isListening && (
              <Badge bg="danger" className="pulse">
                🎙️ Listening...
              </Badge>
            )}
          </div>
        </Card.Body>
      </Card>

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

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <Spinner animation="border" role="status" className="mx-auto">
            <span className="visually-hidden">Loading books...</span>
          </Spinner>
          <p className="loading-text">Loading books...</p>
        </div>
      ) : (
        <>
          {/* Results Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <strong>{filteredBooks.length}</strong> book(s) found
              {hasSearched && searchTerm && (
                <span className="text-muted"> for "{searchTerm}"</span>
              )}
            </div>
            <div className="text-muted">
              <small>Sorted by availability</small>
            </div>
          </div>

          {/* Books Grid */}
          <Row className="g-4">
            {filteredBooks.map((book) => (
              <Col xs={12} sm={6} lg={4} xl={3} key={book.id}>
                <Card className="h-100 book-card fade-in">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="flex-grow-1 me-2">
                        {book.title}
                      </Card.Title>
                      <Badge 
                        bg={book.quantity > 0 ? 'success' : 'secondary'}
                        className="ms-2"
                      >
                        {book.quantity > 0 ? `${book.quantity} available` : 'Out of stock'}
                      </Badge>
                    </div>
                    
                    <Card.Text className="flex-grow-1">
                      <div className="mb-2">
                        <strong className="text-primary">📝 Author:</strong> {book.author}
                      </div>
                      <div className="mb-2">
                        <strong className="text-primary">📅 Published:</strong> {book.publishedYear}
                      </div>
                      {book.genre && (
                        <div className="mb-2">
                          <strong className="text-primary">🏷️ Genre:</strong> {book.genre}
                        </div>
                      )}
                      {book.isbn && (
                        <div className="mb-2">
                          <strong className="text-primary">📚 ISBN:</strong> {book.isbn}
                        </div>
                      )}
                      {book.description && (
                        <div className="mt-3">
                          <strong className="text-primary">📖 Description:</strong>
                          <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.9rem' }}>
                            {book.description.length > 120
                              ? book.description.substring(0, 120) + '...'
                              : book.description
                            }
                          </p>
                        </div>
                      )}
                    </Card.Text>
                    
                    <div className="mt-auto pt-3">
                      {isLoggedIn() ? (
                        <div className="d-grid gap-2">
                          <Button
                            variant={book.quantity > 0 ? "primary" : "secondary"}
                            onClick={() => setSelectedBook(book)}
                            disabled={book.quantity === 0 || bookingLoading}
                            size="sm"
                          >
                            {book.quantity > 0 ? '📖 Book Now' : '❌ Not Available'}
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => setSelectedBook(book)}
                          >
                            👁️ View Details
                          </Button>
                        </div>
                      ) : (
                        <div className="d-grid gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate('/login')}
                          >
                            🔐 Login to Book
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => setSelectedBook(book)}
                          >
                            👁️ View Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Empty States */}
          {filteredBooks.length === 0 && hasSearched && !loading && (
            <Alert variant="info" className="text-center py-5">
              <h4>📚 No books found</h4>
              <p>No books match your search criteria for "{searchTerm}".</p>
              <p className="text-muted mb-3">Try using different keywords or browse all available books.</p>
              <Button variant="primary" onClick={clearSearch}>
                📋 Show All Available Books
              </Button>
            </Alert>
          )}

          {filteredBooks.length === 0 && !hasSearched && !loading && (
            <Alert variant="warning" className="text-center py-5">
              <h4>📚 No books available</h4>
              <p>Our library collection is currently empty or being updated.</p>
              <p className="text-muted">Please check back later or contact the library administrator.</p>
            </Alert>
          )}
        </>
      )}

      {/* Book Details Modal */}
      <Modal 
        show={selectedBook !== null} 
        onHide={() => setSelectedBook(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedBook?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBook && (
            <Row>
              <Col md={8}>
                <div className="mb-3">
                  <h6 className="text-primary">📝 Author</h6>
                  <p>{selectedBook.author}</p>
                </div>
                
                <div className="mb-3">
                  <h6 className="text-primary">📅 Publication Year</h6>
                  <p>{selectedBook.publishedYear}</p>
                </div>
                
                {selectedBook.genre && (
                  <div className="mb-3">
                    <h6 className="text-primary">🏷️ Genre</h6>
                    <p>{selectedBook.genre}</p>
                  </div>
                )}
                
                {selectedBook.isbn && (
                  <div className="mb-3">
                    <h6 className="text-primary">📚 ISBN</h6>
                    <p>{selectedBook.isbn}</p>
                  </div>
                )}
                
                {selectedBook.description && (
                  <div className="mb-3">
                    <h6 className="text-primary">📖 Description</h6>
                    <p>{selectedBook.description}</p>
                  </div>
                )}
              </Col>
              <Col md={4}>
                <div className="text-center">
                  <Badge 
                    bg={selectedBook.quantity > 0 ? 'success' : 'secondary'}
                    className="mb-3 fs-6"
                  >
                    {selectedBook.quantity > 0 
                      ? `${selectedBook.quantity} copies available` 
                      : 'Currently unavailable'
                    }
                  </Badge>
                  
                  {isLoggedIn() ? (
                    <div className="d-grid">
                      <Button
                        variant={selectedBook.quantity > 0 ? "primary" : "secondary"}
                        onClick={() => bookBook(selectedBook.id)}
                        disabled={selectedBook.quantity === 0 || bookingLoading}
                        size="lg"
                      >
                        {bookingLoading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Booking...
                          </>
                        ) : selectedBook.quantity > 0 ? (
                          '📖 Book Now'
                        ) : (
                          '❌ Not Available'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="d-grid">
                      <Button
                        variant="outline-primary"
                        onClick={() => navigate('/login')}
                        size="lg"
                      >
                        🔐 Login to Book
                      </Button>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default BookSearch;
