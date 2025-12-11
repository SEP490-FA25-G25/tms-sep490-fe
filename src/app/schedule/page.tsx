import { Link, useLocation } from "react-router-dom";
import {
    Search,
    Phone,
    Mail,
    Facebook,
    MessageCircle,
    BookOpen,
    Cog
} from "lucide-react";
import "../landing.css";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getDefaultRouteForUser } from "@/utils/role-routes";
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
import { ConsultationForm } from "@/components/ConsultationForm";

const topBanner = new URL("../../assets/Linhvat2.png", import.meta.url).href;
const consultLogo = new URL("../../assets/TMS1.png", import.meta.url).href;

// Mock data for schedule
const scheduleData = [
    {
        code: "N3.214CS",
        time: "19h-21h",
        startDate: "29/12/2025",
        status: "Còn chỗ",
        statusColor: "bg-emerald-500",
        total: 35,
        enrolled: 24,
        campus: "CS1"
    },
    {
        code: "N3.213CS",
        time: "19h-21h",
        startDate: "16/12/2025",
        status: "Còn chỗ",
        statusColor: "bg-emerald-500",
        total: 35,
        enrolled: 30,
        campus: "CS2"
    },
    {
        code: "N3.212CS",
        time: "19h-21h",
        startDate: "08/12/2025",
        status: "Gần hết chỗ",
        statusColor: "bg-yellow-500",
        total: 35,
        enrolled: 32,
        campus: "CS1"
    },
    {
        code: "N3.284CB",
        time: "19h-21h",
        startDate: "22/12/2025",
        status: "Còn chỗ",
        statusColor: "bg-emerald-500",
        total: 48,
        enrolled: 20,
        campus: "CS3"
    },
    {
        code: "N3.283CB",
        time: "19h-21h",
        startDate: "16/12/2025",
        status: "Gần hết chỗ",
        statusColor: "bg-yellow-500",
        total: 48,
        enrolled: 45,
        campus: "CS2"
    },
    {
        code: "N3.281CB",
        time: "19h-21h",
        startDate: "09/12/2025",
        status: "Gần hết chỗ",
        statusColor: "bg-yellow-500",
        total: 48,
        enrolled: 46,
        campus: "CS1"
    },
    {
        code: "N4.288",
        time: "19h-21h",
        startDate: "26/01/2025",
        status: "Còn chỗ",
        statusColor: "bg-emerald-500",
        total: 50,
        enrolled: 10,
        campus: "CS3"
    },
    {
        code: "N4.287",
        time: "19h-21h",
        startDate: "20/01/2025",
        status: "Còn chỗ",
        statusColor: "bg-emerald-500",
        total: 50,
        enrolled: 15,
        campus: "CS2"
    }
];

export default function SchedulePage() {
    const [activeTab, setActiveTab] = useState("Offline");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCampus, setSelectedCampus] = useState("");

    const { hash } = useLocation();
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleGotoDashboard = () => {
        if (user?.roles) {
            const defaultRoute = getDefaultRouteForUser(user.roles);
            navigate(defaultRoute);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    useEffect(() => {
        if (hash) {
            const element = document.getElementById(hash.replace('#', ''));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.scrollTo(0, 0);
        }
    }, [hash]);

    const filteredData = scheduleData.filter(item => {
        const matchesSearch = item.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCampus = selectedCampus ? item.campus === selectedCampus : true;
        return matchesSearch && matchesCampus;
    });

    return (
        <div className="min-h-screen bg-background text-foreground landing-container">
            {/* Header */}
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
                        <Link to="/#courses">Môn học</Link>
                        <Link to="/schedule#schedule-info" className="font-bold text-green-700">Lịch khai giảng</Link>
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
                {/* Banner Section (Reused) */}
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

                {/* Schedule Section */}
                <section id="schedule-info" className="py-12 bg-white">
                    <div className="lp-container">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                            <h2 className="text-3xl font-bold text-[#1A3320] uppercase">THÔNG TIN LỊCH KHAI GIẢNG</h2>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm lớp học..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <select
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                    value={selectedCampus}
                                    onChange={(e) => setSelectedCampus(e.target.value)}
                                >
                                    <option value="">Tất cả cơ sở</option>
                                    <option value="CS1">Cơ sở 1</option>
                                    <option value="CS2">Cơ sở 2</option>
                                    <option value="CS3">Cơ sở 3</option>
                                </select>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 mb-6 border-b border-gray-200">
                            {['Offline', 'Trực tuyến', 'Kaiwa'].map((tab) => (
                                <button
                                    key={tab}
                                    className={`px-6 py-3 font-semibold text-lg transition-colors relative ${activeTab === tab
                                        ? 'text-[#1A3320] border-b-2 border-[#1A3320]'
                                        : 'text-gray-500 hover:text-[#1A3320]'
                                        }`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Schedule Table */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead className="bg-[#E8F5E9]">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-[#1A3320] uppercase">Mã lớp</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-[#1A3320] uppercase">Thời gian</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-[#1A3320] uppercase">Ngày khai giảng</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-[#1A3320] uppercase">Trạng thái</th>
                                            <th className="px-6 py-4 text-center text-sm font-bold text-[#1A3320] uppercase">Sĩ số</th>
                                            <th className="px-6 py-4 text-center text-sm font-bold text-[#1A3320] uppercase">Đã đăng ký</th>

                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredData.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-gray-900">{item.code}</td>
                                                <td className="px-6 py-4 text-gray-700">{item.time}</td>
                                                <td className="px-6 py-4 text-gray-700">{item.startDate}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${item.statusColor}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-gray-700">{item.total}</td>
                                                <td className="px-6 py-4 text-center text-gray-700">{item.enrolled}</td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredData.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    Không tìm thấy lớp học nào phù hợp.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

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

            {/* Footer (Reused) */}
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
    );
}
