import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ClientView from './ClientView';
import ChefView from './ChefView';
import DesignerView from './DesignerView';
import DevView from './DevView';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div id="app" style={{ display: 'flex' }}>
      <Sidebar />
      <div className="main-with-sidebar">
        {user?.role === 'client'    && <ClientView />}
        {user?.role === 'chef'      && <ChefView />}
        {user?.role === 'designer'  && <DesignerView />}
        {user?.role === 'developer' && <DevView />}
      </div>
    </div>
  );
};

export default Dashboard;
