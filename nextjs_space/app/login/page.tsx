'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/language-context';
import { LogIn, Mail, Lock, AlertCircle, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationNeeded, setShowVerificationNeeded] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast?.error?.('Please enter your email address first');
      return;
    }

    setResending(true);
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
        toast?.success?.('Verification email sent!');
      } else {
        toast?.error?.(data.error || 'Failed to resend verification email');
      }
    } catch (err) {
      toast?.error?.('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setLoading(true);
    setShowVerificationNeeded(false);
    setResendSuccess(false);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check for email not verified error
        if (result.error === 'EMAIL_NOT_VERIFIED' || result.error.includes('EMAIL_NOT_VERIFIED')) {
          setShowVerificationNeeded(true);
        } else {
          toast?.error?.('Invalid email or password');
        }
        setLoading(false);
      } else if (result?.ok) {
        // Force page reload to update session
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Login error:', error);
      toast?.error?.(t?.error ?? 'An error occurred');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mwp-blue" />
      </div>
    );
  }
  
  if (status === 'authenticated') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mwp-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/assets/mwp-logo.jpg"
              alt="Ministerial Worship Planner"
              width={200}
              height={200}
              className="w-40 h-40 object-contain rounded-lg"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-mwp-blue">{t?.login ?? 'Login'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Verification Needed Banner */}
          {showVerificationNeeded && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Please verify your email to activate your account.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Check your inbox for the verification link.
                  </p>
                  
                  {resendSuccess ? (
                    <div className="flex items-center gap-2 mt-3 text-green-700 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Verification email sent! Check your inbox.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium"
                    >
                      {resending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                      ) : (
                        <><RefreshCw className="w-4 h-4" /> Resend verification email</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              {t?.email ?? 'Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e?.target?.value ?? '')}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mwp-blue/50 focus:border-mwp-blue"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Lock className="w-4 h-4 inline mr-1" />
              {t?.password ?? 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e?.target?.value ?? '')}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mwp-blue/50 focus:border-mwp-blue"
              placeholder="••••••••"
            />
            <div className="text-right mt-1">
              <Link href="/forgot-password" className="text-sm text-mwp-blue hover:underline">
                Forgot password? / ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-mwp-blue text-white rounded-lg hover:bg-mwp-blue/90 disabled:opacity-50 transition-colors font-medium"
          >
            <LogIn className="w-5 h-5" />
            {loading ? (t?.loading ?? 'Loading...') : (t?.login ?? 'Login')}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          {"Don't have an account?"}{' '}
          <Link href="/register" className="text-mwp-blue hover:text-mwp-blue/80 font-medium">
            Register Church
          </Link>
        </p>
      </div>
    </div>
  );
}
