import React, { useState, useEffect } from 'react';
import { Property, FilterState } from './types';
import { PROPERTIES } from './data/properties';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PropertyGrid } from './components/PropertyGrid';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { AIAdvisorSection } from './components/AIAdvisorSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { WhatsAppBookingModal } from './components/WhatsAppBookingModal';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { AIChatAdvisor } from './components/AIChatAdvisor';
import { AuthModal } from './components/AuthModal';
import { AuthPage } from './components/AuthPage';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'auth'>('home');
  const [authPageMode, setAuthPageMode] = useState<'signin' | 'signup'>('signin');
  const [properties] = useState<Property[]>(PROPERTIES);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: 'all',
    location: 'all',
    typology: 'all',
    searchQuery: '',
  });

  // Modal states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [selectedBookingPropertyName, setSelectedBookingPropertyName] = useState<string>('');
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);

  // Synchronize hash routing with view state for seamless direct links
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#login' || hash === '#auth' || hash === '#signin') {
        setAuthPageMode('signin');
        setCurrentView('auth');
      } else if (hash === '#signup' || hash === '#register') {
        setAuthPageMode('signup');
        setCurrentView('auth');
      } else if (hash === '#home' || hash === '') {
        setCurrentView('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigateToAuthPage = (mode?: 'signin' | 'signup') => {
    setAuthPageMode(mode || 'signin');
    setCurrentView('auth');
    window.location.hash = mode === 'signup' ? '#signup' : '#login';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnHome = () => {
    setCurrentView('home');
    if (window.location.hash) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode?: 'signin' | 'signup') => {
    setAuthModalMode(mode || 'signin');
    setIsAuthModalOpen(true);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSearchSubmit = () => {
    const el = document.getElementById('featured-properties-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenBooking = (propertyOrName?: Property | string) => {
    if (typeof propertyOrName === 'string') {
      setSelectedBookingPropertyName(propertyOrName);
    } else if (propertyOrName && typeof propertyOrName === 'object') {
      setSelectedBookingPropertyName(propertyOrName.name || propertyOrName.title);
    } else {
      setSelectedBookingPropertyName('');
    }
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  const handleViewDetails = (property: Property) => {
    setDetailProperty(property);
  };

  const handleCloseDetails = () => {
    setDetailProperty(null);
  };

  if (currentView === 'auth') {
    return (
      <AuthPage
        initialMode={authPageMode}
        onReturnHome={handleReturnHome}
        onOpenAIAdvisor={() => {
          handleReturnHome();
          setTimeout(() => setIsAIAdvisorOpen(true), 200);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] selection:bg-[#C5A059] selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        onOpenBooking={() => handleOpenBooking()}
        onScrollToSection={handleScrollToSection}
        onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
        onOpenAuth={handleOpenAuth}
        onNavigateToAuthPage={handleNavigateToAuthPage}
      />

      {/* Main Content Area */}
      <main>
        {/* Hero Section */}
        <Hero
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearchSubmit={handleSearchSubmit}
          onOpenBooking={() => handleOpenBooking()}
          onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
        />

        {/* Featured Properties Grid with Interactive Filters */}
        <PropertyGrid
          properties={properties}
          filters={filters}
          onFilterChange={handleFilterChange}
          onBookNow={(prop) => handleOpenBooking(prop)}
          onViewDetails={handleViewDetails}
        />

        {/* About AS Realty & Amit Shivpeth */}
        <AboutSection onOpenBooking={() => handleOpenBooking()} />

        {/* Bespoke Client Services & VIP Privileges */}
        <ServicesSection onOpenBooking={() => handleOpenBooking()} />

        {/* Dedicated Gemini AI Advisor Section (Convince about properties, services & trust) */}
        <AIAdvisorSection 
          onOpenBooking={() => handleOpenBooking()} 
          onOpenAuth={handleOpenAuth}
        />

        {/* Contact Us & Direct Inquiry Section */}
        <ContactSection onOpenBooking={() => handleOpenBooking()} />
      </main>

      {/* Site Footer */}
      <Footer
        onScrollToSection={handleScrollToSection}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* Sticky Bottom-Right WhatsApp & AI Quick Contact Widget */}
      <FloatingWhatsApp 
        onOpenBooking={() => handleOpenBooking()} 
        onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
      />

      {/* Floating Gemini AI Concierge Multi-Turn Advisor Modal */}
      {isAIAdvisorOpen && (
        <AIChatAdvisor
          isOpen={isAIAdvisorOpen}
          initialTab="voice"
          onClose={() => setIsAIAdvisorOpen(false)}
          onOpenBooking={(propName) => {
            setIsAIAdvisorOpen(false);
            handleOpenBooking(propName);
          }}
          onOpenAuth={handleOpenAuth}
        />
      )}

      {/* Interactive WhatsApp Booking Modal Component */}
      <WhatsAppBookingModal
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        selectedPropertyName={selectedBookingPropertyName}
        properties={properties}
      />

      {/* Property Deep Dive & Gallery Modal */}
      <PropertyDetailModal
        property={detailProperty}
        onClose={handleCloseDetails}
        onBookNow={(prop) => handleOpenBooking(prop)}
      />

      {/* Supabase Authentication Modal (Login / Sign Up / VIP Guest) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onNavigateToAuthPage={handleNavigateToAuthPage}
      />
    </div>
  );
}
