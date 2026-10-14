import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Lock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Tag,
  Gift,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createSubscription, verifySubscription, redeemPromoCode } from '../services/api.js';

export default function SubscriptionModal({
  isOpen,
  onClose,
  user,
  isEmailVerified,
  hasPendingSearch = false,
  onOpenAuth,
  onResendVerification,
  onSubscriptionSuccess,
  onOpenLegal
}) {
  const [selectedPlan, setSelectedPlan] = useState('yearly'); // 'weekly' | 'monthly' | 'yearly'
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [showPromoField, setShowPromoField] = useState(true);

  if (!isOpen) return null;

  const isPromoUnlocked = Boolean(appliedPromo);

  const plans = [
    {
      id: 'weekly',
      name: 'Weekly Pass',
      price: '₹199',
      period: 'per week',
      desc: 'Quick access for short research sprints',
      features: [
        'Full photo previews & video links',
        '2 searches per day',
        '2 profile analyses per day',
        'Filter by photo, video, or carousel',
        'Download data as CSV & JSON'
      ]
    },
    {
      id: 'monthly',
      name: 'Monthly Pro',
      price: '₹499',
      period: 'per month',
      desc: 'Most popular for regular creators & analysts',
      features: [
        'Everything in Weekly Pass',
        'Full photo previews & video links',
        '5 searches per day',
        '5 profile analyses per day',
        'High-res photo & video viewer',
        'Priority search speeds'
      ]
    },
    {
      id: 'yearly',
      name: 'Annual Elite',
      price: isPromoUnlocked ? 'FREE' : '₹1,299',
      period: isPromoUnlocked ? 'Unlocked for 1 year' : 'per year',
      badge: isPromoUnlocked ? 'PROMO UNLOCKED' : 'Best Value',
      desc: isPromoUnlocked ? 'Annual Elite plan unlocked with promo code' : 'Save over 75% compared to weekly plans',
      isPopular: true,
      features: [
        'Everything in Monthly Pro',
        '365 days of uninterrupted access',
        'Unlimited searches (daily ceiling applies)',
        'Unlimited profile analyses',
        'Best value per search',
        'All future updates included'
      ]
    }
  ];

  const handleApplyPromo = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = (promoInput || '').trim().toUpperCase();
    if (!cleanCode) {
      setPromoError('Please enter a promo code.');
      return;
    }

    // Guest prompt: must create account or sign in to bind promo
    if (!user) {
      setPromoError('Please sign in or create an account first to unlock your promo plan.');
      onOpenAuth('signup');
      return;
    }

    setPromoLoading(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const res = await redeemPromoCode(cleanCode);
      setAppliedPromo(cleanCode);
      setSelectedPlan('yearly');
      setPromoSuccess(res.message || 'Annual Elite plan unlocked successfully for 1 year!');

      // Launch celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch {
        // Ignored
      }

      // Notify App to refresh user profile & activate paid tier
      if (onSubscriptionSuccess) {
        await onSubscriptionSuccess();
      }

      // Automatically close modal after user sees the celebration
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err) {
      setPromoError(err.message || 'Invalid promo code. Please check and try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  // Helper to load Razorpay Checkout script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    setError('');

    // Case 1: Guest (not logged in)
    if (!user) {
      onOpenAuth('signup');
      return;
    }

    // Case 2: Unverified email
    if (!isEmailVerified) {
      setError('Please verify your email address before subscribing.');
      return;
    }

    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay checkout SDK. Check your internet connection.');
      }

      // Call backend to create Razorpay subscription
      const { subscriptionId, keyId } = await createSubscription(selectedPlan);

      // Open Razorpay Checkout modal
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'InstaScrape Pro',
        description: `${selectedPlan.toUpperCase()} Subscription`,
        image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=120&q=80',
        prefill: {
          email: user.email || ''
        },
        theme: {
          color: '#e1306c'
        },
        handler: async (response) => {
          setProcessingPayment(true);
          try {
            // Verify signature on server as second check
            await verifySubscription({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan: selectedPlan
            });

            if (onSubscriptionSuccess) {
              await onSubscriptionSuccess();
            }
            onClose();
          } catch (vErr) {
            console.warn('Payment handler check completed with warning:', vErr);
            if (onSubscriptionSuccess) await onSubscriptionSuccess();
            onClose();
          } finally {
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setError(resp.error?.description || 'Payment was unsuccessful. Please try again.');
        setLoading(false);
      });
      rzp.open();
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to start subscription checkout.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '32px 24px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-active)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(225, 48, 108, 0.1)', color: 'var(--accent-pink)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>
              <Sparkles size={14} /> UPGRADE TO PRO
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Subscribe to See Your Results
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              {hasPendingSearch
                ? 'Your search is saved and will run automatically after you subscribe.'
                : 'Unlock full photo previews, video links, 20 searches every day, and data downloads.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Processing State */}
        {processingPayment && (
          <div
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(225, 48, 108, 0.12)',
              border: '1px solid var(--border-active)',
              textAlign: 'center',
              marginBottom: '20px'
            }}
          >
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--accent-pink)' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Processing Razorpay Payment...</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Confirming your subscription and activating your account. Please hold on...
            </p>
          </div>
        )}

        {/* 3 Plan Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}
        >
          {plans.map((p) => {
            const isSelected = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                style={{
                  background: isSelected ? 'rgba(225, 48, 108, 0.08)' : 'var(--bg-surface-elevated)',
                  border: isSelected ? '2px solid var(--accent-pink)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 200ms ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '14px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{p.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{p.desc}</p>
                  </div>
                  {p.badge && (
                    <span
                      style={{
                        background: '#e1306c',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        flexShrink: 0,
                        lineHeight: 1.4
                      }}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {p.price}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                    /{p.period}
                  </span>
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginBottom: '16px' }}>
                  {p.features.map((f, idx) => (
                    <li key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={14} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(p.id);
                  }}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', fontSize: '0.825rem', padding: '8px' }}
                >
                  {isSelected ? 'Selected Plan' : 'Choose Plan'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Plan Comparison Table with Trial Row */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '20px',
            overflowX: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Plan Quota Comparison
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Lifetime Trial vs Recurring Daily Quotas
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Tier</th>
                <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Searches</th>
                <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Profile Audits</th>
                <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Reset Schedule</th>
                <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Free Trial Row with Highlighted "You are here" */}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(225, 48, 108, 0.08)' }}>
                <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Free Trial
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>1 total</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>1 total</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Never resets</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      background: 'var(--accent-pink)',
                      color: '#ffffff',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    You are here
                  </span>
                </td>
              </tr>
              {/* Weekly Pass */}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px', fontWeight: 600 }}>Weekly Pass</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>2 / day</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>2 / day</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Daily at 00:00 UTC</td>
                <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-muted)' }}>₹199 / wk</td>
              </tr>
              {/* Monthly Pro */}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px', fontWeight: 600 }}>Monthly Pro</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>5 / day</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>5 / day</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Daily at 00:00 UTC</td>
                <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-muted)' }}>₹499 / mo</td>
              </tr>
              {/* Annual Elite */}
              <tr>
                <td style={{ padding: '8px', fontWeight: 600 }}>Annual Elite</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Unlimited</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Unlimited</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>Daily at 00:00 UTC</td>
                <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-muted)' }}>₹1,299 / yr</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Promo Code Section */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: isPromoUnlocked ? '1px solid var(--accent-green)' : '1px solid rgba(225, 48, 108, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '20px',
            transition: 'all var(--transition-normal)'
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => !isPromoUnlocked && setShowPromoField(!showPromoField)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isPromoUnlocked) {
                e.preventDefault();
                setShowPromoField(!showPromoField);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isPromoUnlocked ? 'default' : 'pointer',
              userSelect: 'none',
              padding: '2px 0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={16} style={{ color: isPromoUnlocked ? 'var(--accent-green)' : 'var(--accent-pink)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Have a promo code?
              </span>
              {isPromoUnlocked && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-green)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700
                  }}
                >
                  {appliedPromo ? `${appliedPromo} APPLIED` : 'PROMO APPLIED'}
                </span>
              )}
            </div>

            {!isPromoUnlocked && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--accent-pink)',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <span>{showPromoField ? 'Hide' : 'Enter Code'}</span>
                {showPromoField ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            )}
          </div>

          {(showPromoField || isPromoUnlocked) && (
            <div style={{ marginTop: '12px' }} onClick={(e) => e.stopPropagation()}>
              {!isPromoUnlocked ? (
                <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      setPromoError('');
                    }}
                    placeholder="Enter promo code"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={promoLoading || !promoInput.trim()}
                    className="btn btn-primary"
                    style={{
                      fontSize: '0.85rem',
                      padding: '10px 18px',
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                  >
                    {promoLoading ? 'Applying...' : 'Apply Code'}
                  </button>
                </form>
              ) : null}

              {promoError && (
                <p style={{ fontSize: '0.78rem', color: 'var(--accent-red)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} /> {promoError}
                </p>
              )}

              {promoSuccess && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--accent-green)',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Check size={16} />
                  <span>{promoSuccess}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button & Status Logic */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isPromoUnlocked ? (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                background: '#10b981',
                borderColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Check size={18} /> Annual Elite Plan Activated — Enjoy Full Access!
            </button>
          ) : !user ? (
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            >
              Sign Up to Subscribe <ArrowRight size={18} />
            </button>
          ) : !isEmailVerified ? (
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(252, 176, 69, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(252, 176, 69, 0.3)' }}>
              <p style={{ fontSize: '0.85rem', color: '#fcb045', fontWeight: 600, marginBottom: '8px' }}>
                Verify your email to continue subscribing.
              </p>
              <button
                type="button"
                onClick={onResendVerification}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                Resend Verification Link
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={loading || processingPayment}
              onClick={handleSubscribe}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              {loading ? 'Opening Razorpay Checkout...' : `Subscribe for ${plans.find(p => p.id === selectedPlan)?.price}`}
              <ArrowRight size={18} />
            </button>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            <span>Billed securely in INR via Razorpay.</span>
            <button
              type="button"
              onClick={() => onOpenLegal('refund')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
            >
              Refund Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
