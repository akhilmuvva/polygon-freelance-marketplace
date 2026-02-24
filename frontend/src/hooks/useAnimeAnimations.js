import { useEffect, useRef, useCallback } from 'react';
import { animate, stagger, createTimeline } from 'animejs';

/**
 * Custom hook for anime.js animations (v4.3.6 compatible)
 * Provides reusable animation patterns for the PolyLance frontend
 * Version: 1.0.1
 */
export const useAnimeAnimations = () => {
    // Stagger fade-in animation for lists
    const staggerFadeIn = useCallback((selector, delay = 35) => {
        animate(selector, {
            opacity: [0, 1],
            translateY: [8, 0],
            easing: 'easeOutCubic',
            duration: 400,
            delay: stagger(delay),
        });
    }, []);

    // Pulse animation for attention-grabbing elements
    const pulse = useCallback((selector, scale = 1.05) => {
        animate(selector, {
            scale: [1, scale, 1],
            easing: 'easeInOutQuad',
            duration: 1000,
            loop: true,
        });
    }, []);

    // Shimmer effect for loading states
    const shimmer = useCallback((selector) => {
        animate(selector, {
            backgroundPosition: ['0% 50%', '100% 50%'],
            easing: 'linear',
            duration: 2000,
            loop: true,
        });
    }, []);

    // Slide in from left
    const slideInLeft = useCallback((selector, distance = 25) => {
        animate(selector, {
            translateX: [-distance, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 600,
        });
    }, []);

    // Slide in from right
    const slideInRight = useCallback((selector, distance = 30) => {
        animate(selector, {
            translateX: [distance, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 700,
        });
    }, []);

    // Scale in animation
    const scaleIn = useCallback((selector) => {
        animate(selector, {
            scale: [0.9, 1],
            opacity: [0, 1],
            easing: 'easeOutBack(1.5)',
            duration: 800,
        });
    }, []);

    // Rotate and fade in
    const rotateIn = useCallback((selector) => {
        animate(selector, {
            rotate: [-90, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 1000,
        });
    }, []);

    // Floating animation
    const float = useCallback((selector, distance = 10) => {
        animate(selector, {
            translateY: [0, -distance, 0],
            easing: 'easeInOutSine',
            duration: 3000,
            loop: true,
        });
    }, []);

    // Glitch effect
    const glitch = useCallback((selector) => {
        animate(selector, {
            translateX: [
                { value: -2, duration: 50 },
                { value: 2, duration: 50 },
                { value: -2, duration: 50 },
                { value: 0, duration: 50 },
            ],
            easing: 'easeInOutQuad',
            loop: true,
            loopDelay: 3000,
        });
    }, []);

    // Number counter animation
    const countUp = useCallback((element, target, duration = 800) => {
        const obj = { value: 0 };
        animate(obj, {
            value: target,
            round: 1,
            easing: 'easeOutExpo',
            duration: duration,
            onRender: function () {
                if (element) {
                    element.textContent = obj.value;
                }
            },
        });
    }, []);

    // Ripple effect
    const ripple = useCallback((selector) => {
        animate(selector, {
            scale: [1, 1.5],
            opacity: [0.5, 0],
            easing: 'easeOutExpo',
            duration: 1000,
        });
    }, []);

    // Bounce in
    const bounceIn = useCallback((selector) => {
        animate(selector, {
            scale: [0, 1],
            opacity: [0, 1],
            easing: 'spring(1, 80, 10, 0)',
            duration: 1500,
        });
    }, []);

    // Typewriter effect
    const typewriter = useCallback((element, text, speed = 50) => {
        if (!element) return;
        let i = 0;
        element.textContent = '';
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, []);

    // Card flip animation
    const flipCard = useCallback((selector) => {
        animate(selector, {
            rotateY: [0, 180],
            easing: 'easeInOutSine',
            duration: 800,
        });
    }, []);

    // Morph path animation (for SVGs)
    const morphPath = useCallback((selector, newPath) => {
        animate(selector, {
            d: newPath,
            easing: 'easeInOutQuad',
            duration: 1000,
        });
    }, []);

    // Parallax scroll effect
    const parallax = useCallback((selector, speed = 0.5) => {
        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const yPos = -(scrolled * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Reveal on scroll
    const revealOnScroll = useCallback((selector, threshold = 0.1) => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animate(entry.target, {
                            opacity: [0, 1],
                            translateY: [50, 0],
                            easing: 'easeOutExpo',
                            duration: 1200,
                        });
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold }
        );
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // Magnetic button effect
    const magneticButton = useCallback((buttonRef) => {
        if (!buttonRef.current) return;
        const button = buttonRef.current;
        const strength = 20;
        const handleMouseMove = (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            animate(button, {
                translateX: x / strength,
                translateY: y / strength,
                duration: 300,
                easing: 'easeOutQuad',
            });
        };
        const handleMouseLeave = () => {
            animate(button, {
                translateX: 0,
                translateY: 0,
                duration: 500,
                easing: 'easeOutElastic(1, .6)',
            });
        };
        button.addEventListener('mousemove', handleMouseMove);
        button.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            button.removeEventListener('mousemove', handleMouseMove);
            button.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return {
        staggerFadeIn,
        pulse,
        shimmer,
        slideInLeft,
        slideInRight,
        scaleIn,
        rotateIn,
        float,
        glitch,
        countUp,
        ripple,
        bounceIn,
        typewriter,
        flipCard,
        morphPath,
        parallax,
        revealOnScroll,
        magneticButton,
    };
};

/**
 * Hook for animating elements on mount
 */
export const useAnimeOnMount = (animation, dependencies = []) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && animation) {
            animation(ref.current);
        }
    }, dependencies);

    return ref;
};

/**
 * Timeline-based animations for complex sequences
 */
export const useAnimeTimeline = () => {
    const getTimeline = (config = {}) => {
        return createTimeline({
            easing: 'easeOutExpo',
            duration: 800,
            ...config,
        });
    };

    return { createTimeline: getTimeline };
};
