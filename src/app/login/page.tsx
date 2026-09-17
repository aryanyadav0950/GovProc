"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please check your credentials.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 antialiased">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-widest text-blue-400 uppercase">
              GOVPROC • INNOVATION PROCUREMENT
            </span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/"
                className="text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                ← Back
              </Link>
            </div>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight">
            Command Center Login
          </h1>

          <p className="mt-1.5 text-xs text-slate-400">
            Sign in with your department, evaluator, or startup credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Email Address
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 font-medium transition"
              placeholder="officer@gov-demo.in"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 font-medium transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-900 bg-red-950/60 p-3 text-xs text-red-300 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition"
          >
            {loading ? "Signing in to Command Center..." : "Sign In to Command Center →"}
          </button>
        </form>

        {/* Quick Demo Fill Pills */}
        <div className="border-t border-slate-800 pt-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Quick-Fill Pre-Seeded Demo Accounts:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("department@gov-demo.in");
                setPassword("Demo@12345");
              }}
              className="rounded-xl border border-blue-900/60 bg-blue-950/40 p-2.5 text-left text-xs font-semibold text-blue-300 hover:bg-blue-900/50 transition"
            >
              <div className="font-bold text-white">🏛️ Nodal Officer</div>
              <div className="text-[10px] text-slate-400 truncate">department@gov-demo.in</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("evaluator@demo.in");
                setPassword("Demo@12345");
              }}
              className="rounded-xl border border-purple-900/60 bg-purple-950/40 p-2.5 text-left text-xs font-semibold text-purple-300 hover:bg-purple-900/50 transition"
            >
              <div className="font-bold text-white">🎓 Evaluator</div>
              <div className="text-[10px] text-slate-400 truncate">evaluator@demo.in</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("startup@demo.in");
                setPassword("Demo@12345");
              }}
              className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-2.5 text-left text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition"
            >
              <div className="font-bold text-white">🚀 Startup Innovator</div>
              <div className="text-[10px] text-slate-400 truncate">startup@demo.in</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("admin@demo.in");
                setPassword("Demo@12345");
              }}
              className="rounded-xl border border-amber-900/60 bg-amber-950/40 p-2.5 text-left text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition"
            >
              <div className="font-bold text-white">⚡ System Admin</div>
              <div className="text-[10px] text-slate-400 truncate">admin@demo.in</div>
            </button>
          </div>

          <p className="text-[10px] text-slate-500 text-center pt-1">
            Universal Demo Password: <strong className="font-mono text-slate-300">Demo@12345</strong>
          </p>
        </div>
      </div>
    </main>
  );
}