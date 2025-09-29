import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col, Spinner, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'USER',
    adminKey: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const { register, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isLoggedIn()) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, loading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear admin key when switching to USER role
    if (name === 'role' && value === 'USER') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        adminKey: ''
      }));
      setErrors(prev => ({
        ...prev,
        adminKey: ''
      }));
    }

    // Clear success message when form is modified
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Email validation (optional but if provided should be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Admin key validation
    if (formData.role === 'ADMIN' && !formData.adminKey.trim()) {
      newErrors.adminKey = 'Admin key is required for admin registration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    // Prepare data for submission (remove empty fields)
    const submitData = {
      username: formData.username.trim(),
      password: formData.password,
      role: formData.role
    };

    if (formData.email.trim()) {
      submitData.email = formData.email.trim();
    }

    if (formData.fullName.trim()) {
      submitData.fullName = formData.fullName.trim();
    }

    if (formData.role === 'ADMIN') {
      submitData.adminKey = formData.adminKey.trim();
    }

    try {
      const result = await register(submitData);

      if (result.success) {
        setSuccessMessage('Registration successful! Please sign in with your credentials.');
        // Reset form
        setFormData({
          username: '',
          password: '',
          email: '',
          fullName: '',
          role: 'USER',
          adminKey: ''
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Handle specific error cases
        if (result.error.includes('already exists')) {
          setErrors({ username: 'Username already exists. Please choose a different one.' });
        } else if (result.error.includes('admin key')) {
          setErrors({ adminKey: 'Invalid admin key. Please contact the administrator.' });
        } else {
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading spinner while auth context is initializing
  if (loading) {
    return (
      <Container>
        <div className="loading-container">
          <Spinner animation="border" role="status" className="mx-auto">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} sm={8} md={6} lg={5} xl={4}>
          <div className="text-center mb-4">
            <h1 className="text-gradient">Smart Library</h1>
            <p className="text-muted">Create your account and start exploring our digital library.</p>
          </div>

          <Card className="shadow-lg">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Create Account</h2>

              {successMessage && (
                <Alert variant="success" className="text-center">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {successMessage}
                </Alert>
              )}

              {errors.general && (
                <Alert variant="danger" dismissible onClose={() => setErrors(prev => ({ ...prev, general: '' }))}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errors.general}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                    disabled={isSubmitting}
                    isInvalid={!!errors.username}
                    autoComplete="username"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      required
                      disabled={isSubmitting}
                      isInvalid={!!errors.password}
                      autoComplete="new-password"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Button>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com (optional)"
                    disabled={isSubmitting}
                    isInvalid={!!errors.email}
                    autoComplete="email"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your full name (optional)"
                    disabled={isSubmitting}
                    autoComplete="name"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Account Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="USER">📚 Library Member</option>
                    <option value="ADMIN">👑 Administrator</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {formData.role === 'ADMIN'
                      ? 'Administrative access requires a special registration key'
                      : 'Standard account with book browsing and borrowing privileges'
                    }
                  </Form.Text>
                </Form.Group>

                {formData.role === 'ADMIN' && (
                  <Form.Group className="mb-4">
                    <Form.Label>Admin Registration Key <span className="text-danger">*</span></Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showAdminKey ? 'text' : 'password'}
                        name="adminKey"
                        value={formData.adminKey}
                        onChange={handleChange}
                        placeholder="Enter admin registration key"
                        required
                        disabled={isSubmitting}
                        isInvalid={!!errors.adminKey}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowAdminKey(!showAdminKey)}
                        disabled={isSubmitting}
                      >
                        {showAdminKey ? '👁️' : '👁️‍🗨️'}
                      </Button>
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">
                      {errors.adminKey}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      🔐 Contact the system administrator for the registration key
                    </Form.Text>
                  </Form.Group>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <div className="text-center">
                  <p className="mb-0 text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="text-decoration-none">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <div className="text-center mt-4">
            <small className="text-muted">
              © 2025 Smart Library System. All rights reserved.
            </small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
