import { Link } from "react-router-dom"
import "./landing.css"
import {

  CalendarDays,
  Layers3,
  Sparkles,
  Users2,
  MessageCircle,
  BookOpen,
  Cog,
  Phone,
  Mail,
  Facebook
} from "lucide-react"
import { FeedbackLoop } from "@/components/FeedbackLoop"
import { FeatureCarousel } from "@/components/FeatureCarousel"
import { LearningModes } from '@/components/LearningModes';
import { FeaturedCourses } from '@/components/FeaturedCourses';
import { Studywithpannacle } from '@/components/Studywithpannacle';
import { ConsultationForm } from '@/components/ConsultationForm';

const topBanner = new URL("../assets/Linhvat2.png", import.meta.url).href
const consultLogo = new URL("../assets/logo.png", import.meta.url).href
const centerImage = new URL("../assets/Trungtam1.png", import.meta.url).href


const featureCards = [
  {
    icon: <Sparkles size={24} />,
    title: "Tiết học vui và sinh động",
    desc: "Trò chơi, role-play và tình huống thực tế cho trẻ em, sinh viên, người đi làm."
  },
  {
    icon: <Layers3 size={24} />,
    title: "Lộ trình rõ ràng",
    desc: "Mục tiêu theo tuần/tháng, báo cáo tiến độ định kỳ cho phụ huynh hoặc học viên trưởng thành."
  },
  {
    icon: <CalendarDays size={24} />,
    title: "Lịch học linh hoạt",
    desc: "Ca học sáng - chiều - tối, lớp online hoặc tại trung tâm, phù hợp lịch bận rộn."
  },
  {
    icon: <Users2 size={24} />,
    title: "Nhóm nhỏ 1:6",
    desc: "Tương tác nhiều, giáo viên kèm sát để sửa phát âm kịp thời."
  }
]

