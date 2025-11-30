/**
 * Header component with navigation
 */

import { Link } from 'react-router-dom';

export function Header() {
    return (
        <header className="glass-dark sticky top-0 z-50 animate-fade-in">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                            <span className="text-2xl">📚</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            gWiki<span className="text-purple-300">3</span>
                        </h1>
                    </Link>

                    <nav className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                        >
                            📖 All Pages
                        </Link>
                        <Link
                            to="/new"
                            className="btn-primary"
                        >
                            ✨ New Page
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
