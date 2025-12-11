import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useNavigate } from "react-router-dom";

const resetPasswordBanner = new URL(
  "../../assets/Linhvatlogin.png",
  import.meta.url
).href;

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img
              src="/Logo_TMS.png"
              alt="TMS Logo"
              className="h-10 w-10 rounded-full object-cover"
            />
            <span
              style={{
                display: "inline-flex",
                flexDirection: "column",
                lineHeight: 1.05,
                alignItems: "flex-start",
                textAlign: "left",
              }}
            >
              <span
                style={{ fontWeight: 700, color: "#2e5a34", fontSize: "1rem" }}
              >
                TMS
              </span>
              <span
                style={{
                  fontWeight: 500,
                  color: "#5c6a7c",
                  fontSize: "0.8rem",
                  marginTop: "2px",
                }}
              >
                Training Management System
              </span>
            </span>
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src={resetPasswordBanner}
          alt="Đặt lại mật khẩu"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
