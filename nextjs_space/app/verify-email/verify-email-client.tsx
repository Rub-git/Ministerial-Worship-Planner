'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Mail, RefreshCw, Clock } from 'lucide-react';

type VerificationState = 'loading' | 'already-verified' | 'expired' | 'error';

export function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('No verification token provided.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.expired) {
          setState('expired');
          setMessage(data.error || 'Verification link has expired.');
        } else {
          setState('error');
          setMessage(data.error || 'Verification failed.');
        }
        return;
      }

      if (data.alreadyVerified) {
        setState('already-verified');
        setMessage('Your email has already been verified.');
      } else {
        // Redirect to account-activated page on successful verification
        router.replace('/account-activated');
        return;
      }
    } catch (err) {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail.trim()) return;
    
    setResending(true);
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
      } else {
        setMessage(data.error || 'Failed to resend verification email.');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-mwp-gray to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-mwp-blue animate-spin" />
            </div>
            <CardTitle className="text-2xl text-mwp-blue">Verifying Email</CardTitle>
            <CardDescription>
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Already verified state (success redirects to /account-activated)
  if (state === 'already-verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-mwp-gray to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Already Verified</CardTitle>
            <CardDescription className="text-base">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              Your email has already been verified. You can proceed to log in.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full bg-mwp-blue hover:bg-mwp-blue/90"
            >
              Continue to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Expired state - show resend option
  if (state === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-mwp-gray to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-amber-800">Link Expired</CardTitle>
            <CardDescription className="text-base">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resendSuccess ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-800">
                  <strong>New verification email sent!</strong><br />
                  Please check your inbox.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 text-center">
                  Enter your email address to receive a new verification link:
                </p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mwp-blue focus:border-transparent"
                />
                <Button
                  onClick={handleResendVerification}
                  disabled={resending || !resendEmail.trim()}
                  className="w-full"
                >
                  {resending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-2" /> Resend Verification Email</>
                  )}
                </Button>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/login" className="text-sm text-mwp-blue hover:underline">
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-mwp-gray to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-800">Verification Failed</CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resendSuccess ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-800">
                <strong>New verification email sent!</strong><br />
                Please check your inbox.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 text-center">
                Need a new verification link? Enter your email:
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mwp-blue focus:border-transparent"
              />
              <Button
                onClick={handleResendVerification}
                disabled={resending || !resendEmail.trim()}
                className="w-full"
              >
                {resending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Resend Verification Email</>
                )}
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-mwp-blue hover:underline">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
