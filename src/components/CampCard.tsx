import React, { useState } from 'react';
import { BloodCamp } from '../types';
import {
  Calendar,
  MapPin,
  Phone,
  Gift,
  Sparkles,
  CheckCircle2,
  Users,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface CampCardProps {
  camp: BloodCamp;
  isRegistered: boolean;
  onBook: (campId: string) => void;
  onViewDetails?: (camp: BloodCamp) => void;
}

export const CampCard: React.FC<CampCardProps> = ({
  camp,
  isRegistered,
  onBook
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  const images = camp.gallery && camp.gallery.length > 0
    ? camp.gallery
    : camp.image
    ? [camp.image]
    : ['https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=80'];

  const perks = camp.perks || [
    '🎁 Gourmet High-Protein Snack Box',
    '👕 Exclusive "LifeSaver Hero" Dri-Fit Tee',
    '🩺 Free 5-Point Full Health Check ($65 Value)',
    '🏅 Certified Certificate of Honor',
    '💳 Personalized Smart Blood Donor ID'
  ];

  const highlights = camp.highlights || [
    '❄️ Air-Conditioned Comfort Lounge',
    '☕ Unlimited Fresh Juice Bar',
    '👨‍⚕️ Clinical Phlebotomists on Duty',
    '⚡ 15-Minute Safe Process'
  ];

  const fillPercentage = Math.min(
    100,
    Math.round((camp.registeredCount / Math.max(1, camp.registrationLimit)) * 100)
  );

  return (
    <>
      <div className="bg-surface-container-lowest border border-surface-container hover:border-primary/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          {/* Top Hero Image: Real Blood Donation in Action */}
          <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-surface-container">
            <img
              src={images[activePhotoIdx]}
              alt={`Blood donation drive at ${camp.name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            {/* Badges on Top */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-on-surface backdrop-blur-md shadow-xs flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-primary" />
                <span>{camp.city}</span>
              </span>

              {camp.specialBadge ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary text-on-primary shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{camp.specialBadge}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  <span>Freebies Included</span>
                </span>
              )}
            </div>

            {/* Photo Gallery Thumbnail Bar (if multiple photos) */}
            {images.length > 1 && (
              <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 z-10">
                {images.slice(0, 3).map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx(idx);
                    }}
                    className={`w-6 h-6 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                      activePhotoIdx === idx ? 'border-white scale-110 shadow-sm' : 'border-white/50 opacity-70'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGalleryModal(true);
                  }}
                  className="px-1.5 py-0.5 rounded bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1 cursor-pointer"
                  title="View full donation photo gallery"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>+{images.length}</span>
                </button>
              </div>
            )}

            {/* Bottom Info on Image */}
            <div className="absolute bottom-2.5 left-3 text-white">
              <span className="text-xs font-medium text-white/80 block">
                {camp.distance || 'Community Clinical Venue'}
              </span>
              <h3 className="text-base font-bold text-white tracking-tight leading-tight line-clamp-1">
                {camp.name}
              </h3>
            </div>
          </div>

          {/* Body Information */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Capacity / Slots Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>Registered Hero Donors</span>
                </span>
                <span className="font-bold text-on-surface">
                  {camp.registeredCount} / {camp.registrationLimit} Slots
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    fillPercentage > 85 ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.max(5, fillPercentage)}%` }}
                />
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
              {camp.description}
            </p>

            {/* Date, Time & Venue */}
            <div className="space-y-1.5 text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl border border-surface-container/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-semibold text-on-surface">
                  {camp.date} • {camp.startTime} - {camp.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {camp.venue}, {camp.address}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Contact Organizer: {camp.contact}</span>
              </div>
            </div>

            {/* FREEBIES & PERKS BOX (Highlighted as explicitly requested!) */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/2 to-transparent p-3 sm:p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-2">
                <Gift className="w-4 h-4 text-primary animate-bounce" />
                <span>Donor Freebies &amp; Participation Gifts</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {perks.map((perk, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs font-medium text-on-surface bg-white/70 px-2.5 py-1.5 rounded-lg border border-primary/10 shadow-2xs"
                  >
                    <span className="text-xs">{perk.split(' ')[0]}</span>
                    <span className="truncate">{perk.substring(perk.indexOf(' ') + 1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Camp Highlights Tags */}
            <div className="flex flex-wrap gap-1.5">
              {highlights.map((item, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="p-4 sm:p-5 pt-0 mt-2">
          {isRegistered ? (
            <div className="w-full py-2.5 px-4 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 flex items-center justify-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>You Are Registered! Perks Reserved</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onBook(camp.id)}
              disabled={camp.registeredCount >= camp.registrationLimit}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 group-hover:bg-primary-container"
            >
              <Gift className="w-4 h-4" />
              <span>
                {camp.registeredCount >= camp.registrationLimit
                  ? 'Camp Capacity Reached'
                  : 'Join Drive & Claim Freebies'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* FULL PHOTO GALLERY MODAL */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-surface-container">
            <div className="p-4 border-b border-surface-container flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-on-surface">{camp.name}</h4>
                <p className="text-xs text-on-surface-variant">Authentic Blood Drive &amp; Donor Facility Photos</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative h-72 sm:h-80 w-full rounded-xl overflow-hidden bg-black">
                <img
                  src={images[activePhotoIdx]}
                  alt="Blood donation scene"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`h-16 rounded-lg overflow-hidden border-2 cursor-pointer ${
                      activePhotoIdx === idx ? 'border-primary shadow-xs' : 'border-surface-container opacity-70'
                    }`}
                  >
                    <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-surface-container bg-surface-container-low flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">
                Professional clinical environment with certified phlebotomists.
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowGalleryModal(false);
                  if (!isRegistered) onBook(camp.id);
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-xs cursor-pointer"
              >
                {isRegistered ? 'Close' : 'Register Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
