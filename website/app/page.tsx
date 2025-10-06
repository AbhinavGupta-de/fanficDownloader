import Contact from '@/components/Contact';
import DownloadSection from '@/components/DownloadSection';
import Features from '@/components/Features';
import LinkSection from '@/components/LinkSection';
import MainSection from '@/components/MainSection';
import Toolbar from '@/components/Toolbar';
import React from 'react';

const Home = () => {
        return (
                <div className="min-h-screen px-4 md:px-8 lg:px-0 py-8 md:py-12 w-full max-w-5xl mx-auto" data-testid="home-page">
                        <div className="mb-8 md:mb-12 text-center">
                                <p className="text-lg md:text-xl text-gray-300 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 md:p-6 border border-gray-700/50 shadow-lg" data-testid="intro-text">
                                        This guide will walk you through the features of Fanfic Downloader
                                </p>
                        </div>
                        <div className="space-y-8 md:space-y-12">
                                <Toolbar />
                                <MainSection />
                                <DownloadSection />
                                <LinkSection />
                                <Features />
                                <Contact />
                        </div>
                </div>
        );
};

export default Home;
