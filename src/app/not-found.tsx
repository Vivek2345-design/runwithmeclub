import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="hero-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="display mt-10 text-8xl font-extrabold grad-text">404</p>
      <h1 className="mt-2 text-2xl font-bold">Looks like you took a wrong turn.</h1>
      <p className="mt-2 max-w-sm text-muted">That page doesn&rsquo;t exist, or it has moved. Let&rsquo;s get you back on the route.</p>
      <div className="mt-6 flex gap-3"><Link href="/" className="btn btn-primary">Back home</Link><Link href="/events" className="btn">See events</Link></div>
    </div>
  );
}
