export default function AppLogo() {
    return (
        <div className="flex h-full flex-col items-center justify-center w-full">
            {/* Bigger logo */}
            <div className="h-28 w-28">
                <img
                    src="/img/money icon.png"
                    alt="IEGS Logo"
                    className="h-full w-full object-contain"
                />
            </div>

            {/* App Name */}
            <span className="mt-4 text-2xl font-bold text-black dark:text-white">
                IEGS
            </span>
        </div>
    );
}
