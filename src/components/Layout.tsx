import { Outlet, NavLink } from 'react-router-dom';
import { Map, Library, PlusCircle } from 'lucide-react';
import clsx from 'clsx';

export function Layout() {
    return (
        <div className="flex flex-col h-[100dvh] w-screen bg-neutral-900 text-neutral-100 overflow-hidden">
            <main className="flex-1 relative overflow-hidden">
                <Outlet />
            </main>

            <nav className="h-16 bg-neutral-900 border-t border-neutral-800 flex items-center justify-around px-2 z-[1000] shrink-0 pb-safe">
                <NavLink
                    to="/"
                    className={({ isActive }) => clsx(
                        "p-2 flex flex-col items-center transition-colors",
                        isActive ? "text-[var(--color-primary)]" : "text-neutral-500 hover:text-neutral-300"
                    )}
                >
                    <Map size={24} />
                    <span className="text-[10px] mt-1 font-medium tracking-wide">TREK</span>
                </NavLink>

                <NavLink
                    to="/capture"
                    className={clsx(
                        "p-3 flex items-center justify-center -mt-8 bg-neutral-800 rounded-full border-4 border-neutral-900 shadow-lg text-[var(--color-primary)] active:scale-95 transition-transform"
                    )}
                    aria-label="Capture Point"
                >
                    <PlusCircle size={32} strokeWidth={2.5} />
                </NavLink>


                <NavLink
                    to="/library"
                    className={({ isActive }) => clsx(
                        "p-2 flex flex-col items-center transition-colors",
                        isActive ? "text-[var(--color-primary)]" : "text-neutral-500 hover:text-neutral-300"
                    )}
                >
                    <Library size={24} />
                    <span className="text-[10px] mt-1 font-medium tracking-wide">LIBRARY</span>
                </NavLink>
            </nav>
        </div>
    );
}
