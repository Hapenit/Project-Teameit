import { API_BASE_URL } from '../config/api';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';
import ContactProfileDrawer from './ContactProfileDrawer';
import CsvImportModal from './CsvImportModal';

export default function CrmDashboard() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchContacts = useCallback(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/crm/contacts`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'x-tenant-id': activeTenant?.id || ''
          }
        });
        const json = await response.json();
        
        if (json.success) {
          setContacts(json.data);
        } else {
          setError(json.error?.message || 'Failed to fetch contacts');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, [session, activeTenant]);
  useEffect(() => {
    if (session && activeTenant) {
      // eslint-disable-next-line react/set-state-in-effect
      fetchContacts();
    }
  }, [session, activeTenant, fetchContacts]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">CRM Contacts</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="bg-white border text-gray-700 px-4 py-2 rounded hover:bg-gray-50 font-medium">
            Import CSV
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded">
            + Add Contact
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Name</th>
              <th className="p-4 font-medium text-gray-500">Contact Info</th>
              <th className="p-4 font-medium text-gray-500">Status</th>
              <th className="p-4 font-medium text-gray-500">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Loading contacts...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No contacts found.</td></tr>
            ) : (
              contacts.map(contact => (
                <tr key={contact.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedContact(contact)}>
                  <td className="p-4 font-medium">
                    {contact.first_name} {contact.last_name}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <div>{contact.email || '-'}</div>
                    <div>{contact.phone || '-'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {contact.lead_status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {contact.contact_tags?.map((ct: any) => (
                      <span key={ct.tags.name} className="inline-block px-2 py-1 bg-gray-100 rounded text-xs mr-2">
                        {ct.tags.name}
                      </span>
                    )) || 'None'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedContact && (
        <ContactProfileDrawer 
          contact={selectedContact} 
          onClose={() => setSelectedContact(null)} 
          onSaved={() => {
            setSelectedContact(null);
            fetchContacts();
          }} 
        />
      )}

      {showImportModal && (
        <CsvImportModal 
          onClose={() => setShowImportModal(false)}
          onImportSuccess={() => {
            setShowImportModal(false);
            fetchContacts();
          }}
        />
      )}
    </div>
  );
}
