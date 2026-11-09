import { StoreProvider } from './store/StoreContext';
import { UIProvider, useUI } from './store/UIContext';
import { TooltipProvider } from './store/TooltipContext';
import { AuthProvider } from './store/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EditorModal from './components/editor/EditorModal';
import Dashboard from './components/views/Dashboard';
import Safety from './components/views/Safety';
import Reliability from './components/views/Reliability';
import CostSaving from './components/views/CostSaving';
import MaintenanceCost from './components/views/MaintenanceCost';
import ShutdownActivities from './components/views/ShutdownActivities';
import ShutdownPerformance from './components/views/ShutdownPerformance';
import ConcerningEquipment from './components/views/ConcerningEquipment';
import MonthlySlides from './components/views/MonthlySlides';
import PresentDeck from './components/present/PresentDeck';
import { usePresentSlides } from './components/present/usePresentSlides';

function ActiveView() {
  const { view } = useUI();
  switch (view) {
    case 'dashboard':
      return <Dashboard />;
    case 'safety':
      return <Safety />;
    case 'reliability':
      return <Reliability />;
    case 'cost':
      return <CostSaving />;
    case 'maint':
      return <MaintenanceCost />;
    case 'shutdown':
      return <ShutdownActivities />;
    case 'shutdownPerf':
      return <ShutdownPerformance />;
    case 'concern':
      return <ConcerningEquipment />;
    case 'slides':
      return <MonthlySlides />;
    default:
      return null;
  }
}

function Shell() {
  const { presentOpen, setPresentOpen } = useUI();
  const presentSlides = usePresentSlides();
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#eef1f5' }}>
        <Header />
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 26px 60px' }}>
          <ActiveView />
        </div>
      </main>
      <EditorModal />
      <PresentDeck open={presentOpen} slides={presentSlides} onClose={() => setPresentOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <UIProvider>
          <TooltipProvider>
            <Shell />
          </TooltipProvider>
        </UIProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
