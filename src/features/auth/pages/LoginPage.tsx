import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Headset,
  GraduationCap,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/features/auth/services/auth.service";
import { AuthBrandingPanel } from "@/features/auth/components/AuthBrandingPanel";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/login.schema";

const roleConfig = {
  SUPER_ADMIN: {
    label: "Platform Admin",
    icon: ShieldAlert,
    color: "text-red-500",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
  },
  ADMIN: {
    label: "Institute Owner",
    icon: ShieldCheck,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
  },
  SUPPORT: {
    label: "Support",
    icon: Headset,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200",
  },
  STUDENT: {
    label: "Student",
    icon: GraduationCap,
    color: "text-green-500",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
  },
} as const;

type Role = keyof typeof roleConfig;

export default function Login() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [authenticationError, setAuthenticationError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("ADMIN");

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const CurrentRoleIcon = roleConfig[selectedRole].icon;

  const handleLoginSubmit = async (data: LoginFormValues) => {
    setAuthenticationError(null);

    try {
      // In a real-world scenario, you might pass data.role if the backend needs it
      const response = (await authService.login({
        email: data.email,
        password: data.password,
      })) as { user: Parameters<typeof setAuth>[0] };

      setAuth(response.user);
      navigate("/");
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        e.response?.data?.message ||
        e.message ||
        "Failed to login. Please check your credentials.";
      setAuthenticationError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-sans">
      <AuthBrandingPanel />

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[440px]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500">Sign in below to access dashboard</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(handleLoginSubmit)}>
            {authenticationError && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
                {authenticationError}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-4 outline-none transition-all ${errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-primary focus:ring-primary/20"
                    }`}
                  disabled={isSubmitting}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border focus:ring-4 outline-none transition-all ${errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-primary focus:ring-primary/20"
                    }`}
                  disabled={isSubmitting}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div
              className={`flex items-center gap-2 p-3 rounded-xl ${roleConfig[selectedRole].bgColor} border ${roleConfig[selectedRole].borderColor} transition-colors`}
            >
              <CurrentRoleIcon
                size={18}
                className={roleConfig[selectedRole].color}
              />
              <span className="text-sm font-medium text-gray-700">
                Signing in as{" "}
                <span className="font-bold">
                  {roleConfig[selectedRole].label}
                </span>
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Select Role
            </p>
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
                        : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <div
                      className={isSelected ? config.color : "text-gray-400"}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      className={`font-semibold text-sm ${isSelected ? "text-gray-900" : "text-gray-600"
                        }`}
                    >
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
