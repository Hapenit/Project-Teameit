import { API_BASE_URL } from '../config/api';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Exchanging token securely...');
  
  // Use a ref to prevent double-firing in React StrictMode
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const providerError = searchParams.get('error_description') || searchParams.get('error');

    if (providerError) {
      setStatus(`Google authorization failed: ${providerError}`);
      setTimeout(() => navigate('/integrations'), 4000);
      return;
    }
    if (!code || !state) {
      setStatus('Invalid callback parameters.');
      setTimeout(() => navigate('/integrations'), 3000);
      return;
    }

    const exchangeToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/integrations/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, state })
        });

        const json = await response.json();
        if (json.success) {
          setStatus('Connected successfully! Redirecting...');
          setTimeout(() => navigate('/integrations'), 1500);
        } else {
          setStatus(`Failed to connect: ${json.error?.message}`);
          setTimeout(() => navigate('/integrations'), 3000);
        }
      } catch (err: any) {
        setStatus(`Network error: ${err.message}`);
        setTimeout(() => navigate('/integrations'), 3000);
      }
    };

    exchangeToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border text-center max-w-sm w-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold mb-2">Connecting Integration</h2>
        <p className="text-gray-500 text-sm">{status}</p>
      </div>
    </div>
  );
}
