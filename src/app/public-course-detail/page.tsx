
import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Clock,
    Calendar,
    BookOpen,
    CheckCircle2,
    Mail,
    Facebook,
    Phone,
    MessageCircle
} from 'lucide-react';
import '../landing.css';
import { Studywithpannacle } from '@/components/Studywithpannacle';

// Image imports
const consultLogo = new URL('../../assets/logo.png', import.meta.url).href;
const cambridgeStartersImg = new URL('../../assets/Linhvat9.png', import.meta.url).href;
const cambridgeMoversImg = new URL('../../assets/Linhvat13.png', import.meta.url).href;
const cambridgeFlyersImg = new URL('../../assets/Linhvat12.png', import.meta.url).href;
const ieltsFoundationImg = new URL('../../assets/Linhvat14.png', import.meta.url).href;
const ieltsIntermediateImg = new URL('../../assets/Linhvat15.png', import.meta.url).href;
const ieltsAdvancedImg = new URL('../../assets/Linhvat16.png', import.meta.url).href;
const toeic800Img = new URL('../../assets/Linhvat17.png', import.meta.url).href;
const toeic650Img = new URL('../../assets/Linhvat18.png', import.meta.url).href;
const toeic450Img = new URL('../../assets/Linhvat19.png', import.meta.url).href;

