import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChitDetail from './pages/ChitDetail';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chit/:id" element={<ChitDetail />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Layout>
  );
}
