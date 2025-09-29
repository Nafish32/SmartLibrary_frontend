import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Dropdown, DropdownButton } from 'react-bootstrap';
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaLanguage } from 'react-icons/fa';
import apiService from '../services/api';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('bn+en');
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);

  // Language options for the dropdown
  const languageOptions = [
    { code: 'bn+en', label: 'বাংলা + English (Mixed)', flag: '🇧🇩🇺🇸' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
    { code: 'en', label: 'English', flag: '🇺🇸' }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setError('');
      };
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('Speech recognition error: ' + event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Update speech recognition language
  useEffect(() => {
    if (recognition) {
      switch (selectedLanguage) {
        case 'bn':
          recognition.lang = 'bn-BD';
          break;
        case 'en':
          recognition.lang = 'en-US';
          break;
        case 'bn+en':
        default:
          recognition.lang = 'bn-BD';
          break;
      }
    }
  }, [selectedLanguage, recognition]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSpeechRecognition = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const userMessage = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    console.log('Sending message:', inputMessage, 'in language:', selectedLanguage);

    try {
      const response = await apiService.sendChatMessage(inputMessage, selectedLanguage);
      
      if (response.success) {
        const aiMessage = {
          text: response.data.response,
          isUser: false,
          timestamp: new Date(),
          language: selectedLanguage,
          books: response.data.books || null,
          responseType: response.data.responseType || 'text'
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        console.error('API returned error:', response.error);
        setError(`Failed to get response: ${response.error.message || response.error || 'Please try again.'}`);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      console.error('Error details:', err.response?.data);
      setError(`Failed to send message: ${err.response?.data?.message || err.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageLabel = (code) => {
    const option = languageOptions.find(opt => opt.code === code);
    return option ? option.label : code;
  };

  const getGreetingText = () => {
    switch (selectedLanguage) {
      case 'bn':
        return 'আমি আপনার লাইব্রেরি সহায়ক। বই খুঁজতে আমাকে জিজ্ঞাসা করুন!';
      case 'en':
        return 'I am your library assistant. Ask me to find books!';
      case 'bn+en':
      default:
        return 'আমি আপনার library assistant। বই খুঁজতে আমাকে জিজ্ঞাসা করুন!';
    }
  };

  const getPlaceholderText = () => {
    switch (selectedLanguage) {
      case 'bn':
        return 'বই খুঁজতে এখানে টাইপ করুন... যেমন: "১৯৯০ থেকে ২০০০ সালের মধ্যে প্রকাশিত রোমান্স বই" বা "জুমপা লাহিড়ীর বই"';
      case 'en':
        return 'Type here to search for books... e.g., "romance books published between 1990-2000" or "books by writer name"';
      case 'bn+en':
      default:
        return 'বই খুঁজতে এখানে লিখুন... e.g., "science fiction books after 2010" বা "mystery বই"';
    }
  };

  const getWelcomeMessage = () => {
    switch (selectedLanguage) {
      case 'bn':
        return 'আমি একটি উন্নত AI বই খোঁজার সহায়ক। আমি বইয়ের নাম, লেখক, প্রকাশের বছর, ধরন এবং বিষয়বস্তু অনুযায়ী বই খুঁজে দিতে পারি।';
      case 'en':
        return 'I am an advanced AI book search assistant. I can find books by title, author, publication year, genre, and topic using intelligent keyword extraction.';
      case 'bn+en':
      default:
        return 'আমি একটি advanced AI book search assistant। আমি intelligent keyword extraction ব্যবহার করে বই খুঁজে দিতে পারি।';
    }
  };

  const getExampleQueries = () => {
    switch (selectedLanguage) {
      case 'bn':
        return [
          "২০১০ সালের পরে প্রকাশিত বিজ্ঞান কল্পকাহিনী বই",
          "হুমায়ূন আহমেদের রহস্য উপন্যাস",
          "১৯৯০ থেকে ২০০০ সালের মধ্যে প্রকাশিত রোমান্স বই",
          "জীবনী ধরনের বই"
        ];
      case 'en':
        return [
          "Science fiction books published after 2010",
          "Mystery novels by Agatha Christie",
          "Romance books between 1990-2000",
          "Biography books"
        ];
      case 'bn+en':
      default:
        return [
          "Science fiction books published after ২০১০",
          "mystery novels",
          "Romance books between ১৯৯০-২০০০",
          "Self-help বই"
        ];
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="container mt-4">
      <Card className="shadow-lg" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <FaLanguage className="me-2" />
            <h5 className="mb-0">AI Book Search Assistant</h5>
          </div>
          <DropdownButton
            variant="outline-light"
            size="sm"
            title={
              <span>
                {languageOptions.find(opt => opt.code === selectedLanguage)?.flag} {' '}
                {selectedLanguage.toUpperCase()}
              </span>
            }
            onSelect={(eventKey) => setSelectedLanguage(eventKey)}
          >
            {languageOptions.map((option) => (
              <Dropdown.Item 
                key={option.code} 
                eventKey={option.code}
                active={selectedLanguage === option.code}
              >
                {option.flag} {option.label}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </Card.Header>

        <Card.Body style={{ flex: 1, overflowY: 'auto', maxHeight: '50vh' }}>
          {messages.length === 0 && (
            <div className="text-center text-muted py-4">
              <FaLanguage size={48} className="mb-3 text-primary" />
              <h5 className="mb-3">{getGreetingText()}</h5>
              <p className="mb-4">{getWelcomeMessage()}</p>

              <div className="text-start">
                <h6 className="mb-2">
                  {selectedLanguage === 'bn' && 'উদাহরণ অনুসন্ধান:'}
                  {selectedLanguage === 'en' && 'Example searches:'}
                  {selectedLanguage === 'bn+en' && 'Example searches:'}
                </h6>
                <ul className="list-unstyled small text-muted">
                  {getExampleQueries().map((query, index) => (
                    <li key={index} className="mb-1">
                      <span className="badge bg-light text-dark me-2">•</span>
                      "{query}"
                    </li>
                  ))}
                </ul>
              </div>

              <small className="text-muted">
                {selectedLanguage === 'bn' && 'স্মার্ট কীওয়ার্ড নিষ্কাশন দিয়ে চালিত'}
                {selectedLanguage === 'en' && 'Powered by intelligent keyword extraction'}
                {selectedLanguage === 'bn+en' && 'Intelligent keyword extraction দিয়ে powered'}
              </small>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={message.isUser ? 'd-flex justify-content-end mb-3' : 'd-flex justify-content-start mb-3'}
            >
              <div
                className={message.isUser ? 'bg-primary text-white p-3 rounded' : 'bg-light border p-3 rounded'}
                style={{ maxWidth: message.books && message.books.length > 0 ? '90%' : '75%' }}
              >
                <div>{message.text}</div>
                
                {/* Display books if available */}
                {message.books && message.books.length > 0 && (
                  <div className="mt-3">
                    <div className="small text-muted mb-2">
                      {selectedLanguage === 'bn' && `${message.books.length}টি বই পাওয়া গেছে:`}
                      {selectedLanguage === 'en' && `Found ${message.books.length} books:`}
                      {selectedLanguage === 'bn+en' && `Found ${message.books.length}টি books:`}
                    </div>
                    {message.books.map((book, bookIndex) => (
                      <div key={bookIndex} className="border rounded p-3 mb-2 bg-white shadow-sm">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-2 text-primary fw-bold">{book.title}</h6>
                            <div className="row">
                              <div className="col-md-6">
                                <p className="mb-1 text-muted small">
                                  <strong>
                                    {selectedLanguage === 'bn' && 'লেখক:'}
                                    {selectedLanguage === 'en' && 'Author:'}
                                    {selectedLanguage === 'bn+en' && 'Author:'}
                                  </strong> {book.author}
                                </p>
                                <p className="mb-1 text-muted small">
                                  <strong>
                                    {selectedLanguage === 'bn' && 'প্রকাশিত:'}
                                    {selectedLanguage === 'en' && 'Published:'}
                                    {selectedLanguage === 'bn+en' && 'Published:'}
                                  </strong> {book.publishedYear}
                                </p>
                              </div>
                              <div className="col-md-6">
                                {book.genre && (
                                  <p className="mb-1 text-muted small">
                                    <strong>
                                      {selectedLanguage === 'bn' && 'ধরন:'}
                                      {selectedLanguage === 'en' && 'Genre:'}
                                      {selectedLanguage === 'bn+en' && 'Genre:'}
                                    </strong>
                                    <span className="badge bg-secondary ms-1">{book.genre}</span>
                                  </p>
                                )}
                                <p className="mb-1 text-success small">
                                  <strong>
                                    {selectedLanguage === 'bn' && 'উপলব্ধ:'}
                                    {selectedLanguage === 'en' && 'Available:'}
                                    {selectedLanguage === 'bn+en' && 'Available:'}
                                  </strong> {book.quantity}
                                  {selectedLanguage === 'bn' && ' কপি'}
                                  {selectedLanguage === 'en' && ' copies'}
                                  {selectedLanguage === 'bn+en' && ' copies'}
                                </p>
                              </div>
                            </div>
                            {book.description && (
                              <p className="mb-0 text-muted small mt-2 p-2 bg-light rounded">
                                <strong>
                                  {selectedLanguage === 'bn' && 'বিবরণ:'}
                                  {selectedLanguage === 'en' && 'Description:'}
                                  {selectedLanguage === 'bn+en' && 'Description:'}
                                </strong><br/>
                                {book.description.length > 150
                                  ? book.description.substring(0, 150) + '...'
                                  : book.description}
                              </p>
                            )}
                          </div>
                          <div className="text-end ms-3">
                            <span className="badge bg-info">ID: {book.id}</span>
                            {book.isbn && (
                              <div className="small text-muted mt-1">
                                ISBN: {book.isbn}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <small className={message.isUser ? 'text-light' : 'text-muted'}>
                  {message.timestamp.toLocaleTimeString()} • {getLanguageLabel(message.language)}
                </small>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="d-flex justify-content-start mb-3">
              <div className="bg-light border p-3 rounded">
                <Spinner animation="border" size="sm" className="me-2" />
                {selectedLanguage === 'bn' && 'অনুসন্ধান করা হচ্ছে...'}
                {selectedLanguage === 'en' && 'Searching...'}
                {selectedLanguage === 'bn+en' && 'Searching করা হচ্ছে...'}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </Card.Body>

        <Card.Footer>
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <div className="d-flex gap-2">
              <div className="flex-grow-1 position-relative">
                <Form.Control
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={getPlaceholderText()}
                  disabled={isLoading}
                  className="pe-5"
                />
                <Button
                  variant={isListening ? "danger" : "outline-secondary"}
                  size="sm"
                  className="position-absolute end-0 top-50 translate-middle-y me-2"
                  onClick={handleSpeechRecognition}
                  disabled={isLoading || !recognition}
                  title={isListening ? "Stop listening" : "Start voice input"}
                  style={{ border: 'none', background: 'transparent' }}
                >
                  {isListening ? <FaMicrophoneSlash className="text-danger" /> : <FaMicrophone />}
                </Button>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !inputMessage.trim()}
                className="d-flex align-items-center"
              >
                {isLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <FaPaperPlane className="me-1" />
                    {selectedLanguage === 'bn' && 'পাঠান'}
                    {selectedLanguage === 'en' && 'Send'}
                    {selectedLanguage === 'bn+en' && 'Send'}
                  </>
                )}
              </Button>
            </div>
          </Form>

          <div className="text-center mt-2">
            <small className="text-muted">
              {selectedLanguage === 'bn' && 'বই সম্পর্কিত প্রশ্ন করুন। উদাহরণ: "স্বাস্থ্য বিষয়ক বই" বা "১৯৯০-২০০০ সালের বই"'}
              {selectedLanguage === 'en' && 'Ask questions about books. Example: "health related books" or "books from 1990-2000"'}
              {selectedLanguage === 'bn+en' && 'বই সম্পর্কিত questions করুন। Example: "fitness books" or "১৯৯০ সালের বই"'}
            </small>
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default AIChat;