import { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ClientView from './ClientView';
import ClientContracts from './ClientContracts';
import ChefView from './ChefView';
import DesignerView from './DesignerView';
import DevView from './DevView';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [chefSection, setChefSection] = useState('chef-stats');

  useEffect(() => {
    if (location.state?.section) {
      setChefSection(location.state.section);
    }
  }, [location.state]);

  return (
    <div id="app" style={{ display: 'flex' }}>
      <Sidebar
        chefSection={chefSection}
        onChefNav={user?.role === 'chef' ? setChefSection : (user?.role === 'client' ? setChefSection : undefined)}
      />
      <div className="main-with-sidebar">
        {user?.role === 'client'    && <ClientView section={chefSection} />}
        {user?.role === 'chef'      && <ChefView section={chefSection} />}
        {user?.role === 'designer'  && <DesignerView />}
        {user?.role === 'developer' && <DevView />}
      </div>
    </div>
  );
};

export default Dashboard;
