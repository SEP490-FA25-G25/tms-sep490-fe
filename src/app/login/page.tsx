import { LoginForm } from "@/components/login-form"
import { useNavigate } from "react-router-dom"

const loginBanner = new URL("../../assets/Gemini_Generated_Image_xi4umcxi4umcxi4u.png", import.meta.url).href

export default function LoginPage() {
  const navigate = useNavigate()

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate("/")
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img
              src="/logo.jpg"
              alt="Anh ngu Pinnacle Logo"
              className="h-10 w-10 rounded-full object-cover"
            />
            <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.05 }}>
              <span style={{ fontWeight: 700, color: "#2e5a34", fontSize: "1rem" }}>PINNACLE</span>
              <span style={{ fontWeight: 500, color: "#5c6a7c", fontSize: "0.8rem", marginTop: "2px" }}>
                English Center
              </span>
            </span>
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          src={loginBanner}
          alt="Pinnacle banner"
        />
      </div>
    </div>
  )
}
