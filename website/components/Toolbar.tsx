import Image from 'next/image';
import React from 'react';

const Toolbar = () => {
        return (
                <section className="section-card" data-testid="toolbar-section">
                        <h2 className="heading-primary" data-testid="toolbar-heading">
                                Toolbar Icon
                        </h2>
                        <div className="image-container mb-6" data-testid="toolbar-image-container">
                                <Image 
                                        src="/logo/toolbar.jpg" 
                                        alt="Toolbar icon location" 
                                        width={320} 
                                        height={120}
                                        className="w-full h-auto"
                                        data-testid="toolbar-image"
                                />
                        </div>
                        <p className="text-content" data-testid="toolbar-description">
                                If Fanfic Downloader <span className="font-bold text-white">is hidden</span> after
                                installation, click the Extensions button and the pin button next to the
                                extension!
                        </p>
                </section>
        );
};

export default Toolbar;
