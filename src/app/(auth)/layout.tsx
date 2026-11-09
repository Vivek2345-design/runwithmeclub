import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/client";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getUser()) redirect("/dashboard");
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between"><Link href="/"><Logo /></Link><ThemeToggle /></div>
        <main id="main" className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10">{children}</main>
        <p className="text-center text-xs text-muted">&copy; {new Date().getFullYear()} RunWithMeClub</p>
      </div>
      <aside className="relative hidden overflow-hidden lg:block" style={{ background: "linear-gradient(150deg, #f2541b 0%, #b8350a 55%, #0f766e 140%)" }} aria-hidden="true">
        <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice"><path d="M-40 640 C 120 420, 240 720, 360 480 S 560 160, 660 300" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" /><path d="M-40 720 C 160 560, 300 780, 420 600 S 600 380, 680 460" fill="none" stroke="#c7f23a" strokeWidth="3" strokeLinecap="round" /></svg>
        <div className="relative flex h-full flex-col justify-end p-14 text-white">
          <p className="display text-4xl font-extrabold leading-tight">Run together.<br />Get faster.<br />Have fun.</p>
          <p className="mt-4 max-w-sm text-white/85">Join the club that makes every kilometre better. Group runs, coached plans and a community that has your back.</p>
        </div>
      </aside>
    </div>
  );
}