const coursesData = [
    // IELTS
    {
        id: 'ielts-foundation',
        code: 'IELTS-F-2024',
        name: 'IELTS Foundation',
        description: 'Xây dựng nền tảng vững chắc cho người mới bắt đầu, tập trung vào ngữ pháp và từ vựng cốt lõi.',
        total_hours: 48,
        duration_weeks: 12,
        session_per_week: 2,
        level: 'Beginner (0 - 3.5)',
        image: ieltsFoundationImg,
        price: "5.000.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Pronunciation & Basic Grammar", duration: "4 tuần" },
            { title: "Phase 2: Listening & Reading Foundation", duration: "4 tuần" },
            { title: "Phase 3: Speaking & Writing Introduction", duration: "4 tuần" }
        ]
    },
    {
        id: 'ielts-intermediate',
        code: 'IELTS-I-2024',
        name: 'IELTS Intermediate',
        description: 'Phát triển toàn diện 4 kỹ năng, làm quen với các dạng bài thi IELTS và chiến thuật làm bài.',
        total_hours: 64,
        duration_weeks: 16,
        session_per_week: 2,
        level: 'Intermediate (3.5 - 5.5)',
        image: ieltsIntermediateImg,
        price: "7.000.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Skill Development", duration: "5 tuần" },
            { title: "Phase 2: Exam Strategies", duration: "5 tuần" },
            { title: "Phase 3: Intensive Practice", duration: "6 tuần" }
        ]
    },
    {
        id: 'ielts-advanced',
        code: 'IELTS-A-2024',
        name: 'IELTS Advanced',
        description: 'Luyện đề chuyên sâu, nâng cao kỹ năng Speaking và Writing để đạt band điểm cao.',
        total_hours: 48,
        duration_weeks: 12,
        session_per_week: 2,
        level: 'Advanced (6.0+)',
        image: ieltsAdvancedImg,
        price: "9.000.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Advanced Writing", duration: "4 tuần" },
            { title: "Phase 2: Advanced Speaking", duration: "4 tuần" },
            { title: "Phase 3: Mock Tests & Feedback", duration: "4 tuần" }
        ]
    },
    // TOEIC
    {
        id: 'toeic-450',
        code: 'TOEIC-450-2024',
        name: 'TOEIC 450+ Mục tiêu',
        description: 'Lấy lại căn bản và đạt mục tiêu 450+ TOEIC cho sinh viên và người đi làm.',
        total_hours: 40,
        duration_weeks: 10,
        session_per_week: 2,
        level: 'Basic',
        image: toeic450Img,
        price: "3.500.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Vocabulary Building", duration: "3 tuần" },
            { title: "Phase 2: Grammar Review", duration: "3 tuần" },
            { title: "Phase 3: Basic Listening & Reading", duration: "4 tuần" }
        ]
    },
    {
        id: 'toeic-650',
        code: 'TOEIC-650-2024',
        name: 'TOEIC 650+ Bứt phá',
        description: 'Nâng cao kỹ năng nghe đọc, chinh phục mốc 650+ để mở rộng cơ hội nghề nghiệp.',
        total_hours: 48,
        duration_weeks: 12,
        session_per_week: 2,
        level: 'Intermediate',
        image: toeic650Img,
        price: "4.500.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Listening Strategies", duration: "4 tuần" },
            { title: "Phase 2: Reading Comprehension", duration: "4 tuần" },
            { title: "Phase 3: Full Tests", duration: "4 tuần" }
        ]
    },
    {
        id: 'toeic-800',
        code: 'TOEIC-800-2024',
        name: 'TOEIC 800+ Master',
        description: 'Chinh phục điểm số tuyệt đối với các kỹ năng nâng cao và kho đề thi phong phú.',
        total_hours: 48,
        duration_weeks: 12,
        session_per_week: 2,
        level: 'Advanced',
        image: toeic800Img,
        price: "5.500.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Advanced Vocabulary", duration: "4 tuần" },
            { title: "Phase 2: Speed Reading & Listening", duration: "4 tuần" },
            { title: "Phase 3: Exam Simulation", duration: "4 tuần" }
        ]
    },
    // CAMBRIDGE
    {
        id: 'cambridge-starters',
        code: 'CAM-S-2024',
        name: 'Starters (Pre-A1)',
        description: 'Khơi dậy niềm đam mê tiếng Anh cho trẻ em qua các hoạt động vui nhộn và hình ảnh sinh động.',
        total_hours: 48,
        duration_weeks: 12,
        session_per_week: 2,
        level: 'Kids',
        image: cambridgeStartersImg,
        price: "3.000.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Alphabet & Numbers", duration: "4 tuần" },
            { title: "Phase 2: Basic Vocabulary", duration: "4 tuần" },
            { title: "Phase 3: Simple Sentences", duration: "4 tuần" }
        ]
    },
    {
        id: 'cambridge-movers',
        code: 'CAM-M-2024',
        name: 'Movers (A1)',
        description: 'Xây dựng vốn từ vựng và ngữ pháp cơ bản, giúp trẻ tự tin sử dụng tiếng Anh trong các tình huống đơn giản.',
        total_hours: 64,
        duration_weeks: 16,
        session_per_week: 2,
        level: 'Kids',
        image: cambridgeMoversImg,
        price: "3.500.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Grammar Expansion", duration: "5 tuần" },
            { title: "Phase 2: Storytelling", duration: "5 tuần" },
            { title: "Phase 3: Movers Practice Tests", duration: "6 tuần" }
        ]
    },
    {
        id: 'cambridge-flyers',
        code: 'CAM-F-2024',
        name: 'Flyers (A2)',
        description: 'Hoàn thiện kỹ năng ngôn ngữ, chuẩn bị hành trang vững chắc cho các cấp độ tiếng Anh cao hơn.',
        total_hours: 64,
        duration_weeks: 16,
        session_per_week: 2,
        level: 'Teens',
        image: cambridgeFlyersImg,
        price: "4.000.000 VNĐ",
        syllabus: [
            { title: "Phase 1: Advanced Grammar", duration: "5 tuần" },
            { title: "Phase 2: Writing Skills", duration: "5 tuần" },
            { title: "Phase 3: Flyers Practice Tests", duration: "6 tuần" }
        ]
    }
];

export default function PublicCourseDetailPage() {
    const { id } = useParams();
    const course = coursesData.find(c => c.id === id);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

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
                        <img
                            src="/logo.jpg"
                            alt="Hệ thống TMS"
                            style={{ height: "2.5rem", width: "2.5rem", borderRadius: "50%", objectFit: "cover" }}
                        />
                        <span className="lp-logo-stack">
                            <span className="lp-logo-text-primary">TMS</span>
                            <span className="lp-logo-text-secondary">Training Management System</span>
                        </span>
                    </Link>

                    <nav className="lp-header-nav">
                        <Link to="/#courses">Khóa học</Link>
                        <Link to="/schedule#schedule-info">Lịch khai giảng</Link>
                        <Link to="/#feedback">Góc chia sẻ</Link>
                        <Link to="/#consultation">Tư vấn</Link>
                    </nav>

                    <div className="lp-flex lp-items-center" style={{ gap: '1rem' }}>
                        <Link to="/login" className="lp-btn lp-btn-primary lp-btn-regular">Đăng nhập</Link>
                        <a href="#register" className="lp-btn lp-btn-primary lp-btn-regular">
                            Đăng ký ngay
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
                                <h2 className="lp-h2" style={{ fontSize: '1.75rem' }}>LỘ TRÌNH HỌC TẬP</h2>
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

                                <h2 className="lp-h2" style={{ fontSize: '1.75rem', marginTop: '3rem' }}>CAM KẾT CHUẨN ĐẦU RA</h2>
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

                        </div>
                    </div>
                </section>

                {/* Studywithpannacle Section */}
                <Studywithpannacle />

                {/* Registration Form (Reused from Landing) */}
                <section id="register" className="lp-consultation lp-section">
                    <div className="lp-container lp-consultation-container">
                        <div className="lp-consultation-text" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <img
                                src={consultLogo}
                                alt="TMS logo"
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.18))"
                                }}
                            />
                        </div>

                        <div className="lp-form-wrapper">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="lp-form-group">
                                    <label className="lp-form-label">Họ và tên</label>
                                    <input type="text" className="lp-form-input" placeholder="Nguyễn Thu Hà" required />
                                </div>

                                <div className="lp-form-group">
                                    <label className="lp-form-label">Email</label>
                                    <input type="email" className="lp-form-input" placeholder="email@example.com" required />
                                </div>

                                <div className="lp-form-group">
                                    <label className="lp-form-label">Số điện thoại</label>
                                    <input type="tel" className="lp-form-input" placeholder="0912 345 678" required />
                                </div>

                                <div className="lp-form-group">
                                    <label className="lp-form-label">Chọn khóa học quan tâm</label>
                                    <select
                                        className="lp-form-select"
                                        defaultValue={course.id.includes('ielts') ? 'ielts' : course.id.includes('toeic') ? 'toeic' : course.id.includes('cambridge') ? 'cambridge' : 'other'}
                                    >
                                        <option value="" disabled>Chọn khóa học</option>
                                        <option value="ielts">IELTS Foundation / Intermediate / Advanced</option>
                                        <option value="toeic">TOEIC 450+ / 650+ / 800+</option>
                                        <option value="cambridge">Cambridge Starters / Movers / Flyers</option>
                                        <option value="giao-tiep">Tiếng Anh Giao Tiếp</option>
                                        <option value="other">Khác</option>
                                    </select>
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
                <div className="lp-container">
                    <div className="lp-footer-top">
                        <h2 className="text-3xl font-bold text-[#FFFFFF] uppercase">TMS - TRAINING MANAGEMENT SYSTEM</h2>
                        <div className="lp-footer-subtitle">
                            Hệ thống Anh ngữ Luyện thi IELTS, TOEIC và Cambridge Cam kết chuẩn đầu ra
                        </div>
                    </div>

                    <div className="lp-footer-grid">
                        {/* Left Column: Locations */}
                        <div>
                            <div style={{ marginBottom: '2rem' }}>
                                <div className="lp-footer-col-title">TMS HÀ NỘI</div>
                                <ul className="lp-footer-list">
                                    <li>• CS1: Số 34, Hoàng Cầu, Phường Ô Chợ Dừa, Quận Đống Đa</li>
                                    <li>• CS2: 96A, Trần Phú, Phường Mộ Lao, Quận Hà Đông</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right Column: Contact */}
                        <div style={{ textAlign: 'right' }}>
                            <div className="lp-footer-col-title">LIÊN HỆ VỚI CHÚNG TÔI</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <div className="lp-footer-contact-item">
                                    <Phone size={18} /> 0913 321 564
                                </div>
                                <div className="lp-footer-contact-item">
                                    <Phone size={18} /> 0977 727 721
                                </div>
                                <div className="lp-footer-contact-item">
                                    <Mail size={18} /> support@tms.edu.vn
                                </div>
                            </div>
                            <div className="lp-footer-socials" style={{ justifyContent: 'flex-end' }}>
                                <a href="https://www.facebook.com/tms.training" className="lp-social-icon" aria-label="Facebook">
                                    <Facebook size={20} />
                                </a>
                                <a href="https://www.facebook.com/messages/t/108208812194521" className="lp-social-icon" aria-label="Messenger">
                                    <MessageCircle size={20} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