const feedbacks = [
  {
    id: 1,
    name: "Cẩm Em",
    role: "Nhân viên văn phòng",
    quote:
      "Giờ học ngắn gọn, cuối buổi luôn có mini-quiz nên mình nhớ bài lâu và tự tin giao tiếp với khách nước ngoài hơn.",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 2,
    name: "Phạm Thị Hạnh",
    role: "Sinh viên năm nhất",
    quote:
      "Lớp nhỏ 1:6 nên được sửa phát âm từng câu. Bạn bè thân thiện, hoạt động nhóm vui và đỡ ngại nói hơn.",
    image: "https://images.unsplash.com/photo-1509099836639-18ba02e2e1ba?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 3,
    name: "Ngân Hà",
    role: "Sinh viên khoa tiếng Nhật",
    quote: "Mock test tăng 20 điểm sau 2 tháng nhờ lộ trình rõ ràng và bài tập sát đề.",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    highlight: true
  },
  {
    id: 4,
    name: "Trương Hồ Phương Thảo",
    role: "Phụ huynh học sinh lớp 8",
    quote: "Con hào hứng tham gia CLB nói tiếng Anh hàng tuần, về nhà chủ động kể lại câu chuyện bằng tiếng Anh.",
    image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 5,
    name: "Minh Khang",
    role: "Học sinh lớp 5",
    quote: "Role-play và sticker giúp con nói nhiều hơn, không còn sợ sai như trước.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 6,
    name: "Nguyễn Văn An",
    role: "Kỹ sư phần mềm",
    quote: "Môi trường học chuyên nghiệp, giáo viên bản ngữ nhiệt tình. Kỹ năng giao tiếp nâng rõ rệt sau 3 tháng.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
  }
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground landing-container">
      <header className="lp-header">
        <div className="lp-container lp-flex lp-justify-between lp-items-center">
          <Link to="/" className="lp-logo">
            <img
              src="/logo.jpg"
              alt="Anh ngữ Pinnacle"
              style={{ height: "2.5rem", width: "2.5rem", borderRadius: "50%", objectFit: "cover" }}
            />
            <span className="lp-logo-stack">
              <span className="lp-logo-text-primary">PINNACLE</span>
              <span className="lp-logo-text-secondary">English Center</span>
            </span>
          </Link>

          <nav className="lp-header-nav">
            <a href="#courses">Khóa học</a>
            <Link to="/schedule#schedule-info">Lịch khai giảng</Link>
            <a href="#feedback">Góc chia sẻ</a>
            <a href="#consultation">Tư vấn</a>
          </nav>

          <div className="lp-flex lp-items-center" style={{ gap: "1rem" }}>
            <Link to="/login" className="lp-btn lp-btn-primary lp-btn-regular">Đăng nhập</Link>
            <a href="#consultation" className="lp-btn lp-btn-primary lp-btn-regular">
              Đăng ký ngay
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="lp-top-banner" aria-label="Hình ảnh nổi bật">
          <div className="lp-top-banner-card">
            <div className="lp-top-banner-text">
              <p className="lp-banner-kicker">Tiếng Anh cho mọi lứa tuổi</p>
              <h1 className="lp-banner-title">DẠY TỪ TÂM, HỌC TỪ THÍCH, GIỎI TOÀN DIỆN!</h1>
              <p className="lp-banner-subtitle">
                Luôn thành tâm xem xét, quan tâm đến cảm nhận và sự tiến bộ từng ngày của học viên. Đề xuất những phương pháp tân tiến, khoa học và phù hợp nhất.
              </p>
              <a href="#courses" className="lp-btn lp-btn-primary lp-btn-banner">Xem khóa học</a>
            </div>
            <div className="lp-top-banner-image">
              <img src={topBanner} alt="Hai linh vật Pinnacle" className="lp-top-banner-image-combined" />
            </div>
          </div>
        </section>

        <section className="lp-banner-info">
          <div className="lp-banner-info-grid">
            <div className="lp-banner-info-item">
              <div className="lp-banner-info-icon">
                <MessageCircle size={20} />
              </div>
              <div>
                <div className="lp-banner-info-title">Giao tiếp</div>
                <div className="lp-banner-info-desc">Lộ trình khóa học giao tiếp được thiết kế bài bản với đội ngũ giáo viên uy tín.</div>
              </div>
            </div>
            <div className="lp-banner-info-item">
              <div className="lp-banner-info-icon">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="lp-banner-info-title">Luyện tập</div>
                <div className="lp-banner-info-desc">Hệ thống cung cấp tài liệu và video trực tuyến mỗi buổi học.</div>
              </div>
            </div>
            <div className="lp-banner-info-item">
              <div className="lp-banner-info-icon">
                <Cog size={20} />
              </div>
              <div>
                <div className="lp-banner-info-title">Kỹ năng</div>
                <div className="lp-banner-info-desc">Bốn kỹ năng Nghe, Nói, Đọc, Viết được sắp xếp theo từng buổi học.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white relative mb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left Column: Image */}
              <div className="relative z-10">
                <img
                  src={centerImage}
                  alt="Lớp học Pinnacle"
                  className="rounded-lg shadow-xl w-full h-[400px] object-cover"
                />
              </div>

              {/* Right Column: Text */}
              <div className="pt-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 uppercase leading-tight">
                  Lý do hàng ngàn học viên <br /> tìm đến Pinnacle
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  Với phương châm "Không có học sinh kém, chỉ có giáo viên chưa đủ giỏi", đội ngũ giáo viên tại
                  <span className="font-bold text-green-700"> Pinnacle </span>
                  luôn nỗ lực không ngừng nghỉ nâng cao, cải thiện và tinh giản giáo trình học sao cho phù hợp với người Việt Nam nhất,
                  biến Tiếng Anh trở nên thú vị, dễ hiểu với mọi đối tượng, nhất là đối với người bận rộn!
                </p>
              </div>
            </div>

            {/* Stats Card - Overlapping with Animation */}
            <div className="relative z-20 mt-[-60px] lg:mt-[-80px] mx-4 lg:mx-0">
              <div className="max-w-5xl mx-auto relative group transition-transform duration-300 hover:-translate-y-2">
                {/* Animated Border Background */}
                <div className="absolute -inset-[3px] rounded-2xl overflow-hidden">
                  <div className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#dcfce7_0%,#16a34a_50%,#dcfce7_100%)] animate-[spin_4s_linear_infinite]" />
                </div>

                {/* Main Card Content */}
                <div className="relative bg-green-50 rounded-2xl shadow-lg p-8 md:p-10 border border-green-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-green-200">
                    <div className="p-2">
                      <div className="text-4xl font-extrabold text-slate-900 mb-2">1,000</div>
                      <div className="text-slate-600 font-medium italic">Học viên tham gia khoá học</div>
                    </div>
                    <div className="p-2">
                      <div className="text-4xl font-extrabold text-slate-900 mb-2">720</div>
                      <div className="text-slate-600 font-medium italic">Học viên đạt chứng chỉ</div>
                    </div>
                    <div className="p-2">
                      <div className="text-4xl font-extrabold text-slate-900 mb-2">3</div>
                      <div className="text-slate-600 font-medium italic">Năm hoạt động</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-transparent">
          <FeatureCarousel features={featureCards} />
        </section>

        {/* Learning Modes Section */}
        <LearningModes />

        <FeaturedCourses />

        <section className="lp-section lp-feedback" id="feedback">
          <FeedbackLoop feedbacks={feedbacks} />
        </section>

        {/* Study with Pinnacle Section */}
        <Studywithpannacle />

        <section id="consultation" className="lp-consultation lp-section">
          <div className="lp-container lp-consultation-container">
            <div className="lp-consultation-text" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={consultLogo}
                alt="Pinnacle logo"
                style={{
                  width: "100%",
                  height: "auto",
                  filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.18))"
                }}
              />
            </div>

            <div className="lp-form-wrapper">
              <ConsultationForm />
            </div>
          </div>
        </section>
      </main>


      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <h2 className="text-3xl font-bold text-[#FFFFFF] uppercase">PINNACLE ENGLISH CENTER</h2>
            <div className="lp-footer-subtitle">
              Hệ thống Anh ngữ Luyện thi IELTS, TOEIC và Cambridge Cam kết chuẩn đầu ra
            </div>
          </div>

          <div className="lp-footer-grid">
            {/* Left Column: Locations */}
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <div className="lp-footer-col-title">PINNACLE HÀ NỘI</div>
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
                  <Mail size={18} /> tienganhpinnacle@gmail.com
                </div>
              </div>
              <div className="lp-footer-socials" style={{ justifyContent: 'flex-end' }}>
                <a href="https://www.facebook.com/anhngupinnacle" className="lp-social-icon" aria-label="Facebook">
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
  )
}
