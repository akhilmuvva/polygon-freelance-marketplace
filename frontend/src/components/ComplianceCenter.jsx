import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Shield, 
    Lock, 
    FileText, 
    Database, 
    AlertTriangle, 
    CheckCircle2, 
    Download, 
    Trash2, 
    Edit3,
    Fingerprint,
    Scale,
    ExternalLink,
    Clock,
    Globe,
    ChevronRight,
    Briefcase
} from 'lucide-react';
import './ComplianceCenter.css';

/**
 * PolyLance Zenith Compliance Center
 * A sovereign interface for Legal Engineering, KYC, and Tax Sovereignty.
 */
const ComplianceCenter = () => {
    const { address } = useAccount();
    const [activeTab, setActiveTab] = useState('kyc');
    const [kycStatus, setKycStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (address) {
            fetchComplianceStatus();
        }
    }, [address]);

    const fetchComplianceStatus = async () => {
        try {
            const response = await fetch(`/api/compliance/status/${address}`);
            const data = await response.json();
            setKycStatus(data);
        } catch (error) {
            console.error('Error fetching compliance status:', error);
            // Mock data for UI demonstration if API fails
            setKycStatus({
                kyc_level: 0,
                status: 'Not Verified',
                provider: 'None',
                limits: {
                    daily_limit: 1000,
                    monthly_limit: 5000,
                    transaction_limit: 500
                }
            });
        }
    };

    const initiateKYC = async (provider) => {
        setLoading(true);
        try {
            const response = await fetch('/api/kyc/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: address,
                    provider: provider
                })
            });

            const data = await response.json();
            if (data.inquiry_url) {
                window.open(data.inquiry_url, '_blank');
            }
        } catch (error) {
            console.error('Error initiating KYC:', error);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 15
            }
        }
    };

    const renderKYCTab = () => (
        <motion.div 
            className="tab-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="section-header">
                <Fingerprint className="header-icon" />
                <div>
                    <h2>Identity Verification</h2>
                    <p>Unlock sovereign tiers and institutional-grade transaction limits.</p>
                </div>
            </motion.div>

            {kycStatus && kycStatus.kyc_level > 0 ? (
                <motion.div variants={itemVariants} className="kyc-status-card glass">
                    <div className="status-header">
                        <div className="status-badge-container">
                            <div className="pulse-dot"></div>
                            <span className="status-badge" data-level={kycStatus.kyc_level}>
                                Tier {kycStatus.kyc_level}: {getKYCLevelName(kycStatus.kyc_level)}
                            </span>
                        </div>
                        <CheckCircle2 className="verified-icon" />
                    </div>

                    <div className="status-details-grid">
                        <div className="detail-item">
                            <Clock size={16} />
                            <span>Verified: {new Date(kycStatus.verified_at * 1000).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                            <Globe size={16} />
                            <span>Jurisdiction: {kycStatus.jurisdiction || 'Global'}</span>
                        </div>
                        <div className="detail-item">
                            <Shield size={16} />
                            <span>Provider: {kycStatus.provider}</span>
                        </div>
                    </div>

                    <div className="limits-section">
                        <h3>Neural Transaction Limits</h3>
                        <div className="limits-grid">
                            <div className="limit-box">
                                <span className="limit-label">Daily</span>
                                <span className="limit-value">${kycStatus.limits?.daily_limit?.toLocaleString()}</span>
                            </div>
                            <div className="limit-box">
                                <span className="limit-label">Monthly</span>
                                <span className="limit-value">${kycStatus.limits?.monthly_limit?.toLocaleString()}</span>
                            </div>
                            <div className="limit-box">
                                <span className="limit-label">Per TX</span>
                                <span className="limit-value">${kycStatus.limits?.transaction_limit?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="kyc-onboarding">
                    <div className="kyc-grid">
                        <KYCLevelCard 
                            level="Basic" 
                            subtitle="Email + Phone"
                            limits={["$500 Per TX", "$1K Daily", "$5K Monthly"]}
                            icon={<Lock size={24} />}
                            onAction={() => initiateKYC('persona')}
                            loading={loading}
                        />
                        <KYCLevelCard 
                            level="Intermediate" 
                            subtitle="Government ID"
                            limits={["$5K Per TX", "$10K Daily", "$50K Monthly"]}
                            icon={<Fingerprint size={24} />}
                            featured={true}
                            onAction={() => initiateKYC('persona')}
                            loading={loading}
                        />
                        <KYCLevelCard 
                            level="Advanced" 
                            subtitle="Full Proof"
                            limits={["$50K Per TX", "$100K Daily", "$500K Monthly"]}
                            icon={<Shield size={24} />}
                            onAction={() => initiateKYC('sumsub')}
                            loading={loading}
                        />
                        <KYCLevelCard 
                            level="Institutional" 
                            subtitle="Business Vetting"
                            limits={["$500K Per TX", "$1M Daily", "Unlimited Monthly"]}
                            icon={<Briefcase size={24} />}
                            onAction={() => alert('Redirecting to Institutional Onboarding...')}
                            loading={loading}
                            actionLabel="Contact Sales"
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );

    const renderGDPRTab = () => (
        <motion.div 
            className="tab-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="section-header">
                <Database className="header-icon" />
                <div>
                    <h2>Sovereign Data Rights</h2>
                    <p>Exercise your GDPR and privacy rights over your decentralized footprint.</p>
                </div>
            </motion.div>

            <div className="privacy-grid">
                <PrivacyRightCard 
                    title="Right to Access"
                    desc="Download a full machine-readable archive of your platform data."
                    icon={<Download size={20} />}
                    actionLabel="Export Archive"
                />
                <PrivacyRightCard 
                    title="Right to Rectification"
                    desc="Correct or update your identified personal information."
                    icon={<Edit3 size={20} />}
                    actionLabel="Edit Profile"
                />
                <PrivacyRightCard 
                    title="Right to Erasure"
                    desc="Request permanent deletion of all off-chain personal data."
                    icon={<Trash2 size={20} />}
                    actionLabel="Purge Identity"
                    danger={true}
                />
                <PrivacyRightCard 
                    title="Right to Portability"
                    desc="Transfer your verified reputation to other compliant protocols."
                    icon={<ExternalLink size={20} />}
                    actionLabel="Initialize Port"
                />
            </div>

            <motion.div variants={itemVariants} className="consent-section glass">
                <h3>Consent Management Engine</h3>
                <div className="consent-list">
                    <ConsentItem 
                        title="Marketing Intelligence"
                        desc="Receive updates on protocol evolutions and Zenith signals."
                        defaultOn={true}
                    />
                    <ConsentItem 
                        title="Behavioral Analytics"
                        desc="Help us optimize the neural interface with anonymous usage data."
                        defaultOn={true}
                    />
                    <ConsentItem 
                        title="Oracle Verification"
                        desc="Share limited data with verified KYC nodes for trust building."
                        defaultOn={true}
                        required={true}
                    />
                </div>
            </motion.div>
        </motion.div>
    );

    const renderTaxTab = () => (
        <motion.div 
            className="tab-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="section-header">
                <Scale className="header-icon" />
                <div>
                    <h2>Tax Sovereignty</h2>
                    <p>Institutional reporting and capital gains tracking for the 2025 cycle.</p>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="tax-summary-box glass">
                <div className="summary-stats">
                    <div className="stat-item">
                        <span className="label">Total Gross</span>
                        <span className="value text-gradient">$45,230.00</span>
                    </div>
                    <div className="stat-item">
                        <span className="label">Platform Fees</span>
                        <span className="value">$1,130.75</span>
                    </div>
                    <div className="stat-item">
                        <span className="label">Gas Burn</span>
                        <span className="value">$234.50</span>
                    </div>
                    <div className="stat-item">
                        <span className="label">Net Sovereignty</span>
                        <span className="value text-accent">$43,864.75</span>
                    </div>
                </div>
            </motion.div>

            <div className="report-grid">
                <ReportCard 
                    title="Annual Ledger" 
                    desc="Full CSV of every on-chain interaction and payment." 
                />
                <ReportCard 
                    title="1099-NEC (Digital)" 
                    desc="Standard US non-employee compensation filing." 
                />
                <ReportCard 
                    title="W-8BEN Certification" 
                    desc="Foreign status certificate for global freelancers." 
                />
                <ReportCard 
                    title="Crypto Gains Engine" 
                    desc="Calculated cost-basis for multiple currency payouts." 
                />
            </div>

            <motion.div variants={itemVariants} className="tax-disclaimer glass">
                <AlertTriangle size={20} className="warning-icon" />
                <p>
                    <strong>Sovereign Disclaimer:</strong> PolyLance provides these calculations as raw data. 
                    Consult with a Jurisdictional Tax Architect before final submission.
                </p>
            </motion.div>
        </motion.div>
    );

    return (
        <div className="compliance-container">
            <motion.div 
                className="compliance-header"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1>Compliance Center</h1>
                <p>Advanced legal engineering for identity, privacy, and fiscal sovereignty.</p>
            </motion.div>

            <div className="compliance-tabs">
                {['kyc', 'gdpr', 'tax'].map((tab) => (
                    <button
                        key={tab}
                        className={`compliance-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'kyc' && <Shield size={16} />}
                        {tab === 'gdpr' && <Database size={16} />}
                        {tab === 'tax' && <Scale size={16} />}
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="compliance-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'kyc' && renderKYCTab()}
                        {activeTab === 'gdpr' && renderGDPRTab()}
                        {activeTab === 'tax' && renderTaxTab()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

const KYCLevelCard = ({ level, subtitle, limits, icon, featured, onAction, loading, actionLabel = "Initiate Verification" }) => (
    <motion.div 
        className={`level-card ${featured ? 'featured' : 'glass'}`}
        whileHover={{ scale: 1.02, translateY: -5 }}
    >
        <div className="level-icon">{icon}</div>
        <h3>{level}</h3>
        <span className="subtitle">{subtitle}</span>
        <ul>
            {limits.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
        <button className={`zenith-btn ${featured ? 'primary' : 'outline'}`} onClick={onAction} disabled={loading}>
            {loading ? 'Processing...' : actionLabel}
        </button>
    </motion.div>
);

const PrivacyRightCard = ({ title, desc, icon, actionLabel, danger }) => (
    <motion.div className="right-card glass" whileHover={{ scale: 1.02 }}>
        <div className="right-header">
            {icon}
            <h3>{title}</h3>
        </div>
        <p>{desc}</p>
        <button className={`action-link ${danger ? 'danger' : ''}`}>
            {actionLabel} <ChevronRight size={14} />
        </button>
    </motion.div>
);

const ReportCard = ({ title, desc }) => (
    <motion.div className="report-card glass" whileHover={{ scale: 1.02 }}>
        <div className="report-info">
            <div className="report-type-icon"><FileText size={18} /></div>
            <div>
                <h4>{title}</h4>
                <p>{desc}</p>
            </div>
        </div>
        <button className="icon-btn">
            <Download size={18} />
        </button>
    </motion.div>
);

const ConsentItem = ({ title, desc, defaultOn, required }) => {
    const [active, setActive] = useState(defaultOn);
    return (
        <div className="consent-item">
            <div className="consent-info">
                <div className="title-row">
                    <h4>{title}</h4>
                    {required && <span className="required-badge">Required</span>}
                </div>
                <p>{desc}</p>
            </div>
            <div 
                className={`zenith-toggle ${active ? 'active' : ''} ${required ? 'disabled' : ''}`}
                onClick={() => !required && setActive(!active)}
            >
                <div className="toggle-handle"></div>
            </div>
        </div>
    );
};

const getKYCLevelName = (level) => {
    const levels = ['None', 'Basic', 'Intermediate', 'Advanced', 'Institutional'];
    return levels[level] || 'Unknown';
};

export default ComplianceCenter;
