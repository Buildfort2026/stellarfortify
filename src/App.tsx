import { Routes, Route } from "react-router";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import TrendPage from "./pages/TrendPage";
import DataTable from "./pages/DataTable";
import AboutPage from "./pages/AboutPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { useInsuranceData } from "./hooks/useInsuranceData";

export default function App() {
  const { curQ, quarters, setCurQ } = useInsuranceData();
  const [navQuarter, setNavQuarter] = useState(curQ || "2026Q1");

  const handleQuarterChange = (qid: string) => {
    setNavQuarter(qid);
    setCurQ(qid);
  };

  return (
    <div className="min-h-screen bg-[#080d1a]">
      <Navbar curQ={navQuarter} quarters={quarters} onQuarterChange={handleQuarterChange} />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trend" element={<TrendPage />} />
          <Route path="/table" element={<DataTable />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
