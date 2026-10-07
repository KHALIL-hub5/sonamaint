import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignInPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Engineer',
    password: '',
  });
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Créer un <span className="text-orange-600">Compte</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Création d'accès pour ingénieur / administrateur
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom Complet
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Nom & Prénom"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Professionnel
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@sonatrach.dz"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle / Poste
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border-gray-300"
            >
              <option value="Engineer">Ingénieur Système</option>
              <option value="Admin">Administrateur Système</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border-gray-300"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow transition duration-200 mt-2"
          >
            Créer le compte
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          Vous avez déjà un compte?{' '}
          <button type="button" onClick={() => navigate('/login')} className="text-orange-600 font-semibold hover:underline">
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}