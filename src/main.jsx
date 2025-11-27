import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RequestsPage from './pages/RequestsPage';
import ToolsPage from './pages/ToolsPage';
import LoginPage from './pages/LoginPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/requests" replace />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
