import { useState, useRef } from 'react';
import { Quote } from 'lucide-react';

interface Feature {
    title: string;
    desc: string;
    icon?: React.ReactNode;
}

interface FeatureCarouselProps {
    features: Feature[];
}

export function FeatureCarousel({ features }: FeatureCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const total = features.length;

    // Helper to get index with wrap-around
    const getIndex = (index: number) => {
        return (index + total) % total;
    };

    const handlePrev = () => {
        setActiveIndex((prev) => getIndex(prev - 1));
    };

    const handleNext = () => {
        setActiveIndex((prev) => getIndex(prev + 1));
    };

    // Drag/Swipe Logic
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        setStartX(clientX);
    };

    const handleMouseMove = () => {
        if (!isDragging) return;
        // Optional: Add real-time drag feedback here if needed
    };

    const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        setIsDragging(false);

        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
        const diff = startX - clientX;

        if (Math.abs(diff) > 50) { // Threshold for swipe
            if (diff > 0) {
                handleNext(); // Drag left -> Next
            } else {
                handlePrev(); // Drag right -> Prev
            }
        }
    };

    // Determine visible items
    const prevIndex = getIndex(activeIndex - 1);
    const nextIndex = getIndex(activeIndex + 1);

    // Styles for Center Item (Larger)
    const centerTitleStyle = "text-xl md:text-2xl font-bold text-[#1A3320] uppercase mb-4 tracking-normal";
    const centerDescStyle = "text-base md:text-lg text-[#1A3320] italic leading-relaxed font-medium";

    // Styles for Side Items (Slightly Smaller)
    const sideTitleStyle = "text-lg md:text-xl font-bold text-[#1A3320] uppercase mb-4 tracking-normal";
    const sideDescStyle = "text-sm md:text-base text-[#1A3320] italic leading-relaxed font-medium";

    return (
        <div className="py-16 bg-transparent overflow-hidden select-none font-sans">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[#1A3320] uppercase tracking-wide">
                    TMS LÀ SỰ KHÁC BIỆT
                </h2>
            </div>

            <div
                className="relative max-w-7xl mx-auto px-4 h-[400px] flex items-center justify-center md:justify-between gap-4 md:gap-8"
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setIsDragging(false)}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            >
                {/* PREVIOUS ITEM (Left) */}
                <div
                    className="hidden md:block w-[280px] lg:w-[350px] opacity-70 transition-all duration-500 cursor-pointer hover:opacity-100"
                    onClick={handlePrev}
                >
                    <div className="text-center">
                        <h3 className={sideTitleStyle}>{features[prevIndex].title}</h3>
                        <p className={`${sideDescStyle} line-clamp-3`}>{features[prevIndex].desc}</p>
                    </div>
                </div>

                {/* ACTIVE ITEM (Center) */}
                <div className="relative z-10 w-full max-w-2xl px-4 md:px-8 transition-all duration-500 opacity-100 flex-1">
                    <div className="flex flex-col items-center text-center">
                        <Quote size={48} className="text-[#2E5A34] mb-6 fill-current opacity-80" />

                        <h3 className={centerTitleStyle}>
                            {features[activeIndex].title}
                        </h3>

                        <p className={centerDescStyle}>
                            {features[activeIndex].desc}
                        </p>

                        <Quote size={48} className="text-[#2E5A34] mt-6 fill-current opacity-80 rotate-180" />
                    </div>
                </div>

                {/* NEXT ITEM (Right) */}
                <div
                    className="hidden md:block w-[280px] lg:w-[350px] opacity-70 transition-all duration-500 cursor-pointer hover:opacity-100"
                    onClick={handleNext}
                >
                    <div className="text-center">
                        <h3 className={sideTitleStyle}>{features[nextIndex].title}</h3>
                        <p className={`${sideDescStyle} line-clamp-3`}>{features[nextIndex].desc}</p>
                    </div>
                </div>

                {/* Mobile Navigation Dots */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2 md:hidden">
                    {features.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${idx === activeIndex ? 'bg-[#2E5A34] w-6' : 'bg-slate-300'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
