import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { loginWithGoogle } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-6">
      {/* Logo mark */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.27 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91"/>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Trip Planner</h1>
        <p className="text-gray-500 mt-2 text-base leading-relaxed max-w-xs mx-auto">
          Your travel companion — itinerary, tickets, expenses and more.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6">
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-2xl py-3.5 px-4 text-gray-700 font-semibold text-sm hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
          Continue with Google
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">
          Your data is private and synced across devices.
        </p>
      </div>
    </div>
  )
}
