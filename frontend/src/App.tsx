import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import EnrollPage from "./pages/Enroll";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-brand-500 text-white px-6 py-3 flex items-center gap-6 shadow">
        <Link to="/" className="font-bold text-lg tracking-tight">
          🛡️ CoverChain
        </Link>
        <Link to="/dashboard" className="text-sm hover:text-brand-50">
          Dashboard
        </Link>
        <Link to="/enroll" className="text-sm hover:text-brand-50">
          Get Covered
        </Link>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/enroll" element={<EnrollPage />} />
        </Routes>
      </main>
    </div>
  );
}
