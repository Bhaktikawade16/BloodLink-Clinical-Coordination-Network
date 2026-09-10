import React from 'react';
import { VerificationStatus, EligibilityStatus } from '../types';
import {
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Building2,
  Heart,
  Database,
  CalendarDays,
  FileCheck,
  UserCheck,
  ArrowRight,
  LogOut,
  Sparkles
} from 'lucide-react';

interface BloodLinkVerificationCardProps {
  role: 'donor' | 'hospital' | 'blood_bank' | 'blood_camp';
  userName: string;
  userEmail: string;
  userPhone: string;
  verificationStatus: VerificationStatus;
  eligibilityStatus?: EligibilityStatus;
  roleDetails?: {
    label: string;
    value: string;
  }[];
  onSignOut: () => void;
  onProceedToDashboard?: () => void;
  onQuickVerify?: () => void;
  onQuickReject?: () => void;
}

export const BloodLinkVerificationCard: React.FC<BloodLinkVerificationCardProps> = ({
  role,
  userName,
  userEmail,
  userPhone,
  verificationStatus,
  eligibilityStatus,
  roleDetails = [],
  onSignOut,
  onProceedToDashboard,
  onQuickVerify,
  onQuickReject
}) => {
  const getRoleIcon = () => {
    switch (role) {
      case 'donor':
        return <Heart className="w-6 h-6 text-primary fill-primary/20" />;
      case 'hospital':
        return <Building2 className="w-6 h-6 text-secondary" />;
      case 'blood_bank':
        return <Database className="w-6 h-6 text-tertiary" />;
      case 'blood_camp':
        return <CalendarDays className="w-6 h-6 text-emerald-600" />;
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'donor':
        return 'Hero Donor Portal';
      case 'hospital':
        return 'Hospital & Surgical Center';
      case 'blood_bank':
        return 'Blood Bank Repository';
      case 'blood_camp':
        return 'Blood Camp Organizer';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-4 sm:p-0">
      <div className="bg-surface-container-lowest border border-surface-container rounded-2xl shadow-sm overflow-hidden">
        {/* Header Header */}
        <div className="bg-gradient-to-r from-surface-container-low via-surface-container-lowest to-surface-container-low px-6 py-5 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center">
              {getRoleIcon()}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>BloodLink Verification</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface">{getRoleTitle()}</h2>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-xs font-semibold text-on-surface-variant hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* User Summary Info */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-on-surface-variant block font-medium">Account Name</span>
              <strong className="text-sm text-on-surface font-semibold">{userName}</strong>
            </div>
            <div>
              <span className="text-on-surface-variant block font-medium">Contact Details</span>
              <span className="text-on-surface font-medium block">{userEmail}</span>
              <span className="text-on-surface-variant block">{userPhone}</span>
            </div>

            {roleDetails.map((detail, idx) => (
              <div key={idx} className="border-t border-surface-container/40 pt-2 sm:pt-0 sm:border-t-0">
                <span className="text-on-surface-variant block font-medium">{detail.label}</span>
                <span className="text-on-surface font-semibold">{detail.value}</span>
              </div>
            ))}
          </div>

          {/* Checklist of registration steps */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/80 border border-surface-container text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-on-surface">Account Created</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-[10px]">
                ✓ Complete
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/80 border border-surface-container text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-on-surface">Profile Information</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-[10px]">
                ✓ Validated
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/80 border border-surface-container text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-on-surface">
                  {role === 'donor'
                    ? 'Clinical & Health Screening Parameters'
                    : 'Documents / Registration Details'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-[10px]">
                ✓ Verified
              </span>
            </div>
          </div>

          {/* Status Box matching Section 10 */}
          {verificationStatus === 'Pending' && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🟡</span>
                <span className="text-sm font-bold uppercase tracking-wider text-amber-800">
                  Verification Status: Pending
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800/90 leading-relaxed font-medium">
                &ldquo;Your information has been submitted for verification.&rdquo;
              </p>
              <p className="text-xs text-amber-700/80 leading-relaxed">
                {role === 'donor'
                  ? 'Your donor registration is under clinical review. To maintain safe transfusion standards, participating in blood requests and donation reservations requires verified status.'
                  : role === 'hospital'
                  ? 'Your institutional medical credentials are under review by the BloodLink Administrative Team. Official emergency blood requisitions will be authorized once verified.'
                  : role === 'blood_bank'
                  ? 'Your facility license is under review. Full inventory allocation and fulfillment capabilities will be activated upon verification.'
                  : 'Your community blood drive registration is under review. Camps will be published to public donors once verified.'}
              </p>
            </div>
          )}

          {verificationStatus === 'Verified' && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🟢</span>
                <span className="text-sm font-bold uppercase tracking-wider text-emerald-800">
                  Verification Status: Verified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-semibold">
                &ldquo;Your BloodLink account has been successfully verified.&rdquo;
              </p>
              <p className="text-xs text-emerald-800/80 leading-relaxed">
                All platform privileges, official requisition tools, and matching facilities are fully unlocked.
              </p>
            </div>
          )}

          {verificationStatus === 'Rejected' && (
            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-950 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔴</span>
                <span className="text-sm font-bold uppercase tracking-wider text-red-800">
                  Verification Status: Rejected
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-900 leading-relaxed font-semibold">
                &ldquo;Your verification requires attention.&rdquo;
              </p>
              <p className="text-xs text-red-800/90 leading-relaxed">
                Your verification was rejected. Please review your submitted information and contact support at{' '}
                <a href="mailto:support@bloodlink.org" className="underline font-bold">support@bloodlink.org</a>.
              </p>
            </div>
          )}

          {/* Donor Eligibility Badge if applicable */}
          {role === 'donor' && eligibilityStatus && (
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between text-xs">
              <span className="font-semibold text-on-surface">Calculated Donor Eligibility:</span>
              <span
                className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                  eligibilityStatus === 'Eligible'
                    ? 'bg-emerald-500/15 text-emerald-700'
                    : eligibilityStatus === 'Pending Verification'
                    ? 'bg-amber-500/15 text-amber-800'
                    : 'bg-red-500/15 text-red-700'
                }`}
              >
                {eligibilityStatus}
              </span>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-surface-container">
            {verificationStatus === 'Verified' && onProceedToDashboard ? (
              <button
                onClick={onProceedToDashboard}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Access Full Portal Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-xs text-on-surface-variant italic">
                {verificationStatus === 'Pending'
                  ? 'Audit usually takes 10–30 minutes.'
                  : 'Contact support to re-evaluate documents.'}
              </div>
            )}

            {/* Quick Admin/Testing Action Bar to toggle verification easily */}
            {(onQuickVerify || onQuickReject) && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {verificationStatus !== 'Verified' && onQuickVerify && (
                  <button
                    type="button"
                    onClick={onQuickVerify}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Simulate administrator approval"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify Account</span>
                  </button>
                )}
                {verificationStatus !== 'Rejected' && onQuickReject && (
                  <button
                    type="button"
                    onClick={onQuickReject}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-surface-container hover:bg-red-50 text-red-600 border border-surface-container text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    title="Simulate verification rejection"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
