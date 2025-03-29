import React from 'react'

export function Button({ children, className, ...props }) {
  return (
    <button 
      className={`bg-pink-500 hover:bg-pink-600 text-white text-lg px-10 py-4 rounded-full shadow-xl transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
} 