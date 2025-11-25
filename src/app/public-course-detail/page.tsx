import { useParams, Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Clock, Calendar, BookOpen, CheckCircle2, Star, User } from 'lucide-react';
import '../landing.css';

// Mock data (duplicated from landing page for simplicity in this mockup)
const mockCourses = [
    {
        id: 1,
        code: 'IELTS-F-2024',
        name: 'IELTS Foundation',
        description: 'Khóa học chuyên sâu tập trung vào 4 kỹ năng, cam kết đầu ra 5.0+. Phù hợp cho người mới bắt đầu.',
        total_hours: 96,
        duration_weeks: 12,
        session_per_week: 3,
        level: 'Beginner',
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
        price: "5.000.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Pronunciation & Basic Grammar", duration: "4 weeks" },
            { title: "Phase 2: Listening & Reading Foundation", duration: "4 weeks" },
            { title: "Phase 3: Speaking & Writing Introduction", duration: "4 weeks" }
        ]
    },
    {
        id: 2,
        code: 'TOEIC-I-2024',
        name: 'TOEIC Intensive',
        description: 'Luyện thi TOEIC cấp tốc, tập trung giải đề và chiến thuật làm bài. Mục tiêu 700+.',
        total_hours: 72,
        duration_weeks: 9,
        session_per_week: 4,
        level: 'Intermediate',
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
        price: "4.500.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Vocabulary & Grammar Review", duration: "3 weeks" },
            { title: "Phase 2: Listening Strategies (Part 1-4)", duration: "3 weeks" },
            { title: "Phase 3: Reading Strategies (Part 5-7) & Mock Tests", duration: "3 weeks" }
        ]
    },
    {
        id: 3,
        code: 'IELTS-M-2024',
        name: 'IELTS Master',
        description: 'Chinh phục band điểm 7.5+ với giáo trình nâng cao và chấm chữa chi tiết từ chuyên gia.',
        total_hours: 120,
        duration_weeks: 15,
        session_per_week: 4,
        level: 'Advanced',
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        price: "8.000.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Advanced Writing Task 1 & 2", duration: "5 weeks" },
            { title: "Phase 2: Advanced Speaking & Idiomatic Expressions", duration: "5 weeks" },
            { title: "Phase 3: Intensive Practice & Mock Tests", duration: "5 weeks" }
        ]
    },
];

