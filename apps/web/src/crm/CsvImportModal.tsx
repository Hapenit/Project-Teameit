import { API_BASE_URL } from '../config/api';
import { useState } from 'react';
import Papa from 'papaparse';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

interface Props {
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function CsvImportModal({ onClose, onImportSuccess }: Props) {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setPreview(null);
    }
  };

  const handleParse = () => {
    if (!file) return;
    setParsing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsing(false);
        if (results.errors.length > 0) {
          setError(`Parse Error: ${results.errors[0].message}`);
        } else {
          setPreview(results.data);
        }
      },
      error: (err) => {
        setParsing(false);
        setError(err.message);
      }
    });
  };

  const handleUpload = async () => {
    if (!preview || preview.length === 0) return;
    if (!session || !activeTenant) return;

    setUploading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-tenant-id': activeTenant.id
        },
        body: JSON.stringify({ contacts: preview })
      });
      
      const json = await response.json();
      if (json.success) {
        onImportSuccess();
      } else {
        setError(json.error?.message || 'Failed to import contacts');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Import Contacts (CSV)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">&times;</button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            Upload a CSV file containing your contacts. Required headers (exact match): 
            <code className="mx-1 bg-gray-100 px-1 rounded">first_name</code>, 
            <code className="mx-1 bg-gray-100 px-1 rounded">last_name</code>, 
            <code className="mx-1 bg-gray-100 px-1 rounded">email</code>, 
            <code className="mx-1 bg-gray-100 px-1 rounded">phone</code>.
          </p>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
        </div>

        {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded">{error}</div>}

        {!preview && file && (
          <button 
            onClick={handleParse} 
            disabled={parsing}
            className="w-full bg-gray-100 border text-gray-800 py-2 rounded font-medium hover:bg-gray-200"
          >
            {parsing ? 'Parsing...' : 'Preview Data'}
          </button>
        )}

        {preview && (
          <div className="flex-1 overflow-auto border rounded mb-4">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-2 font-medium text-gray-500">First Name</th>
                  <th className="p-2 font-medium text-gray-500">Last Name</th>
                  <th className="p-2 font-medium text-gray-500">Email</th>
                  <th className="p-2 font-medium text-gray-500">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td className="p-2">{row.first_name || '-'}</td>
                    <td className="p-2">{row.last_name || '-'}</td>
                    <td className="p-2">{row.email || '-'}</td>
                    <td className="p-2">{row.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <div className="text-center p-2 text-xs text-gray-500 bg-gray-50">
                Showing first 10 of {preview.length} rows
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-auto pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded font-medium hover:bg-gray-50">Cancel</button>
          <button 
            onClick={handleUpload} 
            disabled={uploading || !preview} 
            className="px-6 py-2 bg-primary text-primary-foreground rounded font-medium hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? 'Importing...' : preview ? `Import ${preview.length} Contacts` : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
