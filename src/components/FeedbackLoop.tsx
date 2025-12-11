import { useState, useEffect, useCallback } from 'react';
import { Quote, ArrowLeft, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Feedback {
    id: number;
    name: string;
    role: string;
    quote: string;
    image: string;
    color?: string;
}

interface FeedbackLoopProps {
    feedbacks: Feedback[];
}

export function FeedbackLoop({ feedbacks }: FeedbackLoopProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Assign colors cyclically - Blue/Cyan/Purple tones as requested
    const colors = ['#D4E787', '#8CE2DA', '#A7E7CB', '#A6E4FF']; // Blue, Sky, Purple, Indigo

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % feedbacks.length);
    }, [feedbacks.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + feedbacks.length) % feedbacks.length);
    };

    // Auto-play
    useEffect(() => {
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [nextSlide]);

    return (
        <div className="w-full max-w-[1400px] mx-auto py-16 px-4">
            <div className="flex flex-col lg:flex-row items-center min-h-[500px]">

                {/* Left Section - Title (Wider and Bigger) */}
                <div className="lg:w-[45%] relative z-0">
                    {/* Background Extender - Goes to left edge */}
                    <div className="absolute inset-y-0 right-0 w-[100vw] bg-[#1A3320] rounded-r-[40px] shadow-2xl z-0">
                        {/* Decorative Texture */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                        </div>
                    </div>

                    {/* Content Container */}
                    <div className="relative z-10 p-12 md:p-16 text-white w-full h-full min-h-[500px] flex flex-col justify-center">
                        <h2 className="text-4xl md:text-5xl font-bold uppercase leading-tight mb-6">
                            Cảm nhận <br /> học viên
                        </h2>
                        <p className="font-medium text-lg opacity-90 mb-10 max-w-md">
                            Những chia sẻ chân thực nhất từ các bạn học viên đã và đang theo học tại trung tâm.
                        </p>

                        {/* Navigation Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={prevSlide}
                                className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border-2 border-white"
                            >
                                <ArrowLeft size={28} />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="w-14 h-14 rounded-full bg-white text-[#1A3320] flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                                <ArrowRight size={28} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Section - Carousel (Overlapping) */}
                <div className="lg:w-[65%] overflow-hidden relative flex items-center py-8 -mt-10 lg:-mt-0 lg:-ml-24 z-10">
                    <div
                        className="flex gap-8 transition-transform duration-500 ease-out will-change-transform pl-4"
                        style={{ transform: `translateX(-${currentIndex * 340}px)` }}
                    >
                        {feedbacks.map((fb, index) => {
                            const color = colors[index % colors.length];
                            return (
                                <div
                                    key={fb.id}
                                    className="flex-shrink-0 w-[320px] md:w-[360px] min-h-[450px] rounded-3xl p-10 flex flex-col justify-between text-white shadow-2xl transition-transform hover:-translate-y-2 duration-300"
                                    style={{ backgroundColor: color }}
                                >
                                    <div>
                                        <Quote size={56} className="mb-6 opacity-40 fill-current" />
                                        <p className="text-xl font-medium leading-relaxed mb-6">
                                            "{fb.quote}"
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/20">
                                        <Avatar className="w-14 h-14 border-2 border-white/50 bg-white/10 flex-shrink-0">
                                            <AvatarImage src={fb.image} alt={fb.name} className="object-cover" />
                                            <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                                                {fb.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold text-lg">{fb.name}</h4>
                                            <p className="text-sm opacity-90">{fb.role}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Gradient Fade on Right Edge */}
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#f6f8f5] to-transparent pointer-events-none z-20"></div>
                </div>
            </div>
        </div>
    );
}
