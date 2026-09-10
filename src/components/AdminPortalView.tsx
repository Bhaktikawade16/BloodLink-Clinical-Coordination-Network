import React, { useState } from 'react';
import { useBloodLink } from '../context/BloodLinkContext';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Building2,
  Database,
  FileText,
  Clock,
  RotateCcw,
  Search,
  ExternalLink,
  RefreshCw,
  Server,
  Layers,
  Check,
  Globe
} from 'lucide-react';

export const AdminPortalView: React.FC = () => {
  const {
    hospitals,
    bloodBanks,
    donors,
    camps,
    inventory,
    activeRequests,
    approveEntity,
    rejectEntity,
    resetDatabase,
    isRailwayConnected,
    isSyncing,
    railwayLatency,
    lastSyncedAt,
    railwayError,
    syncWithRailway,
    railwayApiBase,
    databaseUrl,
    updateDatabaseUrl,
    resetDatabaseUrlToDefault,
    rawRailwayData
  } = useBloodLink();

  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'database'>('pending');
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'hospital' | 'blood-bank';
    item: any;
  } | null>(null);

  // Database URL configuration state
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [inputUrl, setInputUrl] = useState(databaseUrl);
  const [urlStatusMsg, setUrlStatusMsg] = useState<string | null>(null);
  const [selectedDbTable, setSelectedDbTable] = useState<'donors' | 'hospitals' | 'bloodBanks' | 'camps' | 'inventory' | 'requests'>('hospitals');

  // Combine institutional applications
  const pendingHospitals = hospitals.filter((h) => h.status === 'Verification Pending');
  const pendingBloodBanks = bloodBanks.filter((b) => b.status === 'Verification Pending');
  const totalPending = pendingHospitals.length + pendingBloodBanks.length;

  const verifiedHospitals = hospitals.filter((h) => h.status === 'Verified');
  const verifiedBloodBanks = bloodBanks.filter((b) => b.status === 'Verified');

  const rejectedHospitals = hospitals.filter((h) => h.status === 'Rejected');
  const rejectedBloodBanks = bloodBanks.filter((b) => b.status === 'Rejected');

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setUrlStatusMsg('Connecting to database...');
    try {
      await updateDatabaseUrl(inputUrl.trim());
      setUrlStatusMsg('Successfully connected and synchronized!');
      setIsEditingUrl(false);
      setTimeout(() => setUrlStatusMsg(null), 4000);
    } catch (err: any) {
      setUrlStatusMsg(`Connection failed: ${err.message || 'Error'}`);
    }
  };

  const handleResetUrl = async () => {
    setUrlStatusMsg('Restoring production Railway database...');
    await resetDatabaseUrlToDefault();
    setInputUrl('https://bloodlink-api-production.up.railway.app');
    setIsEditingUrl(false);
    setUrlStatusMsg('Railway production database restored and synced.');
    setTimeout(() => setUrlStatusMsg(null), 4000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Deck */}
      <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Central Authority
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mt-0.5">
              Institutional Audit &amp; Verification Desk
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Verify legal medical licenses, NABH drug accreditations, and institutional credentials before activation.
            </p>
          </div>
        </div>

        {/* System Reset Button */}
        <button
          onClick={() => {
            if (window.confirm('Reset all portal records to a pristine empty state?')) {
              resetDatabase();
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant hover:text-error transition-colors cursor-pointer shrink-0"
          title="Reset database to 100% empty state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Empty State</span>
        </button>
      </div>

      {/* Railway PostgreSQL Database Live Integration Card */}
      <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isRailwayConnected ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface">Railway Cloud Database</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isRailwayConnected
                    ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isRailwayConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`} />
                  {isRailwayConnected ? 'Live & Connected' : 'Syncing / Connecting'}
                </span>
                {railwayLatency !== null && (
                  <span className="text-xs text-on-surface-variant font-mono">
                    {railwayLatency} ms
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5 break-all">
                {railwayApiBase}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastSyncedAt && (
              <span className="text-xs text-on-surface-variant hidden sm:inline">
                Last synced: {lastSyncedAt.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => syncWithRailway()}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Sync Live DB'}</span>
            </button>
          </div>
        </div>

        {/* Database Collection Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="bg-surface-container/40 p-2.5 rounded-xl text-center">
            <span className="text-xs text-on-surface-variant">Donors</span>
            <p className="text-lg font-bold text-on-surface">{donors.length}</p>
          </div>
          <div className="bg-surface-container/40 p-2.5 rounded-xl text-center">
            <span className="text-xs text-on-surface-variant">Hospitals</span>
            <p className="text-lg font-bold text-on-surface">{hospitals.length}</p>
          </div>
          <div className="bg-surface-container/40 p-2.5 rounded-xl text-center">
            <span className="text-xs text-on-surface-variant">Blood Banks</span>
            <p className="text-lg font-bold text-on-surface">{bloodBanks.length}</p>
          </div>
          <div className="bg-surface-container/40 p-2.5 rounded-xl text-center">
            <span className="text-xs text-on-surface-variant">Camps</span>
            <p className="text-lg font-bold text-on-surface">{camps.length}</p>
          </div>
          <div className="bg-surface-container/40 p-2.5 rounded-xl text-center">
            <span className="text-xs text-on-surface-variant">Inventory Units</span>
            <p className="text-lg font-bold text-on-surface">{inventory.length}</p>
          </div>
          <div className="bg-surface-container/40 p-2.5 rounded-xl text-center">
            <span className="text-xs text-on-surface-variant">Active Requests</span>
            <p className="text-lg font-bold text-on-surface">{activeRequests.length}</p>
          </div>
        </div>

        {/* Database URL Configurator Toggle */}
        <div className="mt-4 pt-3 border-t border-surface-container/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-xs text-on-surface-variant">
              Database Source: <strong className="text-on-surface font-mono">{databaseUrl}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingUrl(!isEditingUrl)}
              className="text-xs text-primary hover:text-primary-container font-semibold transition-colors cursor-pointer"
            >
              {isEditingUrl ? 'Close URL Settings' : 'Change Database URL'}
            </button>
            <span className="text-surface-container-high">•</span>
            <button
              onClick={() => setActiveTab('database')}
              className="text-xs text-primary hover:text-primary-container font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Inspect DB Tables</span>
            </button>
          </div>
        </div>

        {/* URL Edit Form */}
        {isEditingUrl && (
          <form onSubmit={handleSaveUrl} className="mt-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Railway PostgreSQL API Database URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://bloodlink-api-production.up.railway.app"
                  required
                  className="flex-1 h-9 px-3 rounded-lg bg-surface-container-lowest border border-surface-container text-xs font-mono text-on-surface outline-none"
                />
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-3.5 h-9 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold cursor-pointer shrink-0"
                >
                  Save &amp; Connect
                </button>
                <button
                  type="button"
                  onClick={handleResetUrl}
                  disabled={isSyncing}
                  className="px-3.5 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold cursor-pointer shrink-0"
                >
                  Reset to Default
                </button>
              </div>
            </div>
            {urlStatusMsg && (
              <p className="text-xs text-primary font-medium">{urlStatusMsg}</p>
            )}
          </form>
        )}

        {railwayError && (
          <div className="mt-3 p-2.5 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
            Railway API Warning: {railwayError}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-container overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Verification ({totalPending})</span>
        </button>

        <button
          onClick={() => setActiveTab('verified')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'verified'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Verified Institutions ({verifiedHospitals.length + verifiedBloodBanks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rejected'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Rejected Applications ({rejectedHospitals.length + rejectedBloodBanks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-surface-container-lowest text-primary border-b-2 border-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Railway DB Tables (6)</span>
        </button>
      </div>

      {/* TAB: PENDING VERIFICATION */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {totalPending === 0 ? (
            /* Clean Empty State as explicitly mandated by user */
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No pending verification requests.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                All institutional applications have been audited. New registrations will automatically appear here for review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hospitals Queue */}
              {pendingHospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Hospital Requisition Audit
                          </span>
                          <span className="text-xs text-on-surface-variant font-mono">{hosp.id}</span>
                        </div>
                        <h3 className="text-lg font-bold text-on-surface mt-0.5">{hosp.name}</h3>
                      </div>
                    </div>

                    <div className="text-xs text-on-surface-variant sm:text-right">
                      <span>Submitted: {hosp.createdAt}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-surface-container-low">
                      <span className="text-on-surface-variant block">Authorized Officer</span>
                      <span className="font-semibold text-on-surface mt-0.5 block">{hosp.contactPerson}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low">
                      <span className="text-on-surface-variant block">Licence / Reg Number</span>
                      <span className="font-semibold text-on-surface mt-0.5 block">{hosp.licenceNumber}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low">
                      <span className="text-on-surface-variant block">Contact &amp; Location</span>
                      <span className="font-semibold text-on-surface mt-0.5 block">
                        {hosp.phone} • {hosp.city}, {hosp.state}
                      </span>
                    </div>
                  </div>

                  {/* Document Attachment */}
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant p-2.5 rounded-lg bg-surface-container-low">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span>Attached Licence: <strong>{hosp.licenceDocumentName || 'Form_26G_Clinical_Licence.pdf'}</strong></span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => rejectEntity('hospital', hosp.id)}
                      className="px-4 py-2 rounded-lg bg-surface-container hover:bg-error-container hover:text-on-error-container text-xs font-bold transition-colors cursor-pointer"
                    >
                      REJECT
                    </button>
                    <button
                      onClick={() => approveEntity('hospital', hosp.id)}
                      className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>APPROVE &amp; VERIFY</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Blood Banks Queue */}
              {pendingBloodBanks.map((bank) => (
                <div
                  key={bank.id}
                  className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">
                            Blood Bank Cold-Chain Audit
                          </span>
                          <span className="text-xs text-on-surface-variant font-mono">{bank.id}</span>
                        </div>
                        <h3 className="text-lg font-bold text-on-surface mt-0.5">{bank.name}</h3>
                      </div>
                    </div>

                    <div className="text-xs text-on-surface-variant sm:text-right">
                      <span>Submitted: {bank.createdAt}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-surface-container-low">
                      <span className="text-on-surface-variant block">Medical Director</span>
                      <span className="font-semibold text-on-surface mt-0.5 block">{bank.contactPerson}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low">
                      <span className="text-on-surface-variant block">Licence / Accreditation</span>
                      <span className="font-semibold text-on-surface mt-0.5 block">{bank.licenceNumber}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low">
                      <span className="text-on-surface-variant block">Phone &amp; Location</span>
                      <span className="font-semibold text-on-surface mt-0.5 block">
                        {bank.phone} • {bank.city}, {bank.state}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-on-surface-variant p-2.5 rounded-lg bg-surface-container-low">
                    <FileText className="w-4 h-4 text-secondary shrink-0" />
                    <span>Accreditation Certificate: <strong>{bank.licenceDocumentName || 'NABH_Certificate.pdf'}</strong></span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => rejectEntity('blood-bank', bank.id)}
                      className="px-4 py-2 rounded-lg bg-surface-container hover:bg-error-container hover:text-on-error-container text-xs font-bold transition-colors cursor-pointer"
                    >
                      REJECT
                    </button>
                    <button
                      onClick={() => approveEntity('blood-bank', bank.id)}
                      className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>APPROVE &amp; VERIFY</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: VERIFIED INSTITUTIONS */}
      {activeTab === 'verified' && (
        <div className="space-y-4">
          {verifiedHospitals.length === 0 && verifiedBloodBanks.length === 0 ? (
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No verified institutions yet.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                Approved hospitals and blood banks will be maintained in the regional active registry.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifiedHospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary">
                        Verified Hospital
                      </span>
                      <span className="text-xs font-mono text-on-surface-variant">{hosp.licenceNumber}</span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface">{hosp.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {hosp.address}, {hosp.city}, {hosp.state}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-surface-container text-xs text-on-surface-variant flex items-center justify-between">
                    <span>Officer: {hosp.contactPerson}</span>
                    <span className="font-semibold text-secondary">Active Clinical Requisitions</span>
                  </div>
                </div>
              ))}

              {verifiedBloodBanks.map((bank) => (
                <div
                  key={bank.id}
                  className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary">
                        Verified Blood Bank
                      </span>
                      <span className="text-xs font-mono text-on-surface-variant">{bank.licenceNumber}</span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface">{bank.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {bank.address}, {bank.city}, {bank.state}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-surface-container text-xs text-on-surface-variant flex items-center justify-between">
                    <span>Director: {bank.contactPerson}</span>
                    <span className="font-semibold text-secondary">Cold-Chain Approved</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: REJECTED APPLICATIONS */}
      {activeTab === 'rejected' && (
        <div className="space-y-4">
          {rejectedHospitals.length === 0 && rejectedBloodBanks.length === 0 ? (
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No rejected applications.</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                Any applications rejected due to invalid licences will be archived here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...rejectedHospitals, ...rejectedBloodBanks].map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-surface-container bg-surface-container-lowest flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">{item.name}</h4>
                    <span className="text-xs text-on-surface-variant block mt-0.5">
                      Licence: {item.licenceNumber} • Contact: {item.phone}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-error px-2.5 py-1 rounded-full bg-error-container/40">
                    Application Rejected
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: RAILWAY POSTGRESQL DATABASE INSPECTOR */}
      {activeTab === 'database' && (
        <div className="space-y-5">
          {/* Database Info Banner */}
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Railway Cloud PostgreSQL Database</h3>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                  Host: {databaseUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isRailwayConnected
                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isRailwayConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`} />
                {isRailwayConnected ? 'Live Connection' : 'Syncing'}
              </span>
              <button
                onClick={() => syncWithRailway()}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Re-query</span>
              </button>
            </div>
          </div>

          {/* Table Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { id: 'hospitals', label: 'Hospitals', count: rawRailwayData.hospitals.length, endpoint: '/api/hospitals' },
              { id: 'bloodBanks', label: 'Blood Banks', count: rawRailwayData.bloodBanks.length, endpoint: '/api/blood-banks' },
              { id: 'inventory', label: 'Inventory', count: rawRailwayData.inventory.length, endpoint: '/api/inventory' },
              { id: 'requests', label: 'Requests', count: rawRailwayData.requests.length, endpoint: '/api/blood-requests' },
              { id: 'camps', label: 'Camps', count: rawRailwayData.camps.length, endpoint: '/api/camps' },
              { id: 'donors', label: 'Donors', count: rawRailwayData.donors.length, endpoint: '/api/donors' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedDbTable(t.id as any)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedDbTable === t.id
                    ? 'border-primary bg-primary/5 text-primary shadow-xs'
                    : 'border-surface-container bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{t.label}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${
                    selectedDbTable === t.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    {t.count}
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-mono block mt-1 truncate">
                  {t.endpoint}
                </span>
              </button>
            ))}
          </div>

          {/* Active Table Viewer */}
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <h4 className="text-sm font-bold text-on-surface uppercase tracking-wide">
                  Table: <span className="font-mono text-primary font-semibold">{selectedDbTable}</span>
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Source endpoint: <span className="font-mono">{databaseUrl}/api/{
                    selectedDbTable === 'bloodBanks' ? 'blood-banks' :
                    selectedDbTable === 'requests' ? 'blood-requests' : selectedDbTable
                  }</span>
                </p>
              </div>
              <span className="text-xs text-on-surface-variant">
                Total Rows: <strong>{rawRailwayData[selectedDbTable]?.length || 0}</strong>
              </span>
            </div>

            {(!rawRailwayData[selectedDbTable] || rawRailwayData[selectedDbTable].length === 0) ? (
              <div className="p-8 text-center bg-surface-container-low rounded-xl">
                <Database className="w-8 h-8 text-on-surface-variant mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-on-surface">No rows in this database table yet.</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Items created in this portal or added directly to PostgreSQL will synchronize automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Visual Cards of Database Records */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rawRailwayData[selectedDbTable].map((row: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-surface-container bg-surface-container-low text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-surface-container font-mono text-[11px] text-primary font-bold">
                        <span>Row #{idx + 1}</span>
                        <span className="text-on-surface-variant">ID: {row.hospital_id || row.blood_bank_id || row.camp_id || row.donor_id || row.inventory_id || row.request_id || idx + 1}</span>
                      </div>
                      <div className="space-y-1 pt-1 font-mono text-[11px]">
                        {Object.entries(row).map(([k, v]) => (
                          <div key={k} className="flex items-start justify-between gap-2">
                            <span className="text-on-surface-variant shrink-0">{k}:</span>
                            <span className="text-on-surface font-semibold text-right break-all">
                              {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Raw JSON View Accordion */}
                <details className="mt-4 p-3 rounded-xl bg-surface-container-low/70 border border-surface-container text-xs">
                  <summary className="font-semibold text-on-surface cursor-pointer select-none">
                    View Raw PostgreSQL JSON Response ({rawRailwayData[selectedDbTable].length} records)
                  </summary>
                  <pre className="mt-2.5 p-3 rounded-lg bg-surface-container-lowest text-[11px] font-mono text-on-surface overflow-x-auto border border-surface-container max-h-72">
                    {JSON.stringify(rawRailwayData[selectedDbTable], null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
