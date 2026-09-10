import React from 'react';
import { useBloodLink } from '../context/BloodLinkContext';
import {
  Gift,
  Award,
  Sparkles,
  QrCode,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Download,
  Share2,
  Heart,
  Droplet
} from 'lucide-react';

export const DonorRewardsView: React.FC = () => {
  const { currentDonor, campRegistrations, camps } = useBloodLink();

  if (!currentDonor) return null;

  const donorRegistrations = campRegistrations.filter(
    (r) => r.donorPhone === currentDonor.phone || r.donorName === currentDonor.fullName
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/10 via-surface-container-lowest to-surface-container-lowest border border-primary/20 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-on-primary text-xs font-bold mb-2">
              <Gift className="w-3.5 h-3.5" />
              <span>LifeSaver Rewards &amp; Perks Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Your Exclusive Freebies &amp; Camp Passes
            </h2>
            <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
              Every voluntary blood donation provides critical lifesaving components. At each partner blood camp, enjoy high-protein nutrition, health screenings, and honorary hero gifts.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-xs shrink-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-xs text-on-surface-variant block font-medium">Hero Tier</span>
              <span className="text-base font-bold text-on-surface block">
                {currentDonor.donationCount > 5 ? 'Gold Guardian' : currentDonor.donationCount > 2 ? 'Silver Champion' : 'Bronze LifeSaver'}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{currentDonor.donationCount} Lives Touched</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE CAMP PASSES & VOUCHERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Active Camp Passes &amp; Gift Vouchers ({donorRegistrations.length})</span>
          </h3>
        </div>

        {donorRegistrations.length === 0 ? (
          <div className="bg-surface-container-lowest border border-dashed border-surface-container rounded-2xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary mx-auto mb-3">
              <Gift className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-on-surface">No active camp passes yet.</h4>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1 mb-4">
              Register for any upcoming community blood camp to immediately unlock your Hero Perk Pass, T-shirt voucher, and free gourmet health kit.
            </p>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('bloodlink:set-donor-tab', { detail: 'camps' }));
              }}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Browse Exciting Blood Camps</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donorRegistrations.map((reg) => {
              const matchedCamp = camps.find((c) => c.id === reg.campId);
              return (
                <div
                  key={reg.id}
                  className="bg-surface-container-lowest border-2 border-primary/30 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="p-5 bg-gradient-to-r from-primary/5 to-surface-container-lowest border-b border-surface-container">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                        HERO ENTRY PASS
                      </span>
                      <span className="text-xs font-mono font-bold text-on-surface bg-surface-container-low px-2 py-0.5 rounded border border-surface-container">
                        {reg.voucherCode || `PASS-${reg.id.slice(-6)}`}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-on-surface">{reg.campName}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {matchedCamp ? `${matchedCamp.venue}, ${matchedCamp.city}` : 'Community Blood Drive Center'}
                    </p>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Timing & Donor Details */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-surface-container-low p-3 rounded-xl border border-surface-container/60">
                      <div>
                        <span className="text-on-surface-variant block">Slot Reserved:</span>
                        <span className="font-bold text-on-surface block mt-0.5">{reg.slotTime}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Blood Group:</span>
                        <span className="font-bold text-primary block mt-0.5">{reg.donorBloodGroup}</span>
                      </div>
                      {reg.tshirtSize && (
                        <div>
                          <span className="text-on-surface-variant block">T-Shirt Size:</span>
                          <span className="font-semibold text-on-surface block mt-0.5">Size {reg.tshirtSize}</span>
                        </div>
                      )}
                      {reg.snackPreference && (
                        <div>
                          <span className="text-on-surface-variant block">Snack Selection:</span>
                          <span className="font-semibold text-on-surface block mt-0.5 truncate">{reg.snackPreference}</span>
                        </div>
                      )}
                    </div>

                    {/* Perk Checklist included */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                        Included Freebies &amp; Services:
                      </span>
                      <div className="space-y-1 text-xs text-on-surface">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>🎁 Free Gourmet Nutrition Box at recovery lounge</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>👕 Exclusive "LifeSaver Hero" Dri-Fit Tee</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>🩺 Free 5-Point Full Health Check ($65 Value)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>🏅 Certified Certificate of Honor</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pass Bottom Bar with Barcode Mock */}
                  <div className="p-4 border-t border-surface-container bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <QrCode className="w-5 h-5 text-on-surface" />
                      <span>Show barcode at entrance desk</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                      PASS VALID
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STANDARD PERKS CATALOG (Always Available to Donors) */}
      <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <span>Why Donors Love BloodLink Camps</span>
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Every blood camp registered on BloodLink partners with top clinical repositories and sponsors to ensure donor safety, premium nutrition, and genuine appreciation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60 space-y-1">
            <span className="text-lg">🩺</span>
            <h5 className="font-bold text-on-surface">5-Point Health Screen</h5>
            <p className="text-on-surface-variant">Hemoglobin, blood pressure, pulse rate, temperature, and blood typing free of charge.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60 space-y-1">
            <span className="text-lg">🍱</span>
            <h5 className="font-bold text-on-surface">Gourmet Nutrition</h5>
            <p className="text-on-surface-variant">Electrolytes, fresh juice, fruits, and high-protein snack box for fast recovery.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60 space-y-1">
            <span className="text-lg">👕</span>
            <h5 className="font-bold text-on-surface">Donor Apparel &amp; ID</h5>
            <p className="text-on-surface-variant">Limited edition athletic Dri-Fit tee and personalized waterproof donor card.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60 space-y-1">
            <span className="text-lg">🏅</span>
            <h5 className="font-bold text-on-surface">Govt &amp; Red Cross Honor</h5>
            <p className="text-on-surface-variant">Official verified Certificate of Appreciation recognizing your lifesaving action.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
