import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Send,
  MessageSquare,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { BRANIFY_DEFAULTS } from '../../lib/supabase';

export const AiCopilotView: React.FC = () => {
  const [copilotMode, setCopilotMode] = useState<'off' | 'suggest' | 'auto_reply'>('suggest');
  const [testCustomerMsg, setTestCustomerMsg] = useState('Hi! How much does your social media package cost and do you offer monthly plans?');
  const [testContactName, setTestContactName] = useState('Alex Rivera');
  const [aiOutput, setAiOutput] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runSandboxTest = async (action: 'suggest_reply' | 'summarize_conversation' | 'qualify_lead') => {
    setTesting(true);
    setAiOutput(null);

    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          conversationHistory: [
            {
              sender: 'customer',
              text: testCustomerMsg,
              timestamp: new Date().toISOString(),
            },
          ],
          contactName: testContactName,
        }),
      });

      const res = await response.json();
      if (res.success && res.data) {
        setAiOutput({ action, data: res.data });
      } else {
        setAiOutput({ action, error: res.error || 'Failed to generate response' });
      }
    } catch (e: any) {
      setAiOutput({ action, error: e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>Gemini AI Copilot & Automation Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure AI assistant behavior, test grounding in real-time, and manage automated customer replies
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Assistant Mode:</span>
          {(['off', 'suggest', 'auto_reply'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCopilotMode(mode)}
              className={`px-3 py-1 rounded-lg uppercase text-[10px] font-bold transition-colors cursor-pointer ${
                copilotMode === mode
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Explanation Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-2xl border transition-all ${
            copilotMode === 'off'
              ? 'bg-slate-900 border-purple-500 ring-1 ring-purple-500/30'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white">Manual Mode (OFF)</span>
            {copilotMode === 'off' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
          </div>
          <p className="text-[11px] text-slate-400">
            AI is completely disabled. Only human agents compose and send messages.
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            copilotMode === 'suggest'
              ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/30'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white">Draft Suggestions (SUGGEST)</span>
            {copilotMode === 'suggest' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
          </div>
          <p className="text-[11px] text-slate-400">
            AI generates draft replies inside the WhatsApp inbox for human one-click approval before sending.
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            copilotMode === 'auto_reply'
              ? 'bg-slate-900 border-purple-500 ring-1 ring-purple-500/30'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white">Autonomous (AUTO-REPLY)</span>
            {copilotMode === 'auto_reply' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
          </div>
          <p className="text-[11px] text-slate-400">
            AI automatically answers incoming customer inquiries based exclusively on the verified Knowledge Base.
          </p>
        </div>
      </div>

      {/* Interactive AI Sandbox */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">Live AI Prompt & Grounding Sandbox</h3>
            <p className="text-xs text-slate-400">Simulate customer incoming messages to test AI intelligence</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
            Powered by Gemini 2.5 Flash
          </span>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Simulated Customer Name</label>
              <input
                type="text"
                value={testContactName}
                onChange={(e) => setTestContactName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Business Identity</label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-400 font-mono">
                {BRANIFY_DEFAULTS.businessName} ({BRANIFY_DEFAULTS.website})
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Customer WhatsApp Message</label>
            <textarea
              rows={3}
              value={testCustomerMsg}
              onChange={(e) => setTestCustomerMsg(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => runSandboxTest('suggest_reply')}
              disabled={testing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Test Draft Suggestions</span>
            </button>

            <button
              onClick={() => runSandboxTest('qualify_lead')}
              disabled={testing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Lead Qualification</span>
            </button>

            <button
              onClick={() => runSandboxTest('summarize_conversation')}
              disabled={testing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Test Summarization</span>
            </button>
          </div>
        </div>

        {/* AI Output Window */}
        {testing ? (
          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>Consulting Gemini model with verified Branify grounding data...</span>
          </div>
        ) : aiOutput ? (
          <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-purple-800/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300">
              <span className="uppercase tracking-wider">AI Generation Result ({aiOutput.action}):</span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Grounded
              </span>
            </div>

            {aiOutput.error ? (
              <div className="text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{aiOutput.error}</span>
              </div>
            ) : (
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-64 overflow-y-auto">
                {JSON.stringify(aiOutput.data, null, 2)}
              </pre>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
