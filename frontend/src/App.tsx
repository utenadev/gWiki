/**
 * Main App component with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { PageView } from './pages/PageView';
import { PageEditor } from './pages/PageEditor';
import { OrphanedPagesAdmin } from './pages/OrphanedPagesAdmin';
import { BrokenLinksAdmin } from './pages/BrokenLinksAdmin';
import { StatsAdmin } from './pages/StatsAdmin';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen">
                <Header />
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/page/:id" element={<PageView />} />
                            <Route path="/new" element={<PageEditor />} />
                            <Route path="/edit/:id" element={<PageEditor />} />
                            <Route path="/admin/orphaned" element={<OrphanedPagesAdmin />} />
                            <Route path="/admin/broken-links" element={<BrokenLinksAdmin />} />
                            <Route path="/admin/stats" element={<StatsAdmin />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;
