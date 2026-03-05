import { Link, usePage } from '@inertiajs/react'
import { type PropsWithChildren } from 'react'
import { home } from '@/routes'
import { type SharedData } from '@/types'

interface AuthLayoutProps {
    title?: string
    description?: string
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name } = usePage<SharedData>().props

    // Floating icons behind login form
    const icons = ['💰', '💸', '🪙', '💎', '💭', '🤑', '🧾', '🏦', '💳', '🪙', '🪙', '💰', '💸']
    const floatingIcons = Array.from({ length: 20 })

    return (
        <div className="relative grid h-screen lg:grid-cols-2">

            {/* Left Side - Logo / Gradient */}
            <div className="hidden lg:flex relative h-full items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
                <div className="relative z-10 text-center px-10">
                    {/* Bigger logo */}
                    <img src="/img/money icon.png" alt="IEGS Logo" className="mx-auto h-36 w-36 mb-6" />
                    {/* App name */}
                    <h2 className="text-6xl font-bold mb-3 text-white">IEGS</h2>
                    {/* Feature list */}
                   <p className="text-2xl text-white font-medium mb-2 flex flex-wrap justify-center gap-6">
  <span className="flex items-center gap-2">
    Income <span>💰</span>
  </span>
  <span className="flex items-center gap-2">
    Expense <span>💸</span>
  </span>
  <span className="flex items-center gap-2">
    Goal <span>🎯</span>
  </span>
  <span className="flex items-center gap-2">
    Saving <span>💎</span>
  </span>
</p>

                    <p className="mb-8 text-white text-lg">
                            Know your money. Reach your goals. Live your dreams.
                        </p>
                </div>
            </div>

            {/* Right Side - Form with floating icons behind */}
            <div className="flex w-full items-center justify-center bg-white relative">
                {/* Floating icons behind form */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {floatingIcons.map((_, i) => {
                        const icon = icons[Math.floor(Math.random() * icons.length)]
                        const top = Math.random() * 100
                        const left = Math.random() * 100
                        const size = 24 + Math.random() * 30
                        const duration = 5 + Math.random() * 8
                        const delay = Math.random() * 5
                        const rotate = Math.random() * 360
                        return (
                            <span
                                key={i}
                                className="absolute opacity-25"
                                style={{
                                    top: `${top}%`,
                                    left: `${left}%`,
                                    fontSize: `${size}px`,
                                    animation: `float ${duration}s ease-in-out ${delay}s infinite`,
                                    transform: `rotate(${rotate}deg)`,
                                }}
                            >
                                {icon}
                            </span>
                        )
                    })}
                </div>

                {/* Form Card */}
                <div className="relative z-10 mx-auto w-full max-w-md p-8 sm:p-10 rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl">

                    {/* Logo top for mobile */}
                    <Link href={home()} className="flex items-center justify-center mb-6 lg:hidden">
                        <img src="/img/money icon.png" alt="Logo" className="h-16 w-16" />
                    </Link>

                    {/* Title & Description */}
                    <div className="text-center mb-6">
                        {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                        {description && <p className="text-gray-600 mt-2">{description}</p>}
                    </div>

                    {/* Form / children */}
                    {children}
                </div>
            </div>

            {/* Floating animation CSS */}
            <style>
                {`
                    @keyframes float {
                        0% { transform: translate(0, 0) rotate(0deg); }
                        25% { transform: translate(10px, -15px) rotate(5deg); }
                        50% { transform: translate(-10px, 15px) rotate(-5deg); }
                        75% { transform: translate(15px, -10px) rotate(3deg); }
                        100% { transform: translate(0, 0) rotate(0deg); }
                    }
                `}
            </style>
        </div>
    )
}
