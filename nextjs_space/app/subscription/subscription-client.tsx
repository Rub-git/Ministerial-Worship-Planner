'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, AlertTriangle, Clock, CreditCard, XCircle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface SubscriptionStatus {
  organizationName: string;
  subscriptionStatus: string;
  trialEndDate: string | null;
  subscriptionEndDate: string | null;
  planTier: string;
  stripe: {
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
  } | null;
}

export default function SubscriptionClient() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (success === 'true') {
      toast.success(
        language === 'es'
          ? '¡Gracias! Tu suscripción será activada en breve.'
          : 'Thank you! Your subscription will be activated shortly.'
      );
    }
    if (canceled === 'true') {
      toast.error(
        language === 'es'
          ? 'Pago cancelado. Puedes intentar de nuevo cuando quieras.'
          : 'Payment canceled. You can try again anytime.'
      );
    }
  }, [success, canceled, language]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/stripe/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to start checkout');
        setProcessing(false);
      }
    } catch (error) {
      toast.error('Error starting checkout');
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setProcessing(true);
    setShowCancelModal(false);
    
    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          language === 'es'
            ? 'Solicitud de cancelación enviada.'
            : 'Cancellation requested.'
        );
        setTimeout(() => fetchStatus(), 2000);
        setTimeout(() => fetchStatus(), 5000);
      } else {
        toast.error(data.error || 'Failed to cancel');
      }
    } catch (error) {
      toast.error('Error canceling subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          language === 'es'
            ? 'Solicitud de reactivación enviada.'
            : 'Reactivation requested.'
        );
        setTimeout(() => fetchStatus(), 2000);
        setTimeout(() => fetchStatus(), 5000);
      } else {
        toast.error(data.error || 'Failed to reactivate');
      }
    } catch (error) {
      toast.error('Error reactivating subscription');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const showCancelButton = status && 
    ['ACTIVE', 'PAST_DUE'].includes(status.subscriptionStatus) && 
    !status.stripe?.cancelAtPeriodEnd;

  const showReactivateButton = status && 
    status.subscriptionStatus === 'CANCELED' && 
    status.stripe?.cancelAtPeriodEnd;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-[#1E3A8A] mb-6 text-center">
          {language === 'es' ? 'Estado de Suscripción' : 'Subscription Status'}
        </h1>

        {/* Status Card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-slate-700">
              {status?.organizationName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ACTIVE State */}
            {status?.subscriptionStatus === 'ACTIVE' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-lg font-medium text-green-800">
                    {language === 'es' ? 'Suscripción Activa' : 'Active Subscription'}
                  </span>
                </div>
                
                {status.stripe?.currentPeriodEnd && (
                  <p className="text-slate-600 text-sm pl-9">
                    {language === 'es' ? 'Próxima facturación:' : 'Next billing date:'}{' '}
                    <span className="font-medium">{formatDate(status.stripe.currentPeriodEnd)}</span>
                  </p>
                )}

                {showCancelButton && (
                  <div className="pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelModal(true)}
                      disabled={processing}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      {language === 'es' ? 'Cancelar Suscripción' : 'Cancel Subscription'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* CANCELED State */}
            {status?.subscriptionStatus === 'CANCELED' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <span className="text-lg font-medium text-orange-800">
                    {language === 'es' 
                      ? 'Suscripción Programada para Cancelación' 
                      : 'Subscription Scheduled for Cancellation'}
                  </span>
                </div>
                
                {status.subscriptionEndDate && (
                  <p className="text-slate-600 text-sm pl-9">
                    {language === 'es' ? 'Acceso hasta:' : 'Access until:'}{' '}
                    <span className="font-medium">{formatDate(status.subscriptionEndDate)}</span>
                  </p>
                )}

                {showReactivateButton && (
                  <div className="pt-4 border-t border-slate-100">
                    <Button
                      onClick={handleReactivate}
                      disabled={processing}
                      className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
                    >
                      {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {language === 'es' ? 'Reactivar Suscripción' : 'Reactivate Subscription'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* PAST_DUE State */}
            {status?.subscriptionStatus === 'PAST_DUE' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <span className="text-lg font-medium text-yellow-800">
                    {language === 'es' ? 'Problema de Pago Detectado' : 'Payment Issue Detected'}
                  </span>
                </div>
                
                <p className="text-slate-600 text-sm pl-9">
                  {language === 'es' 
                    ? 'Por favor actualiza tu método de pago para continuar sin interrupciones.' 
                    : 'Please update your payment method to continue without interruption.'}
                </p>

                <div className="pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleSubscribe}
                    disabled={processing}
                    className="bg-[#C9A227] hover:bg-[#B8911F] text-white"
                  >
                    {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    <CreditCard className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Actualizar Método de Pago' : 'Update Payment Method'}
                  </Button>
                </div>
              </div>
            )}

            {/* TRIAL State */}
            {status?.subscriptionStatus === 'TRIAL' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-medium text-blue-800">
                    {language === 'es' ? 'Período de Prueba' : 'Trial Period'}
                  </span>
                </div>
                
                {status.trialEndDate && (
                  <p className="text-slate-600 text-sm pl-9">
                    {language === 'es' ? 'Finaliza el:' : 'Ends on:'}{' '}
                    <span className="font-medium">{formatDate(status.trialEndDate)}</span>
                  </p>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleSubscribe}
                    disabled={processing}
                    className="bg-[#C9A227] hover:bg-[#B8911F] text-white"
                  >
                    {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    <CreditCard className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Suscribirse' : 'Subscribe'}
                  </Button>
                </div>
              </div>
            )}

            {/* EXPIRED State */}
            {status?.subscriptionStatus === 'EXPIRED' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-lg font-medium text-red-800">
                    {language === 'es' ? 'Suscripción Expirada' : 'Subscription Expired'}
                  </span>
                </div>
                
                <p className="text-slate-600 text-sm pl-9">
                  {language === 'es' 
                    ? 'Tu acceso está en modo de solo lectura.' 
                    : 'Your access is in view-only mode.'}
                </p>

                <div className="pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleSubscribe}
                    disabled={processing}
                    className="bg-[#C9A227] hover:bg-[#B8911F] text-white"
                  >
                    {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    <CreditCard className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Suscribirse' : 'Subscribe'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link href="/" className="text-[#1E3A8A] hover:underline text-sm">
            ← {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
          </Link>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#1E3A8A]">
              {language === 'es' ? 'Confirmar Cancelación' : 'Confirm Cancellation'}
            </DialogTitle>
            <DialogDescription className="pt-3 text-slate-600">
              {language === 'es'
                ? 'Mantendrás acceso completo hasta el final de tu período de facturación actual.'
                : 'You will retain full access until the end of your current billing period.'}
            </DialogDescription>
          </DialogHeader>
          
          {status?.stripe?.currentPeriodEnd && (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 my-2">
              <p className="text-sm text-slate-700">
                <span className="font-medium">
                  {language === 'es' ? 'Acceso hasta:' : 'Access until:'}
                </span>{' '}
                {formatDate(status.stripe.currentPeriodEnd)}
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              className="w-full sm:w-auto"
            >
              {language === 'es' ? 'Volver' : 'Go Back'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={processing}
              className="w-full sm:w-auto"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {language === 'es' ? 'Sí, Cancelar' : 'Yes, Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
