import { API_BASE_URL } from '../config/api';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface TenantMember {
  tenants: Tenant;
  role_id: string;
  status: string;
}

interface TenantContextType {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  switchTenant: (tenantId: string) => Promise<void>;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenants: [],
  activeTenant: null,
  switchTenant: async () => {},
  loading: true
});

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setTimeout(() => {
        setTenants([]);
        setActiveTenant(null);
        setLoading(false);
      }, 0);
      return;
    }

    const fetchTenants = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/tenants`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const json = await response.json();
        if (json.success && json.data) {
          const fetchedTenants = json.data.map((m: TenantMember) => m.tenants);
          setTenants(fetchedTenants);
          
          if (fetchedTenants.length > 0) {
            // Restore from localStorage or pick first
            const savedId = localStorage.getItem('teameit_active_tenant');
            const found = fetchedTenants.find((t: Tenant) => t.id === savedId);
            setActiveTenant(found || fetchedTenants[0]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch tenants', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [session]);

  const switchTenant = async (tenantId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenants/active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ tenant_id: tenantId })
      });
      const json = await response.json();
      if (json.success) {
        const found = tenants.find((t) => t.id === tenantId);
        if (found) {
          setActiveTenant(found);
          localStorage.setItem('teameit_active_tenant', tenantId);
        }
      } else {
        alert(json.error?.message || 'Failed to switch tenant');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <TenantContext.Provider value={{ tenants, activeTenant, switchTenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

// eslint-disable-next-line react/only-export-components
export const useTenant = () => useContext(TenantContext);
