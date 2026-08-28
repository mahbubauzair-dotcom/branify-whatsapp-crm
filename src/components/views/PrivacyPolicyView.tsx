import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Printer,
  Search,
  Lock,
  MessageSquare,
  Server,
  Database,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  Eye,
  UserCheck,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { BRANIFY_DEFAULTS } from '../../lib/supabase';

interface PrivacyPolicyViewProps {
  onOpenPublicPolicy?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onOpenPublicPolicy }) => {
  const [activeTab, setActiveTab] = useState<'policy' | 'meta_compliance' | 'data_rights'>('policy');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const publicUrl = 'https://branify-whatsapp-crm.vercel.app/privacy-policy';

  const metaReviewStatement = `The application operates as Branify's proprietary WhatsApp customer communication and CRM system. The 'whatsapp_business_messaging' permission is used strictly by authorized business staff to respond to inbound customer inquiries, send order updates, and deliver requested product assistance via WhatsApp Cloud API. Customer communication data is transmitted over TLS 1.3 encryption, stored securely with Row-Level Security, and never shared with unauthorized third parties. Automated keyword opt-out (STOP/UNSUBSCRIBE) is enforced immediately.`;

  const sections = [
    {
      id: 'overview',
      number: '1',
      title: 'Overview & Purpose of This Policy',
      content: `Branify ("we", "our", or "us") is dedicated to protecting the privacy, confidentiality, and security of our customers, clients, website visitors, and CRM platform users. This Privacy Policy details how we collect, process, store, retain, disclose, and protect personal and business information across our website, our WhatsApp Business communication channels, and our customer relationship management (CRM) platform.\n\nBy accessing our website, communicating with us via WhatsApp, or utilizing our customer services, you acknowledge that you have read and understood this Privacy Policy.`,
    },
    {
      id: 'information-collected',
      number: '2',
      title: 'Information We May Process',
      content: `We only collect and process personal data that is strictly necessary to deliver, manage, and optimize our services.\n\n• Identity & Contact Information: Full name, business name, phone number, email address (admin@branify.store), billing/shipping address, and social media or WhatsApp handles.\n• Communication & Messaging Records: Message timestamps, inbound inquiries, support chat history, message delivery statuses, and customer service requests.\n• CRM & Transactional Metadata: Customer tags, lead status, deal stages, purchase histories, order references, invoice details, and assigned support notes.\n• Technical & Diagnostic Data: IP addresses, browser types, operating systems, access logs, and error telemetry for platform reliability.`,
    },
    {
      id: 'how-we-use',
      number: '3',
      title: 'How We Use Information',
      content: `All processed information is used solely for legitimate business operations and customer service fulfillment:\n\n• Responding directly to customer questions, product inquiries, and quotation requests.\n• Delivering transactional notifications, order updates, invoices, and scheduling reminders via WhatsApp.\n• Managing customer relationships, support tickets, and business deal pipelines within our internal CRM.\n• Maintaining system security, debugging webhooks, verifying user authorization, and preventing fraudulent activity.\n• Complying with applicable legal obligations, tax regulations, and accounting standards.`,
    },
    {
      id: 'whatsapp-meta',
      number: '4',
      title: 'WhatsApp & Meta Integration Compliance',
      content: `Our CRM integrates with the official Meta WhatsApp Cloud API to facilitate seamless business communication with customers.\n\n• Official WhatsApp Identity: Active account handle @branify002 associated with support number +92 332 1029333.\n• Scope of Permission: The whatsapp_business_messaging permission is used solely to exchange customer support and transactional messages. We do not use WhatsApp data for external profiling or unconsented advertising.\n• Zero Credential Exposure: Meta API keys, access tokens, and webhook verify secrets are stored server-side with strict environment isolation and are never exposed to browser clients.\n• Message Opt-Out Handling: Customers who text "STOP", "UNSUBSCRIBE", or similar commands are automatically flagged and excluded from non-essential messaging.`,
    },
    {
      id: 'third-party-services',
      number: '5',
      title: 'Third-Party Service Providers (Sub-Processors)',
      content: `We engage reputable enterprise infrastructure and service providers under strict data processing agreements:\n\n• Meta Platforms, Inc. / WhatsApp LLC: Cloud API routing for official business messaging.\n• Supabase Inc.: Cloud PostgreSQL database infrastructure featuring Row-Level Security (RLS) and end-to-end encryption at rest.\n• Vercel Inc.: Enterprise hosting and serverless execution for web applications and webhook endpoints.\n• Google Cloud & Google Gemini: AI assistance strictly for automated contextual summaries, topic categorization, and grounded knowledge base search. Customer data is not used to train public models.\n\nWe do not sell, rent, lease, or monetize customer personal data under any circumstances.`,
    },
    {
      id: 'data-security',
      number: '6',
      title: 'Data Security & Storage Controls',
      content: `We apply industry-standard organizational and technical safeguards to protect your personal information:\n\n• Encryption in Transit: All data transfers, API calls, and webhook events are protected via TLS 1.3 / HTTPS encryption.\n• Encryption at Rest: Database volumes, customer profiles, and message logs are encrypted using AES-256 standards.\n• Access Control & Isolation: Access to the CRM is limited to authenticated personnel via secure credential tokens and role-based permissions.\n• Database Hardening: Database access utilizes strict Row-Level Security (RLS) policies preventing cross-tenant or unauthorized record inspection.`,
    },
    {
      id: 'cookies',
      number: '7',
      title: 'Cookies & Local Storage',
      content: `Our web application utilizes essential first-party cookies and browser local storage strictly required for operational functionality:\n\n• Session & Authentication: Storing secure JWT tokens and maintaining logged-in admin state.\n• User Preferences: Storing UI layout choices, dark theme settings, and navigation states.\n• We do not deploy third-party advertising cookies or cross-site tracking pixels on our CRM.`,
    },
    {
      id: 'data-retention',
      number: '8',
      title: 'Data Retention Schedule',
      content: `We retain personal and messaging data only for as long as necessary to fulfill the operational purposes described in this policy:\n\n• Active Customer Communications: Retained for the duration of the commercial relationship to ensure continuous support history.\n• Transactional & Financial Records: Retained for up to 7 years in accordance with applicable tax and statutory reporting mandates.\n• Diagnostic & Webhook Logs: Retained for 90 days before automated rotation and purging.\n• Upon receiving a verified deletion request, personal records are permanently erased from active databases within 30 days.`,
    },
    {
      id: 'privacy-rights',
      number: '9',
      title: 'Your Privacy Rights & Choices',
      content: `Depending on your jurisdiction (including GDPR, CCPA, and applicable local privacy frameworks), you have clear rights regarding your personal data:\n\n• Right of Access: Request a copy of all personal records we hold regarding your account.\n• Right to Rectification: Correct inaccurate or outdated personal details.\n• Right to Erasure ("Right to be Forgotten"): Request permanent deletion of your personal records.\n• Right to Restrict Processing: Limit how we process your information.\n• Right to Opt-Out: Immediately cease non-transactional WhatsApp messaging by texting "STOP".\n\nTo exercise any privacy rights, contact us at admin@branify.store.`,
    },
    {
      id: 'marketing-optout',
      number: '10',
      title: 'Marketing & Promotional Communications',
      content: `We only send promotional broadcasts or marketing offers to contacts who have explicitly opted in or initiated commercial contact with Branify.\n\nEvery marketing message includes clear instructions on how to opt out. Customers may reply "STOP" or "UNSUBSCRIBE" at any time to immediately withdraw consent without affecting order confirmations or warranty support.`,
    },
    {
      id: 'data-sharing',
      number: '11',
      title: 'Disclosure & Data Sharing Restrictions',
      content: `We do not sell, trade, or distribute your personal data. Disclosures are made only under the following limited circumstances:\n\n• Authorized Sub-Processors: Vetted service providers (Meta, Supabase, Vercel) necessary to run the platform under binding confidentiality agreements.\n• Legal & Regulatory Compliance: When strictly mandated by applicable law, court order, or official governmental request.\n• Protection of Rights: When necessary to enforce our service terms or protect the security, safety, and rights of Branify and our users.`,
    },
    {
      id: 'contact-requests',
      number: '12',
      title: 'Privacy Requests & Official Contact Information',
      content: `For any inquiries, data access requests, deletion notices, or questions regarding this Privacy Policy, please contact our designated Privacy Office:\n\n• Business Name: Branify\n• Privacy & Compliance Email: admin@branify.store\n• WhatsApp Support Number: +92 332 1029333\n• Official Website: https://branify.store/\n• WhatsApp Handle: @branify002\n\nWe respond to all verified privacy requests within thirty (30) business days.`,
    },
    {
      id: 'policy-changes',
      number: '13',
      title: 'Modifications to This Privacy Policy',
      content: `We may periodically update this Privacy Policy to reflect enhancements to our CRM features, updates to WhatsApp Cloud API standards, or changes in legal regulations.\n\nThe "Last Updated" date at the top of this policy indicates the latest revision. Any material modifications will be posted directly to our public policy page. Continued use of our communication channels after updates constitutes acceptance of the revised terms.`,
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.content.toLowerCase().includes(query) ||
        s.number.includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Meta App Review & Compliance Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Meta App Review & Compliance Center
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                whatsapp_business_messaging: Active & Compliant
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                Effective: August 27, 2026
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Privacy Policy & WhatsApp Data Protection
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Official disclosures, data handling safeguards, sub-processor security standards, and customer consent management for <span className="text-white font-semibold">{BRANIFY_DEFAULTS.businessName}</span> ({BRANIFY_DEFAULTS.username} / {BRANIFY_DEFAULTS.formattedPhone}).
            </p>
          </div>

          {/* Action Buttons for Demonstration Video */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Open Public Policy URL</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>

            <button
              onClick={() => copyToClipboard(publicUrl, 'publicUrl')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy Public Privacy Policy Link"
            >
              {copiedKey === 'publicUrl' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{copiedKey === 'publicUrl' ? 'Copied' : 'Copy URL'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print Policy Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Quick Identity Grid */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Official Handle</span>
            <div className="text-amber-400 font-mono font-semibold mt-0.5">{BRANIFY_DEFAULTS.username}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Support Phone</span>
            <div className="text-emerald-400 font-mono font-semibold mt-0.5">{BRANIFY_DEFAULTS.formattedPhone}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Privacy Email</span>
            <div className="text-indigo-300 font-mono font-semibold mt-0.5">admin@branify.store</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Storage & Security</span>
            <div className="text-slate-200 font-medium mt-0.5">Supabase RLS & TLS 1.3</div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'policy'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Privacy Policy (13 Sections)</span>
          </button>

          <button
            onClick={() => setActiveTab('meta_compliance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'meta_compliance'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Meta & WhatsApp Review Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('data_rights')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'data_rights'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Data Subject Rights & Opt-Outs</span>
          </button>
        </div>

        {activeTab === 'policy' && (
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search policy sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Full Interactive Privacy Policy */}
      {activeTab === 'policy' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Quick Table of Contents Sticky Sidebar */}
          <div className="hidden lg:block lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sticky top-6 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Table of Contents</span>
            </h3>
            <nav className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-1">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setSelectedSection(sec.id)}
                  className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedSection === sec.id
                      ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="font-mono text-slate-500 mr-1.5">{sec.number}.</span>
                  <span>{sec.title}</span>
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-slate-800/80 px-2 space-y-1">
              <div className="text-[11px] text-slate-400">Official Privacy Inquiries:</div>
              <a
                href="mailto:admin@branify.store"
                className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 font-medium"
              >
                <Mail className="w-3 h-3" />
                <span>admin@branify.store</span>
              </a>
            </div>
          </div>

          {/* Section Reader */}
          <div className="lg:col-span-3 space-y-5">
            {filteredSections.map((sec) => (
              <div
                key={sec.id}
                id={sec.id}
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-sm hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-xs font-bold font-mono">
                      {sec.number}
                    </span>
                    <h3 className="text-base font-bold text-white">{sec.title}</h3>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${sec.title}\n\n${sec.content}`, `sec-${sec.id}`)}
                    className="text-slate-500 hover:text-amber-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Copy section content"
                  >
                    {copiedKey === `sec-${sec.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line">
                  {sec.content}
                </div>
              </div>
            ))}

            {filteredSections.length === 0 && (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No privacy policy sections found matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Meta App Review & WhatsApp Compliance Matrix */}
      {activeTab === 'meta_compliance' && (
        <div className="space-y-6">
          {/* Meta Review Quick Copy Box */}
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Meta App Review Official Justification</h3>
                  <p className="text-xs text-slate-400">
                    Use this formal description in the Meta Developer submission modal for <code className="text-indigo-300">whatsapp_business_messaging</code>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(metaReviewStatement, 'metaReview')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copiedKey === 'metaReview' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'metaReview' ? 'Copied' : 'Copy Description'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed select-all">
              {metaReviewStatement}
            </div>
          </div>

          {/* Sub-Processor Security Matrix */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              <span>Third-Party Sub-Processors & Data Security Architecture</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Service Provider</th>
                    <th className="pb-3 font-semibold">Role / Service</th>
                    <th className="pb-3 font-semibold">Data Handled</th>
                    <th className="pb-3 font-semibold">Security Safeguards</th>
                    <th className="pb-3 font-semibold">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Meta Platforms (WhatsApp Cloud API)</span>
                    </td>
                    <td className="py-3 text-slate-400">Messaging Gateway</td>
                    <td className="py-3 font-mono text-[11px] text-indigo-300">Inbound / outbound messages, media, templates</td>
                    <td className="py-3">TLS 1.3 encryption, server-side secret tokens</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Verified Compliant</span></td>
                  </tr>

                  <tr>
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Supabase Inc.</span>
                    </td>
                    <td className="py-3 text-slate-400">Database & Authentication</td>
                    <td className="py-3 font-mono text-[11px] text-indigo-300">Contact records, deal stages, chat logs</td>
                    <td className="py-3">PostgreSQL RLS, AES-256 at rest, SOC 2 compliant</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Encrypted & Isolated</span></td>
                  </tr>

                  <tr>
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span>Vercel Inc.</span>
                    </td>
                    <td className="py-3 text-slate-400">Serverless Host & Webhooks</td>
                    <td className="py-3 font-mono text-[11px] text-indigo-300">Webhook ingress payloads, UI rendering</td>
                    <td className="py-3">Automated HTTPS, edge firewalls, DDoS protection</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Active HTTPS</span></td>
                  </tr>

                  <tr>
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Google Cloud / Gemini AI</span>
                    </td>
                    <td className="py-3 text-slate-400">AI Intelligence Assistance</td>
                    <td className="py-3 font-mono text-[11px] text-indigo-300">Internal summaries, message drafts, search queries</td>
                    <td className="py-3">Zero model training on customer data, ephemeral inference</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Private Inference</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Data Subject Rights & Opt-Outs */}
      {activeTab === 'data_rights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">WhatsApp "STOP" Opt-Out</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                When a customer sends "STOP", "UNSUBSCRIBE", or "CANCEL" via WhatsApp, the CRM webhook triggers an automated opt-out flag, halting promotional broadcasts immediately.
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Automated Webhook Logic Enabled</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Data Subject Deletion ("Forget Me")</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customers may request complete record erasure by emailing <code className="text-amber-300">admin@branify.store</code>. Customer contacts, messages, and deal logs are expunged within 30 days.
              </p>
              <div className="pt-2 text-[11px] text-indigo-400 font-mono font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>GDPR & CCPA Compliant Workflow</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Data Portability / Export</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authorized CRM administrators can export customer profiles, chat histories, and deal summaries to standard CSV/JSON formats upon verified data subject requests.
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Structured Format Support</span>
              </div>
            </div>
          </div>

          {/* Verification Contact Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Direct Privacy Support & Escalation</h3>
            <p className="text-xs text-slate-300">
              For any regulatory, Meta verification, or customer data inquiries, our designated data protection team can be reached directly:
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <a
                href="mailto:admin@branify.store"
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 hover:text-amber-300 flex items-center gap-2 font-mono font-semibold"
              >
                <Mail className="w-4 h-4" />
                <span>admin@branify.store</span>
              </a>
              <a
                href={`https://wa.me/${BRANIFY_DEFAULTS.rawPhone}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300 flex items-center gap-2 font-mono font-semibold"
              >
                <Phone className="w-4 h-4" />
                <span>{BRANIFY_DEFAULTS.formattedPhone}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
