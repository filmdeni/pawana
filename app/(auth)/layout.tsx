export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 60% 40%, #1a0d35 0%, #05060A 55%, #090711 100%)" }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "radial-gradient(circle, #6F4BFF, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.05] blur-3xl"
          style={{ background: "radial-gradient(circle, #D7B56D, transparent)" }} />
      </div>

      <div className="relative z-10 w-full">
        {children}
      </div>

      <p className="relative z-10 mt-6 text-xs text-center" style={{ color: "var(--text-muted)" }}>
        © 2024 ภาวนา · แพลตฟอร์มทำนายสังคม · ไม่ใช่การพนัน
      </p>
    </div>
  );
}
