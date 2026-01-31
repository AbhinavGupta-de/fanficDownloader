import React from 'react';

const Footer = () => {
        return (
                <footer className="flex justify-center items-center p-6 md:p-8 text-base md:text-lg bg-gradient-to-t from-gray-900/50 to-transparent mt-12" data-testid="footer">
                        <p className="text-center text-gray-300" data-testid="footer-text">
                                This page is developed by{' '}
                                <a 
                                        href="https://www.linkedin.com/in/abhinavgpt/" 
                                        className="link-hover font-semibold"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        data-testid="footer-linkedin-link"
                                >
                                        Abhinav Gupta
                                </a>{' '}
                                and is open source on{' '}
                                <a
                                        href="https://github.com/AbhinavGupta-de/fanficDownloader"
                                        className="link-hover font-semibold"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        data-testid="footer-github-link"
                                >
                                        GitHub
                                </a>
                                .
                        </p>
                </footer>
        );
};

export default Footer;
