import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MainPage from './pages/MainPage';
import DevelopmentPage from './pages/DevelopmentPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import './App.css';

/**
 * Main App Component with Routing
 * 
 * Sets up routing between the main production page and development page.
 * In production builds, the development route should be disabled.
 */
function App() {
    // Allow development page in localhost environments
    const is_development = process.env.NODE_ENV === 'development' || 
                          window.location.hostname === 'localhost';

    return (
        <Router>
            <div className="App">
                {/* Navigation Bar */}
                <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/">
                            📚 ExamPro Scheduler
                        </Link>
                        
                        {/* Hamburger Toggle Button */}
                        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        
                        {/* Collapsible Navigation Content */}
                        <div className="collapse navbar-collapse" id="navbarNav">
                            <div className="navbar-nav me-auto">
                                <Link className="nav-link" to="/">
                                    🏠 Trang Chủ
                                </Link>
                                {is_development && (
                                    <Link className="nav-link" to="/development">
                                        🛠️ Development
                                    </Link>
                                )}
                            </div>
                            <div className="navbar-nav">
                                <Link className="nav-link" to="/login">
                                    🔐 Đăng Nhập
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className='container-fluid d-flex flex-column flex-grow-1 bg-body-secondary'>
                    <Routes>
                        <Route path="/" element={<MainPage />} />
                        {is_development && (
                            <Route path="/development" element={<DevelopmentPage />} />
                        )}
                        {/* Fallback route */}
                        <Route path="*" element={
                            <div className="container mt-5 text-center">
                                <h2>404 - Trang không tồn tại</h2>
                                <p>Trang bạn đang tìm kiếm không tồn tại.</p>
                                <Link to="/" className="btn btn-primary">
                                    Về Trang Chủ
                                </Link>
                            </div>
                        } />

                        <Route path="/login" element={<LoginPage></LoginPage>}/>
                        <Route path="/forgot-password" element={<ForgotPasswordPage></ForgotPasswordPage>}/>
                    </Routes>
                </main>

                {/* Footer */}
                <footer className="bg-light text-center p-3">
                    <small className="text-muted">
                        © 2025 ExamPro Scheduler - Hệ thống quản lý lịch thi
                        {is_development && (
                            <span className="ms-2 badge bg-warning text-dark">
                                DEVELOPMENT MODE
                            </span>
                        )}
                    </small>
                </footer>
            </div>
        </Router>
    );
}

export default App;