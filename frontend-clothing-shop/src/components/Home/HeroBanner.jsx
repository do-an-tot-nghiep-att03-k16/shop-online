import React, { useState, useEffect } from 'react'
import { Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import './HeroBanner.css'
import envConfig from '../../config/env'

// Đảm bảo URL không có /api ở cuối (vì upload path không cần /api)
const DEFAULT_CMS_URL = envConfig.API_STRAPI_URL.replace(/\/api$/, '');

const HeroBanner = ({ 
    banners = [], 
    settings = {}, 
    content = {},
    cmsUrl = DEFAULT_CMS_URL
}) => {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(settings.autoplay !== false)

    // Default settings
    const defaultSettings = {
        autoplay: true,
        duration: 5000,
        showDots: true,
        showArrows: true,
        ...settings
    }

    // Auto play functionality
    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return

        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % banners.length)
        }, defaultSettings.duration)

        return () => clearInterval(interval)
    }, [isAutoPlaying, banners.length, defaultSettings.duration])

    // Handle manual navigation
    const goToSlide = (index) => {
        setCurrentSlide(index)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(defaultSettings.autoplay), 3000)
    }

    const nextSlide = () => {
        goToSlide((currentSlide + 1) % banners.length)
    }

    const prevSlide = () => {
        goToSlide(currentSlide === 0 ? banners.length - 1 : currentSlide - 1)
    }

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft') prevSlide()
            if (e.key === 'ArrowRight') nextSlide()
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [currentSlide])

    // Format image URL
    const getImageUrl = (banner, size = 'large') => {
        if (!banner) return ''
        
        // Use responsive image sizes
        const imageData = size === 'large' && banner.formats?.large 
            ? banner.formats.large 
            : banner.formats?.medium || banner

        const url = imageData.url || banner.url
        return url?.startsWith('http') ? url : `${cmsUrl}${url}`
    }

    // Handle empty banners
    if (!banners || banners.length === 0) {
        return (
            <div className="hero-banner hero-banner--empty">
                <div className="hero-banner__content">
                    <h1>{content.title || 'Chào mừng đến với Aristia'}</h1>
                    <p>{content.subtitle || 'Khám phá bộ sưu tập thời trang cao cấp'}</p>
                    <Button 
                        type="primary" 
                        size="large" 
                        href="/shop"
                        style={{
                            background: 'linear-gradient(45deg, #c48783, #e6aea9)',
                            border: 'none'
                        }}
                    >
                        Khám phá ngay
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="hero-banner">
            <div className="hero-banner__container">
                {/* Banner Slides */}
                <div className="hero-banner__slides">
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id || index}
                            className={`hero-banner__slide ${
                                index === currentSlide ? 'hero-banner__slide--active' : ''
                            }`}
                            style={{
                                transform: `translateX(${(index - currentSlide) * 100}%)`,
                            }}
                        >
                            <img
                                src={getImageUrl(banner, 'large')}
                                alt={banner.alternativeText || banner.caption || `Banner ${index + 1}`}
                                className="hero-banner__image"
                                loading={index === 0 ? 'eager' : 'lazy'}
                            />
                            
                            {/* Overlay content */}
                            <div className="hero-banner__overlay">
                                <div className="hero-banner__content">
                                    {content.title && (
                                        <h1 className="hero-banner__title">
                                            {content.title}
                                        </h1>
                                    )}
                                    {content.subtitle && (
                                        <p className="hero-banner__subtitle">
                                            {content.subtitle}
                                        </p>
                                    )}
                                    <div className="hero-banner__actions">
                                        <Button 
                                            type="primary" 
                                            size="large"
                                            href="/shop"
                                            className="hero-banner__cta"
                                            style={{
                                                background: 'linear-gradient(45deg, #c48783, #e6aea9)',
                                                border: 'none'
                                            }}
                                        >
                                            Khám phá ngay
                                        </Button>
                                        <Button 
                                            type="default" 
                                            size="large"
                                            href="/shop/sale"
                                            className="hero-banner__cta hero-banner__cta--secondary"
                                            style={{
                                                borderColor: '#ffcaca',
                                                color: 'white'
                                            }}
                                        >
                                            Xem ưu đãi
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                {defaultSettings.showArrows && banners.length > 1 && (
                    <>
                        <button
                            className="hero-banner__arrow hero-banner__arrow--prev"
                            onClick={prevSlide}
                            aria-label="Previous slide"
                        >
                            <LeftOutlined />
                        </button>
                        <button
                            className="hero-banner__arrow hero-banner__arrow--next"
                            onClick={nextSlide}
                            aria-label="Next slide"
                        >
                            <RightOutlined />
                        </button>
                    </>
                )}

                {/* Dots Navigation */}
                {defaultSettings.showDots && banners.length > 1 && (
                    <div className="hero-banner__dots">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                className={`hero-banner__dot ${
                                    index === currentSlide ? 'hero-banner__dot--active' : ''
                                }`}
                                onClick={() => goToSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Progress bar */}
                {defaultSettings.autoplay && isAutoPlaying && banners.length > 1 && (
                    <div className="hero-banner__progress">
                        <div 
                            className="hero-banner__progress-bar"
                            style={{
                                animationDuration: `${defaultSettings.duration}ms`,
                                animationPlayState: isAutoPlaying ? 'running' : 'paused'
                            }}
                        />
                    </div>
                )}

                {/* Slide counter - Hidden per user request */}
                {false && banners.length > 1 && (
                    <div className="hero-banner__counter">
                        <span>{currentSlide + 1}</span>
                        <span>/</span>
                        <span>{banners.length}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HeroBanner