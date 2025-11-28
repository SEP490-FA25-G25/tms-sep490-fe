import { Link } from 'react-router-dom';
import './landing.css';

// Icons (using Lucide React as it's already in the project)
import {
  ArrowRight,
  CheckCircle2,
  Users2,
  CalendarDays,
  Layers3,
  Star
} from 'lucide-react';

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
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
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
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80",
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
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground landing-container">
      {/* Header */}
      <header className="lp-header">
        <div className="lp-container lp-flex lp-justify-between lp-items-center">
          <Link to="/" className="lp-logo">
            <img
              src="/logo.jpg"
              alt="Anh ngữ Pinnacle"
              style={{ height: '2rem', width: 'auto' }}
            />
            <span>Anh ngữ Pinnacle</span>
          </Link>

          <nav className="lp-header-nav">
            <a href="#courses">Chương trình</a>
            <a href="#features">Ưu điểm</a>
            <a href="#consultation">Tư vấn</a>
          </nav>

          <div className="lp-flex lp-items-center" style={{ gap: '1rem' }}>
            <Link to="/login" className="lp-btn lp-btn-ghost">Đăng nhập</Link>
            <a href="#consultation" className="lp-btn lp-btn-primary">
              Đăng ký ngay <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="lp-hero">
          <div className="lp-container lp-hero-content">
            <div className="lp-hero-text">
              <span className="lp-section-tag">Đào tạo chuẩn quốc tế</span>
              <h1 className="lp-h1">Bứt phá giới hạn, chinh phục tương lai</h1>
              <p className="lp-subtitle">
                Hệ thống quản lý đào tạo và học tập toàn diện. Lộ trình cá nhân hóa giúp bạn đạt được mục tiêu nhanh chóng và hiệu quả.
              </p>

              <div className="lp-flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <a href="#consultation" className="lp-btn lp-btn-primary lp-btn-lg">
                  Tư vấn lộ trình
                </a>
                <a href="#courses" className="lp-btn lp-btn-outline lp-btn-lg">
                  Xem khóa học
                </a>
              </div>

              <div className="lp-hero-stats">
                <div className="lp-stat-card">
                  <span className="lp-stat-value">12k+</span>
                  <span className="lp-stat-label">Học viên</span>
                </div>
                <div className="lp-stat-card">
                  <span className="lp-stat-value">98%</span>
                  <span className="lp-stat-label">Hài lòng</span>
                </div>
                <div className="lp-stat-card">
                  <span className="lp-stat-value">50+</span>
                  <span className="lp-stat-label">Đối tác</span>
                </div>
              </div>
            </div>

            <div className="lp-hero-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                alt="Students learning"
                className="lp-hero-image"
              />
              <div className="lp-floating-badge">
                <div className="lp-flex lp-items-center" style={{ gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Star fill="#D4E157" color="#D4E157" size={20} />
                  <span style={{ fontWeight: 700 }}>4.9/5.0</span>
                </div>
                <span className="text-sm" style={{ color: 'var(--lp-text-light)' }}>Đánh giá từ học viên</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="lp-section" style={{ backgroundColor: 'var(--lp-white)' }}>
          <div className="lp-container">
            <div className="lp-section-header">
              <span className="lp-section-tag">Tại sao chọn chúng tôi</span>
              <h2 className="lp-h2">Giải pháp giáo dục toàn diện</h2>
              <p className="lp-subtitle">Chúng tôi cung cấp môi trường học tập hiện đại với công nghệ tiên tiến nhất.</p>
            </div>

            <div className="lp-features-grid">
              <div className="lp-feature-card">
                <div className="lp-feature-icon">
                  <Layers3 size={24} />
                </div>
                <h3 className="lp-h3">Lộ trình cá nhân hóa</h3>
                <p style={{ color: 'var(--lp-text-light)' }}>Thiết kế lộ trình học tập riêng biệt dựa trên năng lực và mục tiêu của từng học viên.</p>
              </div>
              <div className="lp-feature-card">
                <div className="lp-feature-icon">
                  <CalendarDays size={24} />
                </div>
                <h3 className="lp-h3">Lịch học linh hoạt</h3>
                <p style={{ color: 'var(--lp-text-light)' }}>Dễ dàng sắp xếp lịch học phù hợp với công việc và cuộc sống cá nhân.</p>
              </div>
              <div className="lp-feature-card">
                <div className="lp-feature-icon">
                  <Users2 size={24} />
                </div>
                <h3 className="lp-h3">Giảng viên hàng đầu</h3>
                <p style={{ color: 'var(--lp-text-light)' }}>Đội ngũ giảng viên giàu kinh nghiệm, tận tâm và có chứng chỉ quốc tế.</p>
              </div>
              <div className="lp-feature-card">
                <div className="lp-feature-icon">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="lp-h3">Cam kết đầu ra</h3>
                <p style={{ color: 'var(--lp-text-light)' }}>Cam kết chất lượng đào tạo và hỗ trợ học viên đạt được kết quả mong muốn.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="lp-section">
          <div className="lp-container">
            <div className="lp-section-header">
              <span className="lp-section-tag">Khóa học nổi bật</span>
              <h2 className="lp-h2">Chương trình đào tạo chuyên sâu</h2>
            </div>

            <div className="lp-courses-grid">
              {mockCourses.map((course) => (
                <Link to={`/courses/${course.id}`} key={course.id} className="lp-course-card">
                  <img src={course.image} alt={course.name} className="lp-course-image" />
                  <div className="lp-course-content">
                    <div className="lp-course-tags">
                      <span className="lp-tag">{course.level}</span>
                      <span className="lp-tag">{course.duration_weeks} tuần</span>
                    </div>
                    <h3 className="lp-h3">{course.name}</h3>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--lp-text-light)' }}>
                      {course.description}
                    </p>
                    <div className="lp-course-footer">
                      <span>{course.total_hours} giờ học</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Consultation Form Section */}
        <section id="consultation" className="lp-consultation lp-section">
          <div className="lp-container lp-consultation-container">
            <div className="lp-consultation-text">
              <span className="lp-section-tag" style={{ color: 'rgba(255,255,255,0.8)' }}>Đăng ký ngay</span>
              <h2 className="lp-h2" style={{ color: 'white' }}>Nhận tư vấn miễn phí</h2>
              <p className="lp-subtitle" style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                Để lại thông tin, đội ngũ tư vấn của chúng tôi sẽ liên hệ với bạn trong vòng 24h để xây dựng lộ trình học tập phù hợp nhất.
              </p>
              <ul style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li className="lp-flex lp-items-center" style={{ gap: '0.75rem' }}>
                  <CheckCircle2 size={20} style={{ color: '#4ade80' }} />
                  <span>Kiểm tra trình độ miễn phí</span>
                </li>
                <li className="lp-flex lp-items-center" style={{ gap: '0.75rem' }}>
                  <CheckCircle2 size={20} style={{ color: '#4ade80' }} />
                  <span>Học thử 2 buổi trải nghiệm</span>
                </li>
                <li className="lp-flex lp-items-center" style={{ gap: '0.75rem' }}>
                  <CheckCircle2 size={20} style={{ color: '#4ade80' }} />
                  <span>Ưu đãi học phí lên đến 30%</span>
                </li>
              </ul>
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

                <div className="lp-form-group">
                  <label className="lp-form-label">Nhu cầu tư vấn</label>
                  <select className="lp-form-select" defaultValue="">
                    <option value="" disabled>Chọn khóa học bạn quan tâm</option>
                    {mockCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
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
        <div className="lp-container lp-footer-content">
          <div className="lp-flex lp-items-center" style={{ gap: '0.5rem' }}>
            <img
              src="/logo.jpg"
              alt="Anh ngữ Pinnacle"
              style={{ height: '1.5rem', width: 'auto' }}
            />
            <span style={{ fontWeight: 700, color: 'var(--lp-primary)' }}>Anh ngữ Pinnacle</span>
          </div>

          <div className="lp-footer-links">
            <a href="#">Về chúng tôi</a>
            <a href="#">Điều khoản</a>
            <a href="#">Chính sách bảo mật</a>
            <a href="#">Liên hệ</a>
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            © 2025 Anh ngữ Pinnacle. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
