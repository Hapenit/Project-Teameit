import { API_BASE_URL } from '../config/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

export default function MediaLibrary() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/media`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        }
      });
      const json = await response.json();
      if (json.success) {
        setMedia(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session, activeTenant]);

  useEffect(() => {
    if (session && activeTenant) {
      // eslint-disable-next-line react/set-state-in-effect
      fetchMedia();
    }
  }, [session, activeTenant, fetchMedia]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        },
        body: formData
      });
      const json = await response.json();
      if (json.success) {
        fetchMedia();
      } else {
        alert(json.error?.message || 'Upload failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/media/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        }
      });
      const json = await response.json();
      if (json.success) {
        setMedia(media.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Media Library</h1>
          <p className="text-gray-500">Manage your images and videos for publishing and campaigns.</p>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept="image/*,video/*,application/pdf"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {uploading ? 'Uploading...' : '+ Upload Asset'}
        </button>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop a media file here or choose a file"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click();
        }}
        onDragEnter={(event) => { event.preventDefault(); setIsDragActive(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={async (event) => {
          event.preventDefault();
          setIsDragActive(false);
          const file = event.dataTransfer.files[0];
          if (file && !uploading) await uploadFile(file);
        }}
        className={`mb-8 rounded-xl border-2 border-dashed p-6 text-center text-sm transition-colors ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 bg-gray-50'
        }`}
      >
        {uploading ? 'Uploading file…' : 'Drop an image, video, or PDF here, or press Enter to choose a file.'}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading media...</div>
      ) : media.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 border-2 border-dashed rounded-xl">
          <p className="text-gray-500 mb-4">No media assets found.</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-primary font-medium hover:underline"
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((asset) => (
            <div key={asset.id} className="group relative border rounded-xl overflow-hidden bg-gray-50 aspect-square shadow-sm flex flex-col">
              {asset.mime_type?.startsWith('image/') ? (
                <img src={asset.file_url} alt={asset.filename} className="w-full h-full object-cover" />
              ) : asset.mime_type?.startsWith('video/') ? (
                <video src={asset.file_url} controls preload="metadata" className="w-full h-full object-cover" aria-label={asset.filename} />
              ) : asset.mime_type === 'application/pdf' ? (
                <object data={asset.file_url} type="application/pdf" className="w-full h-full" aria-label={asset.filename}>
                  <a href={asset.file_url} target="_blank" rel="noreferrer" className="text-primary underline">Open PDF</a>
                </object>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                  <span className="text-3xl mb-2">▶</span>
                  <span className="text-xs uppercase font-bold text-gray-500">Video</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-end">
                  <button 
                    onClick={() => handleDelete(asset.id)}
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
                <div>
                  <p className="text-white text-xs font-medium truncate mb-1" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <p className="text-gray-300 text-[10px]">
                    {(asset.size_bytes / 1024).toFixed(1)} KB • {new Date(asset.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
