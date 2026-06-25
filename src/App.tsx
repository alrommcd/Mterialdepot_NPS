import { NpsProvider } from './state/NpsStore';
import CrmShell from './components/CrmShell';
import './index.css';

export default function App() {
  return (
    <NpsProvider>
      <CrmShell />
    </NpsProvider>
  );
}
