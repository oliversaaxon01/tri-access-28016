import { useAuth } from '@/contexts/AuthContext';
import EmpresaDashboard from './EmpresaDashboard';
import ExpertoDashboard from './ExpertoDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Route to specific dashboard based on role
  if (user?.role === 'empresa') {
    return <EmpresaDashboard />;
  }

  if (user?.role === 'experto') {
    return <ExpertoDashboard />;
  }

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return null;
};

export default Dashboard;
