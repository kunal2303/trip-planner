import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div
        ref={ref}
        className="bg-white w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
          >
            <X size={16} />
          </button>
        </div>
        {/* Drag indicator for mobile */}
        <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
