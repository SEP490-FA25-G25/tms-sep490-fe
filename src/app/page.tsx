import { Link } from "react-router-dom"
import "./landing.css"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { getDefaultRouteForUser } from "@/utils/role-routes"
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
import { ConsultationForm } from '@/components/ConsultationForm';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut } from "lucide-react";

const topBanner = new URL("../assets/Linhvat2.png", import.meta.url).href
const consultLogo = new URL("../assets/TMS1.png", import.meta.url).href
const centerImage = new URL("../assets/3 con linh vật.png", import.meta.url).href


const featureCards = [
  {
    icon: <Sparkles size={24} />,
    title: "Tiết học vui và sinh động",
    desc: "Giáo trình thực tế, giáo viên năng động, trò chơi, role-play cho trẻ em, sinh viên, người đi làm."
  },
  {
    icon: <Layers3 size={24} />,
    title: "Lộ trình rõ ràng",
    desc: "Mục tiêu theo tuần/tháng, báo cáo tiến độ định kỳ cho học viên."
  },
  {
    icon: <CalendarDays size={24} />,
    title: "Lịch học linh hoạt",
    desc: "Ca học sáng - chiều - tối, lớp online hoặc tại trung tâm, phù hợp lịch bận rộn."
  },
  {
    icon: <Users2 size={24} />,
    title: "Hoạt động tương tác",
    desc: "Tương tác nhiều, giáo viên kèm sát để sửa phát âm kịp thời."
  }
]

const feedbacks = [
  {
    id: 1,
    name: "Cẩm Em",
    role: "Nhân viên văn phòng",
    quote:
      "Giờ học vui nhộn, giáo trình chi tiết nên mình nhớ bài lâu và tự tin giao tiếp với khách nước ngoài hơn."
  },
  {
    id: 2,
    name: "Phạm Thị Hạnh",
    role: "Sinh viên năm nhất",
    quote:
      "Lớp offline chỉ khoảng 15 học viên nên được sửa phát âm từng câu. Bạn bè thân thiện, hoạt động nhóm vui và đỡ ngại nói hơn."
  },
  {
    id: 3,
    name: "Ngân Hà",
    role: "Sinh viên ngành ngôn ngữ",
    quote: "Mock test tăng 20 điểm sau 2 tháng nhờ lộ trình rõ ràng và thầy cô tâm huyết.",
    highlight: true
  },
  {
    id: 4,
    name: "Trương Phương Thảo",
    role: "Học sinh lớp 8",
    quote: "Con hào hứng tham gia lớp nói tiếng Anh hàng tuần, về nhà chủ động kể lại câu chuyện bằng tiếng Anh."
  },
  {
    id: 5,
    name: "Minh Khang",
    role: "Học sinh lớp 5",
    quote: "Role-play và sticker giúp con nói nhiều hơn, không còn sợ sai như trước."
  },
  {
    id: 6,
    name: "Nguyễn Văn An",
    role: "Kỹ sư phần mềm",
    quote: "Môi trường học chuyên nghiệp, giáo viên bản ngữ nhiệt tình. Kỹ năng giao tiếp nâng rõ rệt sau 3 tháng."
  }
]

export default function LandingPage() {

  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleGotoDashboard = () => {
    if (user?.roles) {
      const defaultRoute = getDefaultRouteForUser(user.roles)
      navigate(defaultRoute)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
  }
  return (
    <div className="min-h-screen bg-background text-foreground landing-container">
      <header className="lp-header">
        <div className="lp-container lp-flex lp-justify-between lp-items-center">
          <Link to="/" className="lp-logo">
            <img
              src="/Logo_TMS.png"
              alt="Hệ thống TMS"
              style={{ height: "2.5rem", width: "2.5rem", borderRadius: "50%", objectFit: "cover" }}
            />
            <span className="lp-logo-stack">
              <span className="lp-logo-text-primary">TMS</span>
              <span className="lp-logo-text-secondary">Training Management System</span>
            </span>
          </Link>

          <nav className="lp-header-nav">
            <a href="#courses">Môn học</a>
            <Link to="/schedule#schedule-info">Lịch khai giảng</Link>
          </nav>

          <div className="flex items-center gap-6">
            <a href="#consultation" className="lp-btn lp-btn-primary">
              Đăng ký nhanh
            </a>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 cursor-pointer outline-none">
                    <Avatar className="h-10 w-10 border-2 border-green-500">
                      <AvatarImage src={user.avatarUrl || ""} alt={user.fullName || "Avatar"} />
                      <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" sideOffset={8}>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-3 py-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl || ""} alt={user.fullName || "Avatar"} />
                        <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                          {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{user.fullName}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleGotoDashboard} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="lp-btn lp-btn-primary">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="lp-top-banner" aria-label="Hình ảnh nổi bật">
          <div className="lp-top-banner-card">
            <div className="lp-top-banner-text">
              <p className="lp-banner-kicker">Ngôn ngữ cho mọi lứa tuổi</p>
              <h1 className="lp-banner-title">DẠY TỪ TÂM, HỌC TỪ THÍCH, GIỎI TOÀN DIỆN!</h1>
              <p className="lp-banner-subtitle">
                Luôn thành tâm xem xét, quan tâm đến cảm nhận và sự tiến bộ từng ngày của học viên. Đề xuất những phương pháp tân tiến, khoa học và phù hợp nhất.
              </p>
              <a href="#courses" className="lp-btn lp-btn-primary lp-btn-banner">Xem môn học</a>
            </div>
            <div className="lp-top-banner-image">
              <img src={topBanner} alt="Hình ảnh TMS" className="lp-top-banner-image-combined" />
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
                <div className="lp-banner-info-title">Tiến trình</div>
                <div className="lp-banner-info-desc">Tiến trình học viên được báo cáo và theo dõi thông qua hệ thống.</div>
              </div>
            </div>
            <div className="lp-banner-info-item">
              <div className="lp-banner-info-icon">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="lp-banner-info-title">Giáo trình</div>
                <div className="lp-banner-info-desc">Hệ thống cung cấp tài liệu và giáo trình được chuẩn hóa mỗi buổi học.</div>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
              {/* Left Column: Image */}
              <div className="relative z-10 lg:col-span-2">
                <img
                  src={centerImage}
                  alt="Lớp học TMS"
                  className="rounded-lg shadow-xl w-full h-auto object-cover"
                />
              </div>

              {/* Right Column: Text */}
              <div className="pt-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 uppercase leading-tight">
                  HỌC VIÊN ĐẾN VỚI TMS
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  Với phương châm "Không có học sinh kém, chỉ có giáo viên chưa đủ giỏi", đội ngũ giáo viên tại
                  <span className="font-bold text-green-700"> TMS </span>
                  luôn nỗ lực không ngừng nghỉ nâng cao, cải thiện và chuẩn hóa GIÁO TRÌNH HỌC sao cho phù hợp với người Việt Nam nhất,
                  biến việc học ngôn ngữ trở nên thú vị, dễ hiểu với mọi đối tượng, nhất là đối với người bận rộn!
                </p>
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


        <section id="consultation" className="lp-consultation lp-section">
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
              <ConsultationForm />
            </div>
          </div>
        </section>
      </main>


      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <h2 className="text-3xl font-bold text-[#FFFFFF] uppercase">TMS - TRAINING MANAGEMENT SYSTEM</h2>
            <div className="lp-footer-subtitle">
              Hệ thống Đào tạo Ngôn ngữ - Cam kết chuẩn đầu ra Quốc tế!
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
  )
}
