"use client";

import React, { useState, useRef } from 'react';

export default function PullToRefresh({ children, onRefresh }: { children: React.ReactNode, onRefresh: () => Promise<void> }) {
    const [startY, setStartY] = useState(0);
    const [pulling, setPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const threshold = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only allow pull to refresh if we are at the very top of the container
        if (containerRef.current && containerRef.current.scrollTop <= 0) {
            setStartY(e.touches[0].clientY);
            setPulling(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!pulling || refreshing) return;
        const y = e.touches[0].clientY;
        const distance = y - startY;
        
        if (distance > 0 && containerRef.current && containerRef.current.scrollTop <= 0) {
            // Apply resistance
            const resistanceDistance = distance * 0.4;
            setPullDistance(Math.min(resistanceDistance, threshold + 30));
            
            // Prevent default scroll when pulling down at the top
            if (e.cancelable) {
                e.preventDefault();
            }
        }
    };

    const handleTouchEnd = async () => {
        if (!pulling) return;
        setPulling(false);
        
        if (pullDistance >= threshold) {
            setRefreshing(true);
            setPullDistance(threshold); // Hold it at threshold while refreshing
            await onRefresh();
            setRefreshing(false);
        }
        
        setPullDistance(0);
    };

    return (
        <div 
            ref={containerRef}
            className="flex-1 overflow-x-hidden overflow-y-auto bg-[#fafafa] relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Spinner indicator */}
            <div 
                className={`absolute w-full flex justify-center left-0 z-20 top-2 pointer-events-none ${pulling ? 'transition-none' : 'transition-transform duration-300 ease-out'}`}
                style={{ 
                    transform: `translateY(${pullDistance - 60}px)`,
                    opacity: Math.min(pullDistance / (threshold * 0.8), 1)
                }}
            >
                <div className="bg-white rounded-full p-2.5 shadow-lg border border-red-100 flex items-center justify-center">
                    <span className={`material-icons text-red-600 text-2xl ${refreshing ? 'animate-spin' : ''}`}
                          style={{ transform: `rotate(${pullDistance * 4}deg)` }}>
                        refresh
                    </span>
                </div>
            </div>
            
            {/* Main content wrapper */}
            <div 
                ref={contentRef}
                className={`min-h-full ${pulling ? 'transition-none' : 'transition-transform duration-300 ease-out'}`}
                style={{ transform: `translateY(${pullDistance > 0 && !refreshing ? pullDistance : refreshing ? threshold : 0}px)` }}
            >
                {children}
            </div>
        </div>
    );
}
