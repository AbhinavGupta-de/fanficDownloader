import Image from 'next/image';
import React from 'react';

const Header = () => {
        return (
                <header className="flex justify-center items-center w-full py-6 md:py-8 bg-gradient-to-b from-gray-900/50 to-transparent" data-testid="header">
                        <div className="transition-transform duration-300 hover:scale-105" data-testid="header-logo-container">
                                <Image 
                                        src="/logo/logo.png" 
                                        alt="Fanfic Downloader Logo" 
                                        width={512} 
                                        height={128}
                                        className="drop-shadow-2xl"
                                        priority
                                        data-testid="header-logo"
                                />
                        </div>
                </header>
        );
};

export default Header;
