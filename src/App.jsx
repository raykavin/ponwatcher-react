import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import FormPage from './pages/FormPage'
import StatusPage from './pages/StatusPage'

function App() {
  const [formData, setFormData] = useState({
    slot: '',
    card: ''
  });

  const handleFormSubmit = (data) => {
    setFormData(data);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 font-mono text-cyan-400">
        <Routes>
          <Route path="/" element={<FormPage onSubmit={handleFormSubmit} />} />
          <Route path="/status" element={<StatusPage formData={formData} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;