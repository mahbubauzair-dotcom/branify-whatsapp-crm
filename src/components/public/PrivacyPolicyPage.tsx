import React, { useEffect, useState } from 'react';
import {
  Shield,
  Lock,
  MessageSquare,
  Database,
  Server,
  Cpu,
  Globe,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Printer,
  Copy,
  Check,
  Building,
  FileText,
  UserCheck,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigateHome?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigateHome }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

  const brandInfo = {
    name: 'Branify',
    crmName: 'Branify WhatsApp CRM',
    website: 'https://branify.store/',
    supportPhone: '+92 332 1029333',
    supportPhoneRaw: '923321029333',
    privacyEmail: 'admin@branify.store',
    lastUpdated: 'August 27, 2026',
    waIdentity: '@branify002',
  };

  useEffect(() => {
    // Dynamically set document title and meta description
    const previousTitle = document.title;
    document.title = 'Privacy Policy — Branify WhatsApp CRM';

    let metaDesc = document.querySelector('meta[name="description"]');
    const previousDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Official Privacy Policy for Branify WhatsApp CRM. Learn how Branify collects, uses, stores, and protects information when communicating via WhatsApp.'
      );
    }

    window.scrollTo({ top: 0, behavior: 'instant' });

    return () => {
      document.title = previousTitle;
      if (metaDesc && previousDesc) {
        metaDesc.setAttribute('content', previousDesc);
      }
    };
  }, []);

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined'
      ? window.location.origin + '/privacy-policy'
      : 'https://branify-whatsapp-crm.vercel.app/privacy-policy';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const sections = [
    { id: 'overview', title: '1. Overview & Purpose' },
    { id: 'information-processed', title: '2. Information We May Process' },
    { id: 'how-we-use', title: '3. How We Use Information' },
    { id: 'whatsapp-meta', title: '4. WhatsApp & Meta Integration' },
    { id: 'third-party-providers', title: '5. Third-Party Service Providers' },
    { id: 'data-security', title: '6. Data Security' },
    { id: 'cookies-storage', title: '7. Cookies & Local Storage' },
    { id: 'data-retention', title: '8. Data Retention' },
    { id: 'privacy-rights', title: '9. Your Privacy Rights' },
    { id: 'marketing-opt-out', title: '10. Marketing & Opt-Out' },
    { id: 'data-sharing', title: '11. Data Sharing' },
    { id: 'contact-requests', title: '12. Privacy Requests & Contact' },
    { id: 'policy-changes', title: '13. Changes to This Privacy Policy' },
  ];

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Brand Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#090A0F]/90 backdrop-blur-xl border-b border-amber-500/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoHome}
              className="flex items-center gap-3 group text-left cursor-pointer"
              title="Return to Branify CRM"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-amber-500/30 shadow-md shadow-amber-500/10 bg-black flex items-center justify-center shrink-0">
                <img
                  src="/branify-logo.jpg"
                  alt="Branify Official Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors text-sm sm:text-base">
                    BRANIFY
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    CRM
                  </span>
                </div>
                <span className="text-[10px] text-amber-400/80 font-medium tracking-wider hidden sm:block">
                  BUILD. BRAND. GROW.
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer"
              title="Copy Privacy Policy URL"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Share Link</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              title="Print Privacy Policy"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleGoHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to CRM</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-12 pb-8 px-4 sm:px-6 border-b border-slate-800/80 bg-gradient-to-b from-amber-950/20 via-[#090A0F] to-[#090A0F]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium mb-4">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Legal Disclosure</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            <strong className="text-white">Branify</strong> respects the privacy of customers, contacts, and authorized CRM users. This Privacy Policy explains how information is collected, used, stored, and protected when communicating with Branify through WhatsApp or when using the <strong className="text-amber-300">Branify WhatsApp CRM</strong> platform.
          </p>

          <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            By communicating with Branify through WhatsApp or using services associated with Branify, you acknowledge the practices described in this Privacy Policy.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-amber-400" />
              <span>Brand: <strong className="text-slate-200">{brandInfo.name}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-amber-400" />
              <a
                href={brandInfo.website}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>branify.store</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp: <strong className="text-slate-200">{brandInfo.supportPhone}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Last Updated: <strong className="text-slate-200">{brandInfo.lastUpdated}</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Table of Contents - Desktop Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
                <div className="flex items-center gap-2 pb-3 mb-2 border-b border-slate-800 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Table of Contents</span>
                </div>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                        activeSection === section.id
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="truncate">{section.title}</span>
                      <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                    </button>
                  ))}
                </nav>
              </div>

              {/* Quick Identity Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-500/20 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Official Business Identity</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Operated directly by <strong className="text-white">Branify</strong> for official customer service and messaging.
                </p>
                <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Identity:</span>
                    <span className="font-mono text-amber-300">{brandInfo.waIdentity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Support:</span>
                    <span className="font-mono text-emerald-400">{brandInfo.supportPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-mono text-slate-200">{brandInfo.privacyEmail}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Legal Document Body */}
          <main className="lg:col-span-8 space-y-8 text-slate-300 text-sm leading-relaxed">
            {/* 1. Overview & Purpose */}
            <section id="overview" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  1
                </span>
                <span>Overview & Purpose</span>
              </h2>
              <div className="space-y-3">
                <p>
                  <strong className="text-white">Branify WhatsApp CRM</strong> is an internal customer relationship management and communication platform operated by <strong className="text-white">Branify</strong>.
                </p>
                <p>
                  The platform is used to manage customer inquiries, WhatsApp conversations, support requests, lead information, follow-ups, and related business communication.
                </p>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    The CRM is primarily an internal business system. Customers do not need to create a CRM account in order to communicate with Branify through WhatsApp.
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Information We May Process */}
            <section id="information-processed" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  2
                </span>
                <span>Information We May Process</span>
              </h2>
              <div className="space-y-4">
                <p>
                  Depending on how you interact with Branify, the following information may be processed:
                </p>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* WhatsApp and Contact Information */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>WhatsApp and Contact Information</span>
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-xs">
                      <li>WhatsApp phone number or WhatsApp identifier (<span className="font-mono text-amber-300">wa_id</span>)</li>
                      <li>WhatsApp profile name where provided by WhatsApp/Meta</li>
                      <li>Name, email address, company information, or other contact information that you voluntarily provide</li>
                    </ul>
                  </div>

                  {/* WhatsApp Communications */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Communications</span>
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-xs">
                      <li>Messages sent to Branify</li>
                      <li>Message timestamps</li>
                      <li>Message types</li>
                      <li>Delivery/read status information</li>
                      <li>References to media or attachments associated with messages where applicable</li>
                    </ul>
                  </div>

                  {/* CRM Information */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      <span>CRM Information</span>
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-xs">
                      <li>Customer notes</li>
                      <li>Tags</li>
                      <li>Lead scores</li>
                      <li>Conversation status</li>
                      <li>Sales pipeline information</li>
                      <li>Deal information</li>
                      <li>Follow-up tasks created by authorized CRM operators</li>
                    </ul>
                  </div>

                  {/* Technical and Security Information */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      <span>Technical and Security Information</span>
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-xs">
                      <li>Authentication/session information for authorized CRM users</li>
                      <li>Webhook and application diagnostic information</li>
                      <li>Security and audit records generated by the CRM</li>
                    </ul>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic pt-1">
                  We do not intentionally request sensitive personal information unless it is necessary for a legitimate business purpose and provided by the user.
                </p>
              </div>
            </section>

            {/* 3. How We Use Information */}
            <section id="how-we-use" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  3
                </span>
                <span>How We Use Information</span>
              </h2>
              <div className="space-y-3">
                <p>
                  Branify may use the information described above to:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Respond to customer inquiries and support requests</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Manage WhatsApp conversations</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Process and track customer or order-related inquiries where applicable</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Maintain customer and lead records</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Organize conversations using tags, statuses, and assignments</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Schedule follow-ups</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Provide automated replies or workflow actions where configured</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Improve internal customer support and CRM operations</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Protect the CRM from unauthorized access, abuse, and spam</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Maintain security and audit records</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 4. WhatsApp & Meta Integration */}
            <section id="whatsapp-meta" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  4
                </span>
                <span>WhatsApp & Meta Integration</span>
              </h2>
              <div className="space-y-4">
                <p>
                  Branify WhatsApp CRM uses the official <strong className="text-white">Meta WhatsApp Business Platform / WhatsApp Cloud API</strong> for WhatsApp communication.
                </p>
                <p>
                  When you send a WhatsApp message to Branify, Meta may process and transmit that communication to Branify's configured WhatsApp Business account and webhook infrastructure.
                </p>
                <p>
                  The Branify CRM receives relevant WhatsApp webhook events and may store applicable contact, conversation, message, and delivery information for customer service and CRM purposes.
                </p>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-amber-300 uppercase tracking-wider mb-1">
                    Official Branify WhatsApp Identity:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                    <div>Display / Brand Name: <strong className="text-white">{brandInfo.name}</strong></div>
                    <div>WhatsApp Username / Identity: <strong className="text-amber-300 font-mono">{brandInfo.waIdentity}</strong></div>
                    <div>Support Number: <strong className="text-emerald-400 font-mono">{brandInfo.supportPhone}</strong></div>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  For additional information about WhatsApp's handling of personal information, please review WhatsApp's Privacy Policy:{' '}
                  <a
                    href="https://www.whatsapp.com/legal/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    https://www.whatsapp.com/legal/privacy-policy
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </section>

            {/* 5. Third-Party Service Providers */}
            <section id="third-party-providers" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  5
                </span>
                <span>Third-Party Service Providers</span>
              </h2>
              <div className="space-y-4">
                <p>
                  Branify may use third-party technology providers to operate the CRM infrastructure:
                </p>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Supabase</span>
                    </div>
                    <p className="text-slate-400">
                      Supabase provides database, authentication, and related backend infrastructure used by the CRM.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Server className="w-4 h-4 text-indigo-400" />
                      <span>Vercel</span>
                    </div>
                    <p className="text-slate-400">
                      Vercel provides hosting and serverless application infrastructure for the CRM.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>Meta / WhatsApp</span>
                    </div>
                    <p className="text-slate-400">
                      Meta provides the WhatsApp Business Platform and WhatsApp Cloud API used for WhatsApp messaging and webhook communication.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <span>Google Gemini</span>
                    </div>
                    <p className="text-slate-400">
                      Where AI-assisted CRM functionality is enabled, Google Gemini may be used to generate suggested replies, conversation summaries, intent analysis, or other AI-assisted outputs requested by an authorized CRM operator. Only information necessary for the requested functionality should be sent to an AI service.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-200 font-medium">
                  Branify does not sell or rent customer personal information.
                </div>
              </div>
            </section>

            {/* 6. Data Security */}
            <section id="data-security" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  6
                </span>
                <span>Data Security</span>
              </h2>
              <div className="space-y-4">
                <p>
                  Branify uses reasonable technical and organizational safeguards designed to protect CRM information against unauthorized access, misuse, loss, or alteration.
                </p>

                <p>Security measures may include:</p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <li className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>HTTPS/TLS encrypted connections</span>
                  </li>
                  <li className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Authentication and access controls for CRM operators</span>
                  </li>
                  <li className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Row Level Security (RLS) for supported database records</span>
                  </li>
                  <li className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                    <Server className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Server-side handling of sensitive API credentials</span>
                  </li>
                  <li className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Webhook authentication and signature verification</span>
                  </li>
                  <li className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Audit logging for selected sensitive administrative actions</span>
                  </li>
                </ul>

                <p className="text-xs text-slate-400 italic">
                  Sensitive credentials such as Meta access tokens, application secrets, Supabase service-role credentials, and AI provider API keys are not intended to be exposed through the public CRM interface.
                </p>
              </div>
            </section>

            {/* 7. Cookies & Local Storage */}
            <section id="cookies-storage" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  7
                </span>
                <span>Cookies & Local Storage</span>
              </h2>
              <div className="space-y-3">
                <p>
                  The Branify WhatsApp CRM may use necessary browser storage mechanisms to maintain authenticated sessions and selected interface preferences.
                </p>
                <p>
                  The CRM does not intentionally use third-party advertising cookies or advertising pixels for the operation of the CRM itself.
                </p>
              </div>
            </section>

            {/* 8. Data Retention */}
            <section id="data-retention" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  8
                </span>
                <span>Data Retention</span>
              </h2>
              <div className="space-y-3">
                <p>
                  Branify may retain customer contact information, WhatsApp communications, and related CRM records for as long as reasonably necessary for customer service, operational, security, accounting, legal, or other legitimate business purposes.
                </p>
                <p>
                  Retention periods may vary depending on the nature of the information and the purpose for which it is processed.
                </p>
              </div>
            </section>

            {/* 9. Your Privacy Rights */}
            <section id="privacy-rights" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  9
                </span>
                <span>Your Privacy Rights</span>
              </h2>
              <div className="space-y-4">
                <p>
                  Depending on applicable law and jurisdiction, you may have rights relating to your personal information, including:
                </p>

                <ul className="space-y-2 text-xs sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Requesting access to personal information held by Branify</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Requesting correction of inaccurate information</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Requesting deletion where legally applicable</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Asking questions about how your information is processed</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Requesting to stop receiving marketing communications</span>
                  </li>
                </ul>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-amber-300">WhatsApp Opt-Out:</div>
                  <p>
                    To opt out of marketing communications through WhatsApp, you may send “STOP” or another supported opt-out keyword in the WhatsApp conversation.
                  </p>
                </div>

                <p className="text-xs text-slate-400">
                  Requests may be submitted through Branify's official support channels listed below.
                </p>
              </div>
            </section>

            {/* 10. Marketing & Opt-Out */}
            <section id="marketing-opt-out" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  10
                </span>
                <span>Marketing & Opt-Out</span>
              </h2>
              <div className="space-y-3">
                <p>
                  Branify aims to avoid unsolicited marketing communications.
                </p>
                <p>
                  Marketing communications should only be sent where an appropriate lawful basis or consent exists and where required by applicable WhatsApp/Meta policies.
                </p>
                <p>
                  When an applicable opt-out request is received, Branify may update its CRM records to prevent future marketing communications.
                </p>
              </div>
            </section>

            {/* 11. Data Sharing */}
            <section id="data-sharing" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  11
                </span>
                <span>Data Sharing</span>
              </h2>
              <div className="space-y-3">
                <p className="font-semibold text-white">
                  Branify does not sell or rent personal information.
                </p>
                <p>
                  Information may be shared with service providers only where reasonably necessary to provide the CRM, WhatsApp messaging, hosting, database, authentication, security, or optional AI-assisted functionality.
                </p>
                <p>
                  Branify may also disclose information where required by applicable law, regulation, legal process, or to protect the security and rights of Branify, its customers, or its systems.
                </p>
              </div>
            </section>

            {/* 12. Privacy Requests & Contact */}
            <section id="contact-requests" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/30">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  12
                </span>
                <span>Privacy Requests & Contact</span>
              </h2>
              <div className="space-y-4">
                <p>
                  For privacy questions, access requests, correction requests, or deletion requests, contact:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block">Official Website</span>
                    <a
                      href={brandInfo.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-amber-300 hover:underline flex items-center gap-1.5"
                    >
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span>{brandInfo.website}</span>
                    </a>
                  </div>

                  <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block">WhatsApp Support</span>
                    <a
                      href={`https://wa.me/${brandInfo.supportPhoneRaw}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-400 hover:underline flex items-center gap-1.5"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>{brandInfo.supportPhone}</span>
                    </a>
                  </div>

                  <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block">Privacy Email</span>
                    <a
                      href={`mailto:${brandInfo.privacyEmail}`}
                      className="font-bold text-indigo-300 hover:underline flex items-center gap-1.5"
                    >
                      <Mail className="w-4 h-4 text-indigo-400" />
                      <span>{brandInfo.privacyEmail}</span>
                    </a>
                  </div>

                  <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block">CRM Platform</span>
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span>{brandInfo.crmName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 13. Changes to This Privacy Policy */}
            <section id="policy-changes" className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  13
                </span>
                <span>Changes to This Privacy Policy</span>
              </h2>
              <div className="space-y-3">
                <p>
                  Branify may update this Privacy Policy from time to time to reflect changes to the CRM, WhatsApp/Meta integrations, service providers, operational practices, or applicable legal requirements.
                </p>
                <p>
                  The latest version and effective date will always be displayed on this page.
                </p>
                <div className="pt-2 text-xs text-slate-400">
                  Effective / Last Updated: <strong className="text-slate-200">{brandInfo.lastUpdated}</strong>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#06070a] py-8 px-4 sm:px-6 mt-16 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-amber-500/30 bg-black flex items-center justify-center">
              <img
                src="/branify-logo.jpg"
                alt="Branify Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-bold text-slate-300">{brandInfo.crmName}</span>
              <span className="mx-2 text-slate-700">•</span>
              <span className="text-amber-400/80 font-medium">BUILD. BRAND. GROW.</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={handleGoHome}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Back to CRM
            </button>
            <span>•</span>
            <a
              href="/privacy-policy"
              className="text-amber-400 font-medium hover:underline"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a
              href={brandInfo.website}
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-300 transition-colors"
            >
              branify.store
            </a>
            <span>•</span>
            <span className="text-slate-600">© {new Date().getFullYear()} Branify. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
