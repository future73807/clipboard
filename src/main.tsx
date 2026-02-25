import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import FloatingWindow from './components/FloatingWindow'

export default function Main() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/floating" element={<FloatingWindow />} />
      </Routes>
    </Router>
  )
}