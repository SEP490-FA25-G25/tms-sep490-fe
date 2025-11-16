import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Quote,
  RefreshCw,
  Star,
  Users2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const heroStats = [
  { label: 'Học viên đạt IELTS 7.0+', value: '2.400+', description: 'Tăng trung bình 1.5 band sau 16 tuần' },
  { label: 'Điểm TOEIC trung bình', value: '915', description: 'Cam kết đầu ra dựa trên lộ trình cá nhân hóa' },
  { label: 'Giáo viên chứng chỉ quốc tế', value: '60+', description: '100% sở hữu TESOL/CELTA, 40% bản ngữ' },
]

const mockCourses = [
  {
    id: 'ielts-foundation',
    name: 'IELTS Foundation 5.0 → 6.5',
    level: 'Tương đương B1',
    totalHours: '96 giờ | 12 tuần',
    format: 'Offline · 3 buổi/tuần',
    tags: ['Phát âm chuẩn', 'Ngữ pháp học thuật'],
    description: 'Xây nền tảng 4 kỹ năng bằng giáo trình độc quyền kết hợp luyện nói 1-1 với coach.',
  },
  {
    id: 'business-communication',
    name: 'TOEIC Intensive 700 → 900+',
    level: 'Intermediate',
    totalHours: '72 giờ | 9 tuần',
    format: 'Hybrid · 4 buổi/tuần',
    tags: ['Listening tốc độ cao', 'Chiến lược Part 5-7'],
    description: 'Luyện đề chuẩn ETS, phân tích lỗi cá nhân bằng dashboard giúp tăng điểm nhanh chóng.',
  },
  {
    id: 'jlpt-n3',
    name: 'IELTS Master 6.5 → 7.5+',
    level: 'Upper Intermediate',
    totalHours: '120 giờ | 15 tuần',
    format: 'Online · 4 buổi/tuần',
    tags: ['Writing clinic', 'Mock test Cambridge'],
    description: 'Tập trung chuyên sâu Writing & Speaking cùng hội đồng examiner kèm phản hồi cá nhân.',
  },
]

const mockClasses = [
  {
    code: 'HN-IEL-2412A',
    branch: 'Hà Nội · Tòa nhà D’Office',
    start: 'Khai giảng 12/12/2025',
    schedule: 'Thứ 2 · 19:00 — 21:30 | Thứ 5 · 19:00 — 21:30',
    seats: '24/28 học viên · 2 chỗ cuối',
    focus: 'Lộ trình Foundation · Ôn chuyên đề Writing Task 2 & Speaking Part 3',
  },
  {
    code: 'SG-BIZ-2501H',
    branch: 'TP.HCM · Thảo Điền Campus',
    start: 'Khai giảng 08/01/2026',
    schedule: 'Thứ 3 · 18:30 — 21:00 | Thứ 7 · 09:00 — 11:30',
    seats: '16/20 học viên · Còn nhiều chỗ',
    focus: 'TOEIC Intensive · Tăng tốc Listening + Reading với giáo viên bản ngữ',
  },
  {
    code: 'HN-JP-2502O',
    branch: 'Hà Nội · Lớp online toàn quốc',
    start: 'Khai giảng 17/02/2026',
    schedule: 'Thứ 2,4,6 · 18:00 — 20:00 (Online)',
    seats: 'Đang tiếp nhận đăng ký · Ưu tiên học viên chuyển lớp',
    focus: 'IELTS Master · Thi thử Cambridge + feedback examiner 1-1',
  },
]

const featureHighlights = [
  {
    title: 'Giải pháp học tập cá nhân hóa',
    description: 'Đánh giá đầu vào AI + coach học thuật giúp xây lộ trình riêng cho từng mục tiêu band điểm.',
    icon: Layers3,
  },
  {
    title: 'Lịch học linh hoạt',
    description: 'Offline, online, hybrid với tùy chọn học bù miễn phí, dễ dàng cân bằng lịch làm việc.',
    icon: CalendarDays,
  },
  {
    title: 'Đội ngũ giảng viên song ngữ',
    description: 'Kết hợp giảng viên bản ngữ và Việt Nam để luyện phát âm chuẩn và truyền bí quyết thi thật.',
    icon: Users2,
  },
  {
    title: 'Cam kết kết quả minh bạch',
    description: 'Thi thử định kỳ, tracking tiến độ từng tuần và hoàn học phí nếu không đạt cam kết đầu ra.',
    icon: CheckCircle2,
  },
]

const workflowSteps = [
  {
    title: 'Đánh giá và tư vấn miễn phí',
    copy: 'Đăng ký kiểm tra đầu vào IELTS/TOEIC, nhận phân tích điểm mạnh-yếu cùng lộ trình gợi ý chi tiết.',
  },
  {
    title: 'Học tập linh hoạt',
    copy: 'Chọn lịch phù hợp, kết hợp lớp chính + phòng lab + giờ coaching 1-1 để tối ưu thời gian.',
  },
  {
    title: 'Thi thử & chinh phục chứng chỉ',
    copy: 'Thi thử Cambridge/ETS hàng tháng, nhận chiến lược cá nhân và chinh phục band điểm mục tiêu.',
  },
]

