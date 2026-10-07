import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Temporary bypass for testing
    if (email && password) {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Sona<span className="text-orange-600">Maint</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Portail de Maintenance Informatique - Sonatrach
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse Email Professional
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ingenieur@sonatrach.dz"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border-gray-300"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow transition duration-200"
          >
            Se Connecter
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          Vous n'avez pas de compte?{' '}
          <button type="button" onClick={() => navigate('/signin')} className="text-orange-600 font-semibold hover:underline">
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
}