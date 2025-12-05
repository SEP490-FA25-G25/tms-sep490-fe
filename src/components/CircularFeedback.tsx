import { useState, useEffect, useRef } from 'react';

interface Feedback {
    id: number;
    name: string;
    role: string;
    quote: string;
    image: string;
    highlight?: boolean;
}

interface CircularFeedbackProps {
    feedbacks: Feedback[];
}

export function CircularFeedback({ feedbacks }: CircularFeedbackProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [rotation, setRotation] = useState(0);
    const rotationRef = useRef(0);

    // Configuration
    const radius = 280; // Reduced radius to prevent top/bottom cut-off
    const totalItems = feedbacks.length;
    const anglePerItem = 360 / totalItems;

    // Calculate rotation to bring active index to 0 degrees (Right side)
    useEffect(() => {
        // Target angle for the active item is 0 degrees.
        // The item is originally at: index * anglePerItem
        // So we need to rotate by: - (index * anglePerItem)

        const targetAngle = - (activeIndex * anglePerItem);

        // Shortest path calculation
        const current = rotationRef.current;

        // We want to rotate to `targetAngle`.
        // But we want to find the equivalent target that is closest to current.
        const normalizedTarget = targetAngle;

        // Calculate the closest target rotation
        const closestTarget = Math.round((current - normalizedTarget) / 360) * 360 + normalizedTarget;

        setRotation(closestTarget);
        rotationRef.current = closestTarget;

    }, [activeIndex, anglePerItem]);

    const handleItemClick = (index: number) => {
        setActiveIndex(index);
    };

    return (
        <div className="relative w-full h-[600px] overflow-hidden flex items-center bg-transparent">

            {/* The Wheel Container - Positioned on the LEFT */}
            <div
                className="absolute top-1/2 transition-transform duration-700 ease-out will-change-transform"
                style={{
                    left: '-280px', // Half-circle effect
                    width: `${radius * 2}px`,
                    height: `${radius * 2}px`,
                    transform: `translate(0, -50%) rotate(${rotation}deg)`
                }}
            >
                {/* The Circle Border */}
                <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500/30 pointer-events-none" />

                {/* Items */}
                {feedbacks.map((fb, index) => {
                    const placementAngle = index * anglePerItem;
                    const rad = (placementAngle * Math.PI) / 180;
                    const x = radius + radius * Math.cos(rad);
                    const y = radius + radius * Math.sin(rad);

                    const isActive = index === activeIndex;

                    return (
                        <div
                            key={fb.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                            style={{
                                left: `${x}px`,
                                top: `${y}px`,
                            }}
                            onClick={() => handleItemClick(index)}
                        >
                            {/* Container for Avatar + Card */}
                            <div
                                className="relative flex items-center"
                                style={{
                                    transform: `rotate(${-rotation}deg)`, // Counter-rotate to keep horizontal
                                    transformOrigin: 'center center'
                                }}
                            >
                                {/* Avatar */}
                                <div
                                    className={`relative rounded-full overflow-hidden border-2 transition-all duration-300 shadow-md bg-white flex-shrink-0
                                        ${isActive ? 'w-20 h-20 border-emerald-600 scale-110' : 'w-14 h-14 border-emerald-200 opacity-80 hover:opacity-100'}
                                    `}
                                >
                                    <img
                                        src={fb.image}
                                        alt={fb.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Attached Card */}
                                <div
                                    className={`ml-4 transition-all duration-500 ease-out rounded-xl shadow-sm border
                                        ${isActive
                                            ? 'bg-[#4ade80] border-[#4ade80] text-white p-6 w-[400px] scale-100 opacity-100 z-20 shadow-xl'
                                            : 'bg-white border-emerald-100 text-emerald-800 p-3 w-[200px] scale-95 opacity-80 hover:opacity-100 hover:scale-100 z-10'
                                        }
                                    `}
                                >
                                    <h4 className={`font-bold ${isActive ? 'text-lg' : 'text-sm'}`}>
                                        {fb.name}
                                    </h4>
                                    <p className={`font-medium ${isActive ? 'text-emerald-50 text-sm mb-2' : 'text-slate-500 text-xs'}`}>
                                        {fb.role}
                                    </p>

                                    {isActive && (
                                        <p className="text-sm leading-relaxed border-t border-white/20 pt-2">
                                            "{fb.quote}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
