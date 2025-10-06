import React from 'react';

const Contact = () => {
        return (
                <section className="section-card bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/30" data-testid="contact-section">
                        <h2 className="heading-primary" data-testid="contact-heading">
                                Contact
                        </h2>
                        <p className="text-content" data-testid="contact-description">
                                For any queries contact me {` `}
                                <a
                                        href="mailto:abhinavgupta4505@gmail.com"
                                        className="link-hover font-semibold"
                                        data-testid="contact-email-link"
                                >
                                        here
                                </a>
                                .
                        </p>
                </section>
        );
};

export default Contact;
