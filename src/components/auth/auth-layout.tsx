import Link from "next/link";

type AuthLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footer: React.ReactNode;
};

export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 xl:p-14">
        <Link href="/" className="text-xl font-bold text-white tracking-tight">
          PayTrack AI
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-white xl:text-3xl">
            Stay on top of your cards
          </h2>
          <p className="mt-3 text-slate-400 max-w-sm">
            One dashboard. All your credit cards. Never miss a payment.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "Track balances and due dates",
              "Email reminders before deadlines",
              "Monthly summary at a glance",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} PayTrack AI
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link href="/" className="text-lg font-bold text-slate-900 tracking-tight">
              PayTrack AI
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">
            {children}
          </div>
          <div className="mt-6 text-center text-sm text-slate-500">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
