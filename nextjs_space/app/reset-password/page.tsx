'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/language-context';
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(language === 'es' 
        ? 'La contraseña debe tener al menos 6 caracteres' 
        : 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError(language === 'es' 
        ? 'Las contraseñas no coinciden' 
        : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success(language === 'es' ? '¡Contraseña actualizada!' : 'Password updated!');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || (language === 'es' ? 'Error al restablecer' : 'Failed to reset'));
      }
    } catch (err) {
      setError(language === 'es' ? 'Error de conexión' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-lg font-medium text-gray-800">
          {language === 'es' ? 'Enlace Inválido' : 'Invalid Link'}
        </h2>
        <p className="text-gray-600 text-sm">
          {language === 'es' 
            ? 'Este enlace de restablecimiento no es válido o ha expirado.'
            : 'This reset link is invalid or has expired.'}
        </p>
        <Link 
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-[#1E3A8A] hover:underline"
        >
          {language === 'es' ? 'Solicitar nuevo enlace' : 'Request new link'}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-lg font-medium text-gray-800">
          {language === 'es' ? '¡Contraseña Actualizada!' : 'Password Updated!'}
        </h2>
        <p className="text-gray-600 text-sm">
          {language === 'es' 
            ? 'Redirigiendo al inicio de sesión...'
            : 'Redirecting to login...'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-gray-600 text-sm text-center">
        {language === 'es' 
          ? 'Ingresa tu nueva contraseña.'
          : 'Enter your new password.'}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Lock className="w-4 h-4 inline mr-1" />
          {language === 'es' ? 'Nueva Contraseña' : 'New Password'}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A]/50 focus:border-[#1E3A8A]"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Lock className="w-4 h-4 inline mr-1" />
          {language === 'es' ? 'Confirmar Contraseña' : 'Confirm Password'}
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A]/50 focus:border-[#1E3A8A]"
          placeholder="••••••••"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#C9A227] hover:bg-[#B8911F] text-white py-3"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {language === 'es' ? 'Guardando...' : 'Saving...'}</>
        ) : (
          language === 'es' ? 'Guardar Nueva Contraseña' : 'Save New Password'
        )}
      </Button>

      <div className="text-center">
        <Link 
          href="/login"
          className="inline-flex items-center gap-2 text-[#1E3A8A] hover:underline text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'es' ? 'Volver al inicio de sesión' : 'Back to login'}
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/assets/mwp-icon.svg"
              alt="MWP"
              width={60}
              height={60}
            />
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">
            {language === 'es' ? 'Nueva Contraseña' : 'New Password'}
          </h1>
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
