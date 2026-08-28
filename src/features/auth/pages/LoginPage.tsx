import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Keyboard,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Headset,
  GraduationCap
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/features/auth/services/auth.service";

type Role = "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "STUDENT";

const roleConfig = {
  SUPER_ADMIN: {
    label: "Platform Admin",
    icon: ShieldAlert,
    color: "text-red-500",
    bgColor: "bg-red-100",
    borderColor: "border-red-200"
  },
  ADMIN: {
    label: "Institute Owner",
    icon: ShieldCheck,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200"
  },
  SUPPORT: {
    label: "Support",
    icon: Headset,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200"
  },
  STUDENT: {
    label: "Student",
    icon: GraduationCap,
    color: "text-green-500",
    bgColor: "bg-green-100",
    borderColor: "border-green-200"
  }
};

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<Role>("ADMIN");
  const [showPassword, setShowPassword] = useState(false);

  // Auth Integration State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const CurrentRoleIcon = roleConfig[selectedRole].icon;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Typically, pass selectedRole if the backend requires role-based login
      const response = await authService.login({ email, password }) as { user: Parameters<typeof setAuth>[0] };

      // Update global auth store
      setAuth(response.user);

      // Navigate to dashboard
      navigate("/");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-[50%] bg-gradient-to-br from-primary-light to-primary-dark text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Keyboard size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Typing Expert Panel</h1>
          </div>
          <p className="text-primary-100 mt-2 text-sm">Typing Software Management Dashboard</p>
        </div>

        <div className="relative z-10 max-w-lg mb-12">
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Manage your typing software with confidence
          </h2>
          <p className="text-white/80 text-lg mb-12">
            A complete platform for institution administrators for Managing the institute typing Software.
          </p>

          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1">
              <div className="text-2xl font-bold">10+</div>
              <div className="text-white/80 text-sm">Active Institutions</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1">
              <div className="text-2xl font-bold">800+</div>
              <div className="text-white/80 text-sm">Active Students</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1">
              <div className="text-2xl font-bold">2</div>
              <div className="text-white/80 text-sm">Typing Languages</div>
            </div>
          </div>
          <div className="flex gap-4 mt-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1">
              <div className="text-2xl font-bold">50+</div>
              <div className="text-white/80 text-sm">Modules & Lessons</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1">
              <div className="text-2xl font-bold">20+</div>
              <div className="text-white/80 text-sm">Typing Exams</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1">
              <div className="text-2xl font-bold">10+</div>
              <div className="text-white/80 text-sm">Typing Games</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/70 text-sm">
          &copy; {new Date().getFullYear()} Atul Verma. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[440px]">

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-gray-500">Sign in below to access dashboard</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded-xl ${roleConfig[selectedRole].bgColor} border ${roleConfig[selectedRole].borderColor} transition-colors`}>
              <CurrentRoleIcon size={18} className={roleConfig[selectedRole].color} />
              <span className="text-sm font-medium text-gray-700">
                Signing in as <span className="font-bold">{roleConfig[selectedRole].label}</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Sign In as {roleConfig[selectedRole].label}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Select Role</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(roleConfig) as Role[]).map((role) => {
                const config = roleConfig[role];
                const Icon = config.icon;
                const isSelected = selectedRole === role;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${isSelected
                      ? `${config.bgColor} ${config.borderColor} shadow-sm`
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className={isSelected ? config.color : 'text-gray-400'}>
                      <Icon size={20} />
                    </div>
                    <span className={`font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
