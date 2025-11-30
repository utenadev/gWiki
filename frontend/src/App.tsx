/**
 * Main App component with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { PageView } from './pages/PageView';
import { PageEditor } from './pages/PageEditor';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen">
                <Header />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/page/:id" element={<PageView />} />
                    <Route path="/new" element={<PageEditor />} />
                    <Route path="/edit/:id" element={<PageEditor />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
