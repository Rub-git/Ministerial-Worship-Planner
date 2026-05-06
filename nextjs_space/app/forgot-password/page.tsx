'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/language-context';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error(language === 'es' ? 'Ingresa tu correo electrónico' : 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        toast.error(language === 'es' ? 'Error al enviar' : 'Failed to send');
      }
    } catch (error) {
      toast.error(language === 'es' ? 'Error de conexión' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

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
            {language === 'es' ? 'Restablecer Contraseña' : 'Reset Password'}
          </h1>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-800">
              {language === 'es' ? '¡Correo Enviado!' : 'Email Sent!'}
            </h2>
            <p className="text-gray-600 text-sm">
              {language === 'es' 
                ? 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.'
                : 'If an account exists with that email, you will receive a link to reset your password.'}
            </p>
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 text-[#1E3A8A] hover:underline mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'es' ? 'Volver al inicio de sesión' : 'Back to login'}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-gray-600 text-sm text-center">
              {language === 'es' 
                ? 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.'
                : 'Enter your email address and we\'ll send you a link to reset your password.'}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                {language === 'es' ? 'Correo Electrónico' : 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A]/50 focus:border-[#1E3A8A]"
                placeholder="your@email.com"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A227] hover:bg-[#B8911F] text-white py-3"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {language === 'es' ? 'Enviando...' : 'Sending...'}</>
              ) : (
                language === 'es' ? 'Enviar Enlace' : 'Send Reset Link'
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
        )}
      </div>
    </div>
  );
}
