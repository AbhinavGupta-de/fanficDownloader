import Image from 'next/image';
import React from 'react';

const MainSection = () => {
        return (
                <section className="section-card" data-testid="main-section">
                        <h2 className="heading-primary" data-testid="main-section-heading">
                                Top Section
                        </h2>
                        <div className="flex flex-col md:flex-row gap-4 mb-6" data-testid="main-section-images">
                                <div className="image-container flex-1" data-testid="main-section-image-top">
                                        <Image 
                                                src="/logo/top.png" 
                                                alt="Extension top view" 
                                                width={320} 
                                                height={120}
                                                className="w-full h-auto"
                                        />
                                </div>
                                <div className="image-container flex-1" data-testid="main-section-image-story">
                                        <Image 
                                                src="/logo/story.png" 
                                                alt="Story view" 
                                                width={320} 
                                                height={120}
                                                className="w-full h-auto"
                                        />
                                </div>
                        </div>
                        <div className="space-y-4" data-testid="main-section-content">
                                <p className="text-content" data-testid="main-section-description">
                                        This is header and top section of the extension, as above shown in the
                                        images you can have two possible views of the extension.
                                </p>
                                <ul className="space-y-2 text-content ml-4" data-testid="main-section-list">
                                        <li className="flex items-start" data-testid="main-section-list-item-1">
                                                <span className="text-primary mr-2">•</span>
                                                <span>One is the story name, author name and the site name.</span>
                                        </li>
                                        <li className="flex items-start" data-testid="main-section-list-item-2">
                                                <span className="text-primary mr-2">•</span>
                                                <span>
                                                        The other one is sad bunny image and text "Sorry, we don't have what you are
                                                        looking for...".
                                                </span>
                                        </li>
                                </ul>
                                <p className="text-content" data-testid="main-section-footer">
                                        Based on which website you are on, the extension will show the respective
                                        view.
                                </p>
                        </div>
                </section>
        );
};

export default MainSection;
