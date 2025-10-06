import Image from 'next/image';
import React from 'react';

const LinkSection = () => {
        return (
                <section className="section-card" data-testid="link-section">
                        <h2 className="heading-primary" data-testid="link-section-heading">
                                Links
                        </h2>
                        <div className="image-container mb-6" data-testid="link-section-image-container">
                                <Image 
                                        src="/logo/links.png" 
                                        alt="Extension links section" 
                                        width={280} 
                                        height={120}
                                        className="w-full h-auto"
                                        data-testid="link-section-image"
                                />
                        </div>
                        <p className="text-content" data-testid="link-section-description">
                                This section contains links to different things like this is an open source
                                extension so link to the GitHub repo.
                        </p>
                </section>
        );
};

export default LinkSection;
