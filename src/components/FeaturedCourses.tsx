import { useState } from 'react';
import { ArrowRight, BookOpen, Clock, Star, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Define course categories
type Category = 'IELTS' | 'TOEIC' | 'CAMBRIDGE';

// Define course interface
interface Course {
    id: string;
    name: string;
    description: string;
    level: string;
    duration: string;
    lessons: number;
    rating: number;
    image: string;
    features: string[];
}

const cambridgeStartersImg = new URL('../assets/Linhvat9.png', import.meta.url).href;

const cambridgeMoversImg = new URL('../assets/Linhvat13.png', import.meta.url).href;

const cambridgeFlyersImg = new URL('../assets/Linhvat12.png', import.meta.url).href;

const ieltsFoundationImg = new URL('../assets/Linhvat14.png', import.meta.url).href;

const ieltsIntermediateImg = new URL('../assets/Linhvat15.png', import.meta.url).href;

const ieltsAdvancedImg = new URL('../assets/Linhvat16.png', import.meta.url).href;

const toeic800Img = new URL('../assets/Linhvat17.png', import.meta.url).href;

const toeic650Img = new URL('../assets/Linhvat18.png', import.meta.url).href;

const toeic450Img = new URL('../assets/Linhvat19.png', import.meta.url).href;

// Mock data for each category
const coursesData: Record<Category, Course[]> = {
    'IELTS': [
        {
            id: 'ielts-foundation',
            name: 'IELTS Foundation',
            description: 'Xây dựng nền tảng vững chắc cho người mới bắt đầu, tập trung vào ngữ pháp và từ vựng cốt lõi.',
            level: 'Beginner (0 - 3.5)',
            duration: '3 tháng',
            lessons: 24,
            rating: 4.8,
            image: ieltsFoundationImg,
            features: ['Ngữ pháp căn bản', 'Phát âm chuẩn IPA', 'Từ vựng chủ đề']
        },
        {
            id: 'ielts-intermediate',
            name: 'IELTS Intermediate',
            description: 'Phát triển toàn diện 4 kỹ năng, làm quen với các dạng bài thi IELTS và chiến thuật làm bài.',
            level: 'Intermediate (3.5 - 5.5)',
            duration: '4 tháng',
            lessons: 32,
            rating: 4.9,
            image: ieltsIntermediateImg,
            features: ['4 kỹ năng chuyên sâu', 'Luyện đề cơ bản', 'Sửa bài Writing 1-1']
        },
        {
            id: 'ielts-advanced',
            name: 'IELTS Advanced',
            description: 'Luyện đề chuyên sâu, nâng cao kỹ năng Speaking và Writing để đạt band điểm cao.',
            level: 'Advanced (6.0+)',
            duration: '3 tháng',
            lessons: 24,
            rating: 5.0,
            image: ieltsAdvancedImg,
            features: ['Chiến thuật Band 7+', 'Mock test hàng tuần', 'Sửa bài chi tiết']
        }
    ],
    'TOEIC': [
        {
            id: 'toeic-450',
            name: 'TOEIC 450+ Mục tiêu',
            description: 'Lấy lại căn bản và đạt mục tiêu 450+ TOEIC cho sinh viên và người đi làm.',
            level: 'Basic',
            duration: '2.5 tháng',
            lessons: 20,
            rating: 4.7,
            image: toeic450Img,
            features: ['Mẹo làm bài nhanh', 'Từ vựng TOEIC', 'Nghe hiểu căn bản']
        },
        {
            id: 'toeic-650',
            name: 'TOEIC 650+ Bứt phá',
            description: 'Nâng cao kỹ năng nghe đọc, chinh phục mốc 650+ để mở rộng cơ hội nghề nghiệp.',
            level: 'Intermediate',
            duration: '3 tháng',
            lessons: 24,
            rating: 4.8,
            image: toeic650Img,
            features: ['Luyện đề sát thực tế', 'Tối ưu thời gian', 'Phân tích lỗi sai']
        },
        {
            id: 'toeic-800',
            name: 'TOEIC 800+ Master',
            description: 'Chinh phục điểm số tuyệt đối với các kỹ năng nâng cao và kho đề thi phong phú.',
            level: 'Advanced',
            duration: '3 tháng',
            lessons: 24,
            rating: 4.9,
            image: toeic800Img,
            features: ['Full test áp lực cao', 'Vocabulary nâng cao', 'Tips đạt điểm tối đa']
        }
    ],
    'CAMBRIDGE': [
        {
            id: 'cambridge-starters',
            name: 'Starters (Pre-A1)',
            description: 'Khơi dậy niềm đam mê tiếng Anh cho trẻ em qua các hoạt động vui nhộn và hình ảnh sinh động.',
            level: 'Kids',
            duration: '3 tháng',
            lessons: 24,
            rating: 4.9,
            image: cambridgeStartersImg,
            features: ['Học qua trò chơi', 'Phát âm tự nhiên', 'Tự tin giao tiếp']
        },
        {
            id: 'cambridge-movers',
            name: 'Movers (A1)',
            description: 'Xây dựng vốn từ vựng và ngữ pháp cơ bản, giúp trẻ tự tin sử dụng tiếng Anh trong các tình huống đơn giản.',
            level: 'Kids',
            duration: '4 tháng',
            lessons: 32,
            rating: 4.8,
            image: cambridgeMoversImg,
            features: ['Giao tiếp phản xạ', 'Kể chuyện tiếng Anh', 'Chuẩn bị thi Movers']
        },
        {
            id: 'cambridge-flyers',
            name: 'Flyers (A2)',
            description: 'Hoàn thiện kỹ năng ngôn ngữ, chuẩn bị hành trang vững chắc cho các cấp độ tiếng Anh cao hơn.',
            level: 'Teens',
            duration: '4 tháng',
            lessons: 32,
            rating: 4.9,
            image: cambridgeFlyersImg,
            features: ['Thuyết trình cơ bản', 'Viết đoạn văn', 'Chứng chỉ Flyers']
        }
    ]
};

export function FeaturedCourses() {
    const [activeCategory, setActiveCategory] = useState<Category>('IELTS');

    return (
        <section id="courses" className="py-20 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        LỘ TRÌNH HỌC TẬP CHUẨN QUỐC TẾ
                    </h2>
                </div>

                {/* Category Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex bg-white p-1.5 rounded-2xl shadow-md border border-slate-100 gap-2">
                        {(Object.keys(coursesData) as Category[]).map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-6 py-3 rounded-xl text-sm md:text-base font-bold transition-all duration-300 ${activeCategory === category
                                    ? 'bg-[#1A3320] text-white shadow-lg transform scale-105'
                                    : 'bg-[#D4E787] text-slate-900 hover:bg-[#c3d875] hover:shadow-md'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {coursesData[activeCategory].map((course) => (
                        <div key={course.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group border border-slate-100 flex flex-col h-full">
                            {/* Course Image */}
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src={course.image}
                                    alt={course.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute bottom-4 left-4 bg-[#1A3320]/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                                    {course.level}
                                </div>
                            </div>

                            {/* Course Content */}
                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                                    {course.name}
                                </h3>
                                <p className="text-slate-600 text-sm mb-6 line-clamp-2 flex-grow">
                                    {course.description}
                                </p>

                                {/* Features List */}
                                <div className="space-y-2 mb-6">
                                    {course.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                                            <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-slate-100 w-full mb-4"></div>

                                {/* Footer Info */}
                                <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={16} />
                                        <span>{course.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen size={16} />
                                        <span>{course.lessons} buổi</span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Link
                                    to={`/courses/${course.id}`}
                                    className="w-full py-3 rounded-xl bg-[#D4E787] text-slate-900 font-bold flex items-center justify-center gap-2 group-hover:bg-[#1A3320] group-hover:text-white transition-all duration-300"
                                >
                                    Xem chi tiết
                                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
