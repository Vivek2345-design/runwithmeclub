"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-muted">An unexpected error happened. It&rsquo;s not you. Please try again.</p>
      <button className="btn btn-primary mt-6" onClick={reset}>Try again</button>
    </div>
  );
}
