export default function Topbar() {
  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-white/20 bg-white/10 backdrop-blur-xl">
      <h1 className="text-lg font-semibold">Ilham Education System</h1>

      <button
        onClick={() => {
          localStorage.removeItem('token')
          window.location.href = '/'
        }}
        className="px-4 py-2 rounded-lg bg-red-400 text-black font-medium hover:scale-105 transition"
      >
        Logout
      </button>
    </div>
  )
}
