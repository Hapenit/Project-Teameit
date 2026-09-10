import { useState } from 'react';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';

const MARKETING_URL = (import.meta.env.VITE_MARKETING_URL as string | undefined)?.replace(/\/$/, '') || 'https://teameit.com';

export default function AuthPage({ initialMode = 'login' }: { initialMode?: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });
        if (error) throw error;
        // Depending on email confirmation settings, user might need to confirm email
        alert('Check your email for the confirmation link.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Login to Teameit' : 'Create an Account'}
        </h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground font-semibold rounded disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
        {!isLogin && (
          <p className="mt-4 text-center text-xs text-gray-500">
            By creating an account you agree to the{' '}
            <a className="underline" href={`${MARKETING_URL}/terms`} target="_blank" rel="noreferrer">Terms of Service</a>
            {' '}and{' '}
            <a className="underline" href={`${MARKETING_URL}/privacy`} target="_blank" rel="noreferrer">Privacy Policy</a>.
          </p>
        )}
      </div>
    </div>
  );
}
