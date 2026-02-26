import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import FloatingWindow from './components/FloatingWindow'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/floating" element={<FloatingWindow />} />
      </Routes>
    </Router>
  </React.StrictMode>
)
