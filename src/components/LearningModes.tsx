
const onlineImage = new URL("../assets/Linhvat20.png", import.meta.url).href;

const offlineImage = new URL("../assets/Linhvat21.png", import.meta.url).href;

export function LearningModes() {
    return (
        <section className="py-20 bg-transparent overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">

                {/* ONLINE SECTION */}
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-20">
                    {/* Image (Left) */}
                    <div className="w-full md:w-1/2">
                        <div className="relative rounded-[32px] overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                            <img
                                src={onlineImage}
                                alt="Online Learning"
                                className="w-full h-[300px] md:h-[400px] object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                    </div>

                    {/* Content (Right) */}
                    <div className="w-full md:w-1/2 flex flex-col items-start">
                        <h2
                            className="text-6xl md:text-8xl font-bold text-transparent mb-8 select-none"
                            style={{ WebkitTextStroke: '2px #2E5A34' }}
                        >
                            ONLINE
                        </h2>

                        <div className="flex flex-col gap-4 w-full max-w-md">
                            <div className="bg-[#d9f99d] text-[#1A3320] px-8 py-4 rounded-2xl font-bold text-lg border-b-4 border-[#1A3320] active:border-b-0 active:translate-y-1 transition-all cursor-pointer uppercase tracking-wide text-center md:text-left">
                                TIẾNG ANH ONLINE
                            </div>
                            <div className="bg-[#d9f99d] text-[#1A3320] px-8 py-4 rounded-2xl font-bold text-lg border-b-4 border-[#1A3320] active:border-b-0 active:translate-y-1 transition-all cursor-pointer uppercase tracking-wide text-center md:text-left">
                                DÀNH CHO NGƯỜI BẬN RỘN
                            </div>
                        </div>
                    </div>
                </div>

                {/* OFFLINE SECTION */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16">
                    {/* Image (Right) */}
                    <div className="w-full md:w-1/2">
                        <div className="relative rounded-[32px] overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                            <img
                                src={offlineImage}
                                alt="Offline Learning"
                                className="w-full h-[300px] md:h-[400px] object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                    </div>

                    {/* Content (Left) */}
                    <div className="w-full md:w-1/2 flex flex-col items-end">
                        <h2
                            className="text-6xl md:text-8xl font-bold text-transparent mb-8 select-none text-right"
                            style={{ WebkitTextStroke: '2px #2E5A34' }}
                        >
                            OFFLINE
                        </h2>

                        <div className="flex flex-col gap-4 w-full max-w-md items-end">
                            <div className="bg-[#d9f99d] text-[#1A3320] px-8 py-4 rounded-2xl font-bold text-lg border-b-4 border-[#1A3320] active:border-b-0 active:translate-y-1 transition-all cursor-pointer uppercase tracking-wide text-center md:text-right w-full">
                                TIẾNG ANH OFFLINE
                            </div>
                            <div className="bg-[#d9f99d] text-[#1A3320] px-8 py-4 rounded-2xl font-bold text-lg border-b-4 border-[#1A3320] active:border-b-0 active:translate-y-1 transition-all cursor-pointer uppercase tracking-wide text-center md:text-right w-full">
                                HỌC TRỰC TIẾP VỚI GIÁO VIÊN KINH NGHIỆM
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
