import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { loginWithGoogle } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">✈️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Planner</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Organize your trips — itinerary, tickets, expenses, packing and more.
        </p>
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 px-4 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
          Continue with Google
        </button>
      </div>
    </div>
  )
}