const testimonials = [
  {
    name: 'Trần Hoàng Chi',
    result: 'IELTS 7.5 sau 14 tuần',
    quote:
      'Mình cực kỳ ấn tượng với phòng lab phát âm và coach 1-1. Thầy cô theo sát từng bài viết nên mình tăng 1.5 band Writing chỉ trong 2 tháng.',
    image:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Nguyễn Minh Hùng',
    result: 'TOEIC 930 sau 10 tuần',
    quote:
      'Dashboard phân tích lỗi từng Part giúp mình biết chính xác phải luyện gì. Lịch học linh hoạt nên vẫn cân bằng được công việc.',
    image:
      'https://images.unsplash.com/photo-1544723795-432537f903d7?auto=format&fit=crop&w=600&q=80',
  },
]

const courseSpotlights = [
  {
    title: 'Combo IELTS Foundation',
    duration: '12 tuần · 96 giờ',
    perks: ['Tặng 2 buổi coaching 1-1', '4 mock test format mới nhất'],
    image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'IELTS Master 7.5+',
    duration: '15 tuần · 120 giờ',
    perks: ['Workshop Writing nâng cao', 'Speaking recording & chấm band'],
    image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'TOEIC Intensive 900+',
    duration: '9 tuần · 72 giờ',
    perks: ['Phòng luyện Listening tốc độ cao', 'Bộ đề ETS độc quyền'],
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span>Học viện Anh ngữ TMS</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#khoa-hoc" className="hover:text-foreground">
              Chương trình
            </a>
            <a href="#lop-hoc" className="hover:text-foreground">
              Lịch khai giảng
            </a>
            <a href="#quy-trinh" className="hover:text-foreground">
              Lộ trình
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <a href="tel:+84987654321">Hotline 0987 654 321</a>
            </Button>
            <Button asChild>
              <a href="#dang-ky">
                Đặt lịch tư vấn
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(147,51,234,0.15),_transparent)]">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:py-24 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Trung tâm luyện thi IELTS · TOEIC · Giao tiếp chuyên sâu
              </p>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  Bứt phá band điểm với lộ trình cá nhân hóa và giảng viên song ngữ top đầu Việt Nam.
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Học viên của chúng tôi tăng ít nhất 1 band IELTS hoặc 200 điểm TOEIC chỉ sau 12-16 tuần nhờ giáo
                  trình độc quyền kết hợp hệ thống luyện đề chuẩn quốc tế.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <a href="#dang-ky">
                    Đăng ký kiểm tra đầu vào
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#lop-hoc">Nhận lịch khai giảng</a>
                </Button>
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-lg shadow-primary/5">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{stat.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80"
                  alt="Học viên luyện Speaking tại phòng lab"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/30 bg-white/85 p-5 backdrop-blur">
                  <p className="text-sm font-semibold text-primary">IELTS Masterclass · 15 tuần</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    120 giờ học + 4 buổi mô phỏng Speaking · Phù hợp mục tiêu 6.5 → 7.5+.
                  </p>
                </div>
              </div>
              <div className="absolute -left-6 -top-6 hidden rounded-2xl border border-white/60 bg-white/90 px-5 py-4 text-sm font-medium shadow-lg lg:flex lg:flex-col">
                <Star className="h-5 w-5 text-primary" />
                <span className="mt-2 text-2xl font-semibold">4.9/5</span>
                <span className="text-muted-foreground">1.200+ đánh giá Google</span>
              </div>
            </div>
          </div>
        </section>

        <section id="khoa-hoc" className="border-t border-border/60 bg-muted/20 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Chương trình nổi bật</p>
                <h2 className="mt-2 text-3xl font-semibold">Lộ trình IELTS, TOEIC và giao tiếp chuẩn quốc tế</h2>
                <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                  Chương trình được cố vấn bởi hội đồng examiner Cambridge, cập nhật đề thi mới nhất và tích hợp phòng
                  lab phát âm AI giúp học viên luyện tập mọi lúc mọi nơi.
                </p>
              </div>
              <Button variant="ghost" asChild>
                <a href="#dang-ky">Tư vấn lộ trình cá nhân</a>
              </Button>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {mockCourses.map((course) => (
                <article key={course.id} className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
                      {course.level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{course.format}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{course.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
                  <dl className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Tổng thời lượng:</dt>
                      <dd className="font-medium text-foreground">{course.totalHours}</dd>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Trọng tâm CLO:</dt>
                      <dd className="text-right text-foreground">{course.tags[0]}</dd>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Hỗ trợ học viên:</dt>
                      <dd className="text-right text-foreground">{course.tags[1]}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Vì sao chọn chúng tôi</p>
                <h2 className="mt-2 text-3xl font-semibold">Cam kết đầu ra minh bạch, chăm sóc sát sao</h2>
                <p className="mt-3 text-base text-muted-foreground">
                  Hệ sinh thái học tập 360°: giáo trình độc quyền, giờ luyện lab không giới hạn, coaching 1-1, học bù
                  miễn phí và báo cáo tiến độ hàng tuần gửi phụ huynh.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {featureHighlights.map((feature) => (
                  <div key={feature.title} className="rounded-3xl border border-border/50 bg-accent/10 p-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/10 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Gói khóa học chuyên sâu</p>
              <h2 className="text-3xl font-semibold">Chọn lộ trình phù hợp mục tiêu điểm của bạn</h2>
              <p className="text-base text-muted-foreground">
                Mỗi chương trình đều có giáo trình riêng, lịch học linh hoạt và ưu đãi coaching kèm mock test định kỳ.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {courseSpotlights.map((course) => (
                <article key={course.title} className="flex flex-col overflow-hidden rounded-[32px] border border-border/60 bg-card/80 shadow-lg">
                  <img src={course.image} alt={course.title} className="h-48 w-full object-cover" />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="text-sm text-muted-foreground">{course.duration}</div>
                    <h3 className="mt-2 text-xl font-semibold">{course.title}</h3>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {course.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    <Button size="sm" className="mt-6 self-start" variant="outline" asChild>
                      <a href="#dang-ky">Nhận tư vấn chi tiết</a>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="lop-hoc" className="border-y border-border/60 bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Lịch khai giảng mới nhất</p>
                <h2 className="mt-2 text-3xl font-semibold">Chọn lớp phù hợp lịch làm việc và mục tiêu điểm</h2>
                <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                  Toàn bộ lớp đều giới hạn dưới 18 học viên, học bù linh hoạt giữa các chi nhánh Hà Nội – TP.HCM hoặc
                  qua lớp online toàn quốc.
                </p>
              </div>
              <Button variant="ghost" asChild>
                <a href="#dang-ky">Giữ chỗ ngay hôm nay</a>
              </Button>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {mockClasses.map((cls) => (
                <article key={cls.code} className="rounded-3xl border border-border/60 bg-card p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-muted-foreground">{cls.branch}</p>
                      <h3 className="mt-1 text-2xl font-semibold">{cls.code}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {cls.start}
                    </Badge>
                  </div>
                  <dl className="mt-6 space-y-3 text-sm text-muted-foreground">
                    <div>
                      <dt className="font-medium text-foreground">Lịch học</dt>
                      <dd>{cls.schedule}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Sức chứa</dt>
                      <dd>{cls.seats}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Trọng tâm tuần này</dt>
                      <dd>{cls.focus}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 bg-background py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Cảm nhận học viên</p>
              <h2 className="text-3xl font-semibold">Hơn 12.000 học viên đã tin tưởng TMS English Academy</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <article
                  key={testimonial.name}
                  className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/80 p-8 shadow-lg"
                >
                  <Quote className="absolute -right-6 -top-6 h-16 w-16 rotate-6 text-primary/20" />
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div>
                      <p className="text-lg font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-primary">{testimonial.result}</p>
                    </div>
                  </div>
                  <p className="mt-6 text-base text-muted-foreground">{testimonial.quote}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="quy-trinh" className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-3xl border border-border/60 bg-card/70 p-10 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Lộ trình học cá nhân hóa</p>
                  <h2 className="mt-2 text-3xl font-semibold">Đồng hành từ kiểm tra đầu vào đến ngày thi</h2>
                  <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                    Ba bước rõ ràng giúp bạn chủ động: đánh giá năng lực → học tập linh hoạt → thi thử và nhận chiến
                    lược chinh phục chứng chỉ mơ ước.
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary">
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Đồng hành liên tục
                </Badge>
              </div>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {workflowSteps.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-border/50 p-6">
                    <div className="text-sm font-semibold text-muted-foreground">Bước {index + 1}</div>
                    <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section id="dang-ky" className="border-t border-border/60 bg-muted/10 py-20">
          <div className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-background p-10 text-center shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Đăng ký tư vấn</p>
            <h2 className="mt-3 text-3xl font-semibold">Nhận lộ trình miễn phí và suất học bổng đến 4.000.000đ</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Để lại thông tin, đội ngũ học thuật sẽ gọi lại trong 15 phút để sắp lịch kiểm tra đầu vào và tư vấn lớp
              phù hợp nhất.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <a href="tel:+84987654321">Gọi hotline 0987 654 321</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:admissions@tms.edu.vn">Gửi email cho tư vấn viên</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© 2025 Học viện Anh ngữ TMS · Đồng hành luyện thi IELTS/TOEIC chuyên sâu</p>
          <div className="flex gap-6">
            <a href="#khoa-hoc" className="hover:text-foreground">
              Chương trình
            </a>
            <a href="#lop-hoc" className="hover:text-foreground">
              Lịch khai giảng
            </a>
            <a href="#dang-ky" className="hover:text-foreground">
              Đăng ký tư vấn
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