export default function PublicCourseDetailPage() {
    const { id } = useParams();
    const course = mockCourses.find(c => c.id === Number(id));

    if (!course) {
        return (
            <div className="min-h-screen bg-background text-foreground landing-container lp-flex lp-items-center lp-justify-between" style={{ justifyContent: 'center', flexDirection: 'column' }}>
                <h1 className="lp-h1">Khóa học không tồn tại</h1>
                <Link to="/" className="lp-btn lp-btn-primary">Về trang chủ</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground landing-container">
            {/* Header */}
            <header className="lp-header">
                <div className="lp-container lp-flex lp-justify-between lp-items-center">
                    <Link to="/" className="lp-logo">
                        <GraduationCap size={28} />
                        <span>TMS Academy</span>
                    </Link>
                    <nav className="lp-header-nav">
                        <Link to="/">Trang chủ</Link>
                        <Link to="/#courses">Chương trình</Link>
                        <Link to="/#consultation">Tư vấn</Link>
                    </nav>
                    <div className="lp-flex lp-items-center" style={{ gap: '1rem' }}>
                        <Link to="/login" className="lp-btn lp-btn-ghost">Đăng nhập</Link>
                        <a href="#register" className="lp-btn lp-btn-primary">
                            Đăng ký ngay <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                        </a>
                    </div>
                </div>
            </header>

            <main>
                {/* Course Hero */}
                <section className="lp-section" style={{ paddingBottom: '2rem', background: 'var(--lp-white)' }}>
                    <div className="lp-container">
                        <div className="lp-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
                            <div>
                                <span className="lp-section-tag">{course.level}</span>
                                <h1 className="lp-h1" style={{ fontSize: '2.5rem' }}>{course.name}</h1>
                                <p className="lp-subtitle" style={{ margin: '1rem 0 2rem' }}>{course.description}</p>

                                <div className="lp-flex" style={{ gap: '2rem', marginBottom: '2rem' }}>
                                    <div className="lp-flex lp-items-center" style={{ gap: '0.5rem' }}>
                                        <Clock size={20} color="var(--lp-accent)" />
                                        <span style={{ color: 'var(--lp-text)' }}>{course.total_hours} giờ</span>
                                    </div>
                                    <div className="lp-flex lp-items-center" style={{ gap: '0.5rem' }}>
                                        <Calendar size={20} color="var(--lp-accent)" />
                                        <span style={{ color: 'var(--lp-text)' }}>{course.duration_weeks} tuần</span>
                                    </div>
                                    <div className="lp-flex lp-items-center" style={{ gap: '0.5rem' }}>
                                        <BookOpen size={20} color="var(--lp-accent)" />
                                        <span style={{ color: 'var(--lp-text)' }}>{course.session_per_week} buổi/tuần</span>
                                    </div>
                                </div>

                                <div className="lp-flex" style={{ gap: '1rem' }}>
                                    <a href="#register" className="lp-btn lp-btn-primary lp-btn-lg">
                                        Đăng ký tư vấn
                                    </a>
                                </div>
                            </div>
                            <div>
                                <img src={course.image} alt={course.name} style={{ borderRadius: '24px', boxShadow: 'var(--lp-shadow-lg)' }} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Course Content */}
                <section className="lp-section">
                    <div className="lp-container">
                        <div className="lp-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '4rem' }}>

                            {/* Main Content */}
                            <div>
                                <h2 className="lp-h2" style={{ fontSize: '1.75rem' }}>Lộ trình học tập</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                                    {course.syllabus.map((phase, index) => (
                                        <div key={index} style={{ background: 'var(--lp-white)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--lp-border)' }}>
                                            <div className="lp-flex lp-justify-between lp-items-center" style={{ marginBottom: '0.5rem' }}>
                                                <h3 className="lp-h3" style={{ margin: 0 }}>{phase.title}</h3>
                                                <span className="lp-tag">{phase.duration}</span>
                                            </div>
                                            <p style={{ color: 'var(--lp-text-light)', margin: 0 }}>
                                                Nội dung chi tiết bao gồm các bài học lý thuyết và thực hành chuyên sâu.
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <h2 className="lp-h2" style={{ fontSize: '1.75rem', marginTop: '3rem' }}>Cam kết đầu ra</h2>
                                <ul style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
                                    <li className="lp-flex lp-items-center" style={{ gap: '0.75rem' }}>
                                        <CheckCircle2 size={20} style={{ color: 'var(--lp-success)' }} />
                                        <span style={{ color: 'var(--lp-text)' }}>Đạt mục tiêu điểm số cam kết</span>
                                    </li>
                                    <li className="lp-flex lp-items-center" style={{ gap: '0.75rem' }}>
                                        <CheckCircle2 size={20} style={{ color: 'var(--lp-success)' }} />
                                        <span style={{ color: 'var(--lp-text)' }}>Nắm vững kiến thức nền tảng và chuyên sâu</span>
                                    </li>
                                    <li className="lp-flex lp-items-center" style={{ gap: '0.75rem' }}>
                                        <CheckCircle2 size={20} style={{ color: 'var(--lp-success)' }} />
                                        <span style={{ color: 'var(--lp-text)' }}>Tự tin giao tiếp và sử dụng ngôn ngữ</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Sidebar */}
                            <div>
                                <div style={{ background: 'var(--lp-white)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--lp-border)', position: 'sticky', top: '100px' }}>
                                    <h3 className="lp-h3">Thông tin khóa học</h3>
                                    <div style={{ margin: '1.5rem 0', fontSize: '2rem', fontWeight: '700', color: 'var(--lp-primary)' }}>
                                        {course.price}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                        <div className="lp-flex lp-items-center" style={{ gap: '0.75rem' }}>
                                            <User size={20} color="var(--lp-text-light)" />
                                            <span style={{ color: 'var(--lp-text)' }}>Sĩ số: 10-15 học viên</span>
                                        </div>
                                        <div className="lp-flex lp-items-center" style={{ gap: '0.75rem' }}>
                                            <Star size={20} color="var(--lp-text-light)" />
                                            <span style={{ color: 'var(--lp-text)' }}>Đánh giá: 4.9/5.0</span>
                                        </div>
                                    </div>

                                    <a href="#register" className="lp-btn lp-btn-primary" style={{ width: '100%' }}>
                                        Đăng ký ngay
                                    </a>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Registration Form (Reused from Landing) */}
                <section id="register" className="lp-consultation lp-section">
                    <div className="lp-container lp-consultation-container">
                        <div className="lp-consultation-text">
                            <h2 className="lp-h2" style={{ color: 'white' }}>Đăng ký tư vấn khóa học này</h2>
                            <p className="lp-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                Để lại thông tin để nhận tư vấn chi tiết về lộ trình {course.name}.
                            </p>
                        </div>
                        <div className="lp-form-wrapper">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="lp-form-group">
                                    <label className="lp-form-label">Họ và tên</label>
                                    <input type="text" className="lp-form-input" placeholder="Nguyễn Văn A" required />
                                </div>
                                <div className="lp-form-group">
                                    <label className="lp-form-label">Email</label>
                                    <input type="email" className="lp-form-input" placeholder="email@example.com" required />
                                </div>
                                <div className="lp-form-group">
                                    <label className="lp-form-label">Số điện thoại</label>
                                    <input type="tel" className="lp-form-input" placeholder="0912 345 678" required />
                                </div>
                                <button type="submit" className="lp-btn lp-btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                    Gửi đăng ký
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

            </main>

            <footer className="lp-footer">
                <div className="lp-container lp-footer-content">
                    <div className="lp-flex lp-items-center" style={{ gap: '0.5rem' }}>
                        <GraduationCap size={24} />
                        <span style={{ fontWeight: 700, color: 'var(--lp-primary)' }}>TMS Academy</span>
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                        © 2025 TMS Academy. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
