import { Keyboard } from "lucide-react";

export function AuthBrandingPanel() {
  return (
    <div className="hidden lg:flex w-[50%] bg-gradient-to-br from-primary-light to-primary-dark text-white p-12 flex-col justify-between relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Keyboard size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Typing Expert Panel
          </h1>
        </div>
        <p className="text-primary-100 mt-2 text-sm">
          Typing Software Management Dashboard
        </p>
      </div>

      <div className="relative z-10 max-w-lg mb-12">
        <h2 className="text-4xl font-bold leading-tight mb-6">
          Manage your typing software with confidence
        </h2>
        <p className="text-white/80 text-lg mb-12">
          A complete platform for institution administrators for Managing the
          institute typing Software.
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
  );
}
