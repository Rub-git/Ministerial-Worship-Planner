'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, Mail, Lock, Globe, Church, Loader2, CheckCircle2, AlertCircle, ArrowLeft, BookOpen, Users, Heart, Flame, Cross } from 'lucide-react';

// Map denomination IDs to display info
const DENOMINATION_INFO: Record<string, { name: string; nameEs: string; icon: React.ElementType; color: string }> = {
  'Seventh-day Adventist': { name: 'Seventh-day Adventist', nameEs: 'Adventista del Séptimo Día', icon: BookOpen, color: 'bg-blue-600' },
  'Baptist': { name: 'Baptist', nameEs: 'Bautista', icon: Users, color: 'bg-indigo-600' },
  'Methodist': { name: 'Methodist', nameEs: 'Metodista', icon: Heart, color: 'bg-green-600' },
  'Pentecostal': { name: 'Pentecostal', nameEs: 'Pentecostal', icon: Flame, color: 'bg-orange-600' },
  'Presbyterian': { name: 'Presbyterian', nameEs: 'Presbiteriano', icon: Building2, color: 'bg-purple-600' },
  'Non-denominational': { name: 'Non-denominational', nameEs: 'No Denominacional', icon: Church, color: 'bg-teal-600' },
  'OTHER': { name: 'Other Christian Tradition', nameEs: 'Otra Tradición Cristiana', icon: Globe, color: 'bg-gray-600' },
};

export function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);

  // Get denomination and customDenomination from URL params
  const urlDenomination = searchParams.get('denomination') || 'OTHER';
  const urlCustomDenomination = searchParams.get('customDenomination') || '';

  // Organization details
  const [organizationName, setOrganizationName] = useState('');
  const [organizationNameEs, setOrganizationNameEs] = useState('');
  const [denomination, setDenomination] = useState(urlDenomination);
  const [customDenomination, setCustomDenomination] = useState(urlCustomDenomination);

  // Update denomination when URL params change
  useEffect(() => {
    if (searchParams.get('denomination')) {
      setDenomination(searchParams.get('denomination') || 'OTHER');
    }
    if (searchParams.get('customDenomination')) {
      setCustomDenomination(searchParams.get('customDenomination') || '');
    }
  }, [searchParams]);

  const denomInfo = DENOMINATION_INFO[denomination] || DENOMINATION_INFO['OTHER'];
  const DenomIcon = denomInfo.icon;
  
  // Display name includes custom denomination if specified
  const displayDenominationName = denomination === 'OTHER' && customDenomination
    ? customDenomination
    : denomInfo.name;

  // Admin user details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Anti-bot protection (honeypot + timing)
  const [honeypot, setHoneypot] = useState(''); // Hidden field - should remain empty
  const formStartTime = useRef<number>(Date.now()); // Track when form was loaded

  const validateStep1 = () => {
    if (!organizationName.trim()) {
      setError('Church/Organization name is required');
      return false;
    }
    if (organizationName.length < 3) {
      setError('Organization name must be at least 3 characters');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!adminName.trim()) {
      setError('Administrator name is required');
      return false;
    }
    if (!adminEmail.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (adminPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    // Anti-bot: Check if honeypot was filled (bots usually fill all fields)
    if (honeypot) {
      setError('Registration failed. Please try again.');
      return;
    }

    // Anti-bot: Check if form was submitted too quickly (less than 3 seconds)
    const timeSpent = Date.now() - formStartTime.current;
    if (timeSpent < 3000) {
      setError('Please take a moment to fill out the form correctly.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          organizationNameEs: organizationNameEs.trim() || null,
          denomination,
          customDenomination: denomination === 'OTHER' ? customDenomination.trim() || null : null,
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim().toLowerCase(),
          adminPassword,
          // Anti-bot fields for server-side validation
          _hp: honeypot,
          _ts: formStartTime.current,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create organization');
        return;
      }

      setSuccess(true);

    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-mwp-blue" />
            </div>
            <CardTitle className="text-2xl text-mwp-blue">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-mwp-blue/10 p-4 rounded-lg">
              <p className="text-sm text-mwp-blue">
                <strong>Verify your email</strong> to activate your account and start your <strong>30-day free trial</strong>.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>The verification link will expire in 24 hours.</strong><br />
                Check your spam folder if you don't see the email.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
            >
              Go to Login
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already verified? You can log in now.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-mwp-gray to-white p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/assets/mwp-logo.jpg"
              alt="Ministerial Worship Planner"
              width={160}
              height={160}
              className="w-32 h-32 object-contain rounded-lg"
              priority
            />
          </div>
          <CardTitle className="text-2xl text-mwp-blue">Create Church Account</CardTitle>
          <CardDescription>
            Register your church to start managing worship programs
          </CardDescription>
          
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-mwp-blue text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 rounded ${step >= 2 ? 'bg-mwp-blue' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-mwp-blue text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Step {step} of 2: {step === 1 ? 'Church Details' : 'Administrator Account'}
          </p>
        </CardHeader>

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                {/* Selected Denomination Display */}
                <div className="bg-mwp-gray border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${denomInfo.color} rounded-lg flex items-center justify-center`}>
                      <DenomIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Selected Tradition</p>
                      <p className="font-semibold text-mwp-blue">{displayDenominationName}</p>
                      {denomination === 'OTHER' && customDenomination && (
                        <p className="text-xs text-gray-500">(Other Christian Tradition)</p>
                      )}
                    </div>
                    <Link
                      href="/start"
                      className="text-sm text-mwp-blue hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Change
                    </Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Church/Organization Name *
                  </Label>
                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="e.g., First Baptist Church of Springfield"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationNameEs" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Nombre en Español (optional)
                  </Label>
                  <Input
                    id="organizationNameEs"
                    type="text"
                    placeholder="e.g., Primera Iglesia Bautista de Springfield"
                    value={organizationNameEs}
                    onChange={(e) => setOrganizationNameEs(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    For bilingual programs and exports
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="adminName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Administrator Name *
                  </Label>
                  <Input
                    id="adminName"
                    type="text"
                    placeholder="Your full name"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@yourchurch.org"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password *
                  </Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="At least 8 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Anti-bot honeypot field - hidden from humans, bots will fill it */}
            <div 
              aria-hidden="true" 
              style={{ 
                position: 'absolute', 
                left: '-9999px', 
                opacity: 0, 
                height: 0, 
                overflow: 'hidden',
                pointerEvents: 'none'
              }}
            >
              <label htmlFor="website_url">Website URL</label>
              <input
                type="text"
                id="website_url"
                name="website_url"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <div className="flex gap-2 w-full">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : step === 1 ? (
                  'Continue'
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">🎁 30-day free trial included</p>
              Already have an account?{' '}
              <Link href="/login" className="text-mwp-blue hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
