import Image from 'next/image';
import React from 'react';

const DownloadSection = () => {
        return (
                <section className="section-card" data-testid="download-section">
                        <h2 className="heading-primary" data-testid="download-section-heading">
                                Download Section
                        </h2>
                        <div className="image-container mb-6" data-testid="download-section-main-image">
                                <Image 
                                        src="/logo/download.png" 
                                        alt="Download button interface" 
                                        width={320} 
                                        height={120}
                                        className="w-full h-auto"
                                />
                        </div>
                        <div className="space-y-4" data-testid="download-section-content">
                                <p className="text-content" data-testid="download-section-description-1">
                                        This is the download section of the extension, as above shown in the image
                                        you can have the download button. There is also a dropdown button where you
                                        can select if you want to download <span className="text-white font-semibold">single chapter</span> or{' '}
                                        <span className="text-white font-semibold">full story</span> or the <span className="text-white font-semibold">whole series</span>
                                </p>
                                <p className="text-content" data-testid="download-section-description-2">
                                        You can also choose in what format you want to download the story. Two
                                        formats are available for now, that is <span className="text-white font-semibold">epub</span> and <span className="text-white font-semibold">pdf</span>.
                                </p>
                                <div className="flex flex-col md:flex-row gap-4 mt-6" data-testid="download-section-dropdown-images">
                                        <div className="image-container flex-1" data-testid="download-section-dropdown-image">
                                                <Image 
                                                        src="/logo/dropdown.png" 
                                                        alt="Dropdown options" 
                                                        width={200} 
                                                        height={100}
                                                        className="w-full h-auto"
                                                />
                                        </div>
                                        <div className="image-container flex-1" data-testid="download-section-type-image">
                                                <Image
                                                        src="/logo/downloadType.png"
                                                        alt="Download type selection"
                                                        width={200}
                                                        height={100}
                                                        className="w-full h-auto"
                                                />
                                        </div>
                                </div>
                        </div>
                </section>
        );
};

export default DownloadSection;
