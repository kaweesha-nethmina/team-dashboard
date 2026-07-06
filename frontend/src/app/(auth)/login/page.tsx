"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setIsShaking(false)
    try {
      await login(email, password)
      router.push("/my-reports")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
      setIsShaking(true)
    } finally {
      setLoading(false)
    }
  }

  // Clear shake state after animation ends
  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => setIsShaking(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isShaking])

  return (
    <div className="min-h-screen bg-[var(--color-space-bg)] text-[var(--color-silver)] flex items-center justify-center relative overflow-hidden px-4 sm:px-6">

      {/* Main double panel card container */}
      <div className={`w-full max-w-4xl min-h-[580px] flex rounded-3xl overflow-hidden shadow-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] z-10 transition-transform duration-300 animate-card-slide-in ${isShaking ? "animate-shake" : ""}`}>
        
        {/* Left Column: Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-8 sm:p-12 md:p-16">
          <div className="w-full">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              Sign In
            </h2>
            <p className="text-sm text-gray-500 mb-8 font-medium">
              Access your TeamDash account & reports
            </p>



            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input w-full pl-11 pr-12 py-3 rounded-xl text-sm focus:outline-none placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl text-sm animate-card-slide-in">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-200 transform active:scale-[0.98] hover:shadow-lg hover:shadow-indigo-500/20 flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
              >
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Mobile Footer Toggle */}
            <div className="mt-8 text-center text-sm text-gray-500 md:hidden">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-4">
                Register
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: CTA Banner */}
        <div 
          className="hidden md:flex md:w-1/2 relative flex-col justify-center items-center p-16 text-center overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: "url('/login_image.png')" }}
        >
          {/* Subtle gradient overlay to color-grade the image and guarantee text readability */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/80 via-violet-950/70 to-pink-900/40 mix-blend-multiply pointer-events-none" />
          
          {/* Abstract floating circles for high premium aesthetic */}
          <div className="absolute top-[10%] right-[10%] w-40 h-40 rounded-full bg-white/10 backdrop-blur-md border border-white/20 pointer-events-none animate-float-1" />
          <div className="absolute bottom-[10%] left-[10%] w-32 h-32 rounded-full bg-white/10 backdrop-blur-md border border-white/20 pointer-events-none animate-float-2" />
          
          <div className="z-10 text-white flex flex-col items-center">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight leading-tight">
              Welcome to TeamDash
            </h2>
            <p className="text-white/80 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
              Monitor team reports, track progress, and gain insights — all in one place.
            </p>
            <Link
              href="/register"
              className="inline-block border border-white/40 hover:border-white text-white hover:bg-white hover:text-indigo-600 font-bold px-10 py-3 rounded-full text-sm transition-all duration-300 transform active:scale-[0.97]"
            >
              Sign Up
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
