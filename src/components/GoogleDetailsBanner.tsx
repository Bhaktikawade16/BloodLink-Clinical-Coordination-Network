import React from 'react';
import { Sparkles, Check, Mail, Phone, MapPin, Droplet, Building2, X } from 'lucide-react';
import { ExtractedEmailDetails } from '../services/googleAuthService';

interface GoogleDetailsBannerProps {
  details: ExtractedEmailDetails;
  onDismiss?: () => void;
}

export const GoogleDetailsBanner: React.FC<GoogleDetailsBannerProps> = ({
  details,
  onDismiss
}) => {
  return (
    <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl shadow-sm text-slate-800 space-y-3 relative transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {details.photoUrl ? (
            <img
              src={details.photoUrl}
              alt={details.name}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {details.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Google & Gmail Auto-Detected
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                Verified OAuth
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Details auto-filled for {details.name}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid of detected items */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="bg-white/80 p-2 rounded-xl border border-emerald-100/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
            <Mail className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">Google Mail</span>
          </div>
          <p className="font-semibold text-slate-800 truncate" title={details.email}>
            {details.email}
          </p>
        </div>

        {details.phone && (
          <div className="bg-white/80 p-2 rounded-xl border border-emerald-100/80 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">Contact Phone</span>
            </div>
            <p className="font-semibold text-slate-800 truncate">+91 {details.phone}</p>
          </div>
        )}

        {details.city && (
          <div className="bg-white/80 p-2 rounded-xl border border-emerald-100/80 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">Location City</span>
            </div>
            <p className="font-semibold text-slate-800 truncate">{details.city}</p>
          </div>
        )}

        {details.bloodGroup && (
          <div className="bg-white/80 p-2 rounded-xl border border-emerald-100/80 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
              <Droplet className="w-3.5 h-3.5 text-red-600" />
              <span className="font-medium">Blood Group</span>
            </div>
            <p className="font-bold text-red-600 truncate">{details.bloodGroup}</p>
          </div>
        )}

        {details.organization && (
          <div className="bg-white/80 p-2 rounded-xl border border-emerald-100/80 text-xs col-span-2">
            <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">Organization / Lab</span>
            </div>
            <p className="font-semibold text-slate-800 truncate">{details.organization}</p>
          </div>
        )}
      </div>

      {details.snippetHighlights && details.snippetHighlights.length > 0 && (
        <div className="text-[11px] text-slate-600 bg-emerald-100/50 px-2.5 py-1.5 rounded-lg border border-emerald-200/50 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="truncate">
            {details.snippetHighlights[0]}
            {details.messagesAnalyzed > 0 && ` (${details.messagesAnalyzed} emails checked)`}
          </span>
        </div>
      )}
    </div>
  );
};
