import { useTenant } from '../tenants/TenantContext';
import { useNavigate } from 'react-router-dom';

export default function TenantSwitcher() {
  const { tenants, activeTenant, switchTenant, loading } = useTenant();
  const navigate = useNavigate();

  if (loading) return <div className="p-2 text-sm">Loading...</div>;

  return (
    <div className="w-full">
      <select 
        className="w-full p-2 border rounded bg-white shadow-sm"
        value={activeTenant?.id || ''}
        onChange={(e) => {
          if (e.target.value === 'new') {
            navigate('/create-workspace');
          } else {
            switchTenant(e.target.value);
          }
        }}
      >
        <option value="" disabled>Select Workspace</option>
        {tenants.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
        <option value="new">+ Create Workspace</option>
      </select>
    </div>
  );
}
