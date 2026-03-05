import { Head, Link, usePage } from '@inertiajs/react'
import { login, register, dashboard } from '@/routes'
import { type SharedData } from '@/types'

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage<SharedData>().props

    // More icons for the flying cloud
    const icons = ['💰', '💸', '🪙', '💎', '💭', '🤑', '🧾', '🏦', '💳', '🪙', '🪙', '💰', '💸']

    return (
        <>
            <Head title="IEGS – Financial Dreams">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative min-h-screen bg-white overflow-hidden">

                {/* Flying icons cloud */}
                <div className="pointer-events-none absolute inset-0">
                    {Array.from({ length: 30 }).map((_, i) => {
                        const icon = icons[Math.floor(Math.random() * icons.length)]
                        const top = Math.random() * 100
                        const left = Math.random() * 100
                        const size = 24 + Math.random() * 40
                        const duration = 5 + Math.random() * 10
                        const delay = Math.random() * 5
                        const rotate = Math.random() * 360
                        return (
                            <span
                                key={i}
                                className="flying-icon absolute opacity-30"
                                style={{
                                    top: `${top}%`,
                                    left: `${left}%`,
                                    fontSize: `${size}px`,
                                    animationDuration: `${duration}s`,
                                    animationDelay: `${delay}s`,
                                    transform: `rotate(${rotate}deg)`,
                                }}
                            >
                                {icon}
                            </span>
                        )
                    })}
                </div>

                {/* Center content */}
                <main className="relative z-10 flex min-h-screen items-center justify-center px-6">
                    <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white/80 p-10 text-center backdrop-blur-md shadow-xl">

                        {/* Main Icon */}
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                            <img
                                src="/img/money icon.png"
                                alt="Money Icon"
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <h1 className="mb-4 text-4xl font-bold text-gray-900">
                            Welcome to <span className="text-blue-600">IEGS</span>
                        </h1>

                        <p className="mb-8 text-gray-700 text-lg">
                            Know your money. Reach your goals. Live your dreams.
                        </p>


                        {!auth.user ? (
                            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                                <Link
                                    href={login()}
                                    className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Log in
                                </Link>

                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
                                    >
                                        Sign up
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <Link
                                href={dashboard()}
                                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
                            >
                                Go to Dashboard
                            </Link>
                        )}
                    </div>
                </main>

                {/* Flying animations */}
                <style>
                    {`
                        @keyframes fly {
                            0% { transform: translate(0,0) rotate(0deg); }
                            25% { transform: translate(20px, -30px) rotate(10deg); }
                            50% { transform: translate(-20px, 20px) rotate(-10deg); }
                            75% { transform: translate(30px, -10px) rotate(5deg); }
                            100% { transform: translate(0,0) rotate(0deg); }
                        }

                        .flying-icon {
                            animation-name: fly;
                            animation-timing-function: ease-in-out;
                            animation-iteration-count: infinite;
                        }
                    `}
                </style>
            </div>
        </>
    )
}
