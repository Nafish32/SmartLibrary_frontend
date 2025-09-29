import React, { useState } from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button, Badge, Dropdown } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout, isAdmin, isUser, isLoggedIn, getUserDisplayName } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    setExpanded(false);
  };

  const handleNavClick = () => {
    setExpanded(false);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const getNavLinkClass = (path) => {
    return `nav-link ${isActiveLink(path) ? 'active' : ''}`;
  };

  return (
    <BootstrapNavbar 
      className="custom-navbar shadow-sm" 
      variant="dark" 
      expand="lg" 
      expanded={expanded}
    >
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="brand-logo">
          <span className="brand-icon">📚</span>
          <span className="brand-text">Smart Library</span>
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle 
          aria-controls="basic-navbar-nav" 
          onClick={() => setExpanded(!expanded)}
        />
        
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={getNavLinkClass('/')}
              onClick={handleNavClick}
            >
              <span className="nav-icon">🏠</span>
              Home
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/search" 
              className={getNavLinkClass('/search')}
              onClick={handleNavClick}
            >
              <span className="nav-icon">🔍</span>
              Browse Books
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/chat" 
              className={getNavLinkClass('/chat')}
              onClick={handleNavClick}
            >
              <span className="nav-icon">🤖</span>
              AI Assistant
            </Nav.Link>

            {isLoggedIn() && (
              <Nav.Link 
                as={Link} 
                to="/bookings" 
                className={getNavLinkClass('/bookings')}
                onClick={handleNavClick}
              >
                <span className="nav-icon">📖</span>
                My Books
              </Nav.Link>
            )}

            {isAdmin() && (
              <Nav.Link 
                as={Link} 
                to="/admin" 
                className={getNavLinkClass('/admin')}
                onClick={handleNavClick}
              >
                <span className="nav-icon">👑</span>
                Admin Panel
                <Badge bg="warning" text="dark" className="ms-2">
                  Admin
                </Badge>
              </Nav.Link>
            )}
          </Nav>

          <Nav>
            {isLoggedIn() ? (
              <Dropdown align="end">
                <Dropdown.Toggle 
                  as="div" 
                  className="user-menu-toggle d-flex align-items-center"
                >
                  <div className="user-avatar">
                    {isAdmin() ? '👑' : '👤'}
                  </div>
                  <div className="user-info d-none d-md-block ms-2">
                    <div className="user-name">{getUserDisplayName()}</div>
                    <div className="user-role">
                      {isAdmin() ? 'Administrator' : 'Member'}
                    </div>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu className="user-dropdown-menu">
                  <Dropdown.Header>
                    <div className="text-center">
                      <div className="user-avatar-large mb-2">
                        {isAdmin() ? '👑' : '👤'}
                      </div>
                      <strong>{getUserDisplayName()}</strong>
                      <div className="text-muted small">
                        {isAdmin() ? 'Administrator' : 'Library Member'}
                      </div>
                    </div>
                  </Dropdown.Header>
                  
                  <Dropdown.Divider />
                  
                  {isUser() && (
                    <Dropdown.Item as={Link} to="/bookings" onClick={handleNavClick}>
                      <span className="dropdown-icon">📖</span>
                      My Bookings
                    </Dropdown.Item>
                  )}
                  
                  <Dropdown.Item as={Link} to="/search" onClick={handleNavClick}>
                    <span className="dropdown-icon">🔍</span>
                    Browse Books
                  </Dropdown.Item>
                  
                  <Dropdown.Item as={Link} to="/chat" onClick={handleNavClick}>
                    <span className="dropdown-icon">🤖</span>
                    AI Assistant
                  </Dropdown.Item>
                  
                  {isAdmin() && (
                    <>
                      <Dropdown.Divider />
                      <Dropdown.Item as={Link} to="/admin" onClick={handleNavClick}>
                        <span className="dropdown-icon">👑</span>
                        Admin Panel
                      </Dropdown.Item>
                    </>
                  )}
                  
                  <Dropdown.Divider />
                  
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    <span className="dropdown-icon">🚪</span>
                    Sign Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Button 
                  as={Link} 
                  to="/login" 
                  variant="outline-light" 
                  size="sm"
                  onClick={handleNavClick}
                >
                  🔐 Sign In
                </Button>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="primary" 
                  size="sm"
                  onClick={handleNavClick}
                >
                  ➕ Sign Up
                </Button>
              </div>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
