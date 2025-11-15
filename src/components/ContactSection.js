import React, { useState } from 'react';
import './ContactSection.css';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset status after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 2000);
  };

  const contactMethods = [
    {
      icon: "📧",
      method: "Email",
      details: "support@roadrepair.com",
      description: "Send us an email anytime",
      link: "mailto:support@roadrepair.com"
    },
    {
      icon: "📞",
      method: "Phone",
      details: "+1 (555) 123-ROAD",
      description: "Mon-Fri from 8am to 6pm",
      link: "tel:+15551237623"
    },
    {
      icon: "📍",
      method: "Office",
      details: "123 Infrastructure Street",
      description: "City Center, Metro 10001",
      link: "#"
    },
    {
      icon: "🕒",
      method: "Business Hours",
      details: "Monday - Friday",
      description: "8:00 AM - 6:00 PM",
      link: "#"
    }
  ];

  const departments = [
    {
      name: "Technical Support",
      email: "tech@roadrepair.com",
      phone: "+1 (555) 123-TECH"
    },
    {
      name: "Customer Service",
      email: "service@roadrepair.com",
      phone: "+1 (555) 123-HELP"
    },
    {
      name: "Emergency Issues",
      email: "emergency@roadrepair.com",
      phone: "+1 (555) 123-911"
    }
  ];

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <div className="section-header">
          <h1>Contact Us</h1>
          <p>Get in touch with our team for support, inquiries, or emergency road issues</p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <h2>We're Here to Help</h2>
            <p className="contact-description">
              Have questions about road repairs in your area? Need help with reporting 
              an issue? Our dedicated team is available to assist you with any concerns 
              regarding road maintenance and infrastructure.
            </p>
            
            <div className="contact-methods">
              {contactMethods.map((method, index) => (
                <a key={index} href={method.link} className="contact-method">
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-details">
                    <h4>{method.method}</h4>
                    <p className="method-info">{method.details}</p>
                    <p className="method-desc">{method.description}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="departments-section">
              <h3>Department Contacts</h3>
              <div className="departments-grid">
                {departments.map((dept, index) => (
                  <div key={index} className="department-card">
                    <h5>{dept.name}</h5>
                    <div className="dept-contacts">
                      <a href={`mailto:${dept.email}`}>{dept.email}</a>
                      <a href={`tel:${dept.phone}`}>{dept.phone}</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="contact-form-container">
            <div className="form-header">
              <h3>Send us a Message</h3>
              <p>Fill out the form below and we'll get back to you within 24 hours</p>
            </div>
            
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject" className="form-label">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                  placeholder="What is this regarding?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                  placeholder="Please describe your issue or inquiry in detail..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>

              {submitStatus === 'success' && (
                <div className="success-message">
                  ✅ Thank you! Your message has been sent successfully. We'll get back to you soon.
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>How quickly are road issues addressed?</h4>
              <p>Emergency issues are addressed within 24 hours, while standard repairs are scheduled based on priority and typically completed within 5-7 business days.</p>
            </div>
            <div className="faq-item">
              <h4>Can I track the progress of my complaint?</h4>
              <p>Yes, once you submit a complaint, you'll receive a tracking number and can monitor progress through your dashboard or by contacting our support team.</p>
            </div>
            <div className="faq-item">
              <h4>What information do I need to report an issue?</h4>
              <p>Please provide the exact location, type of issue, photos if possible, and any safety concerns. The more details, the faster we can address it.</p>
            </div>
            <div className="faq-item">
              <h4>Is there a mobile app available?</h4>
              <p>Our web application is mobile-friendly and works on all devices. We're developing a dedicated mobile app for even better experience.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;