import React, { useEffect, useState, useCallback } from 'react';
import { pingBackendHealth, getApiBaseUrl, setCustomApiBaseUrl } from '../api/client';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Server, Settings, X } from 'lucide-react';

export type ServerStatus = 'checking' | 'waking' | 'online' | 'error';

export const ServerWakeupBanner: React.FC = () => {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [dismissed, setDismissed] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const isLocalHostTarget = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');
  const isHostedSite = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  const checkHealth = useCallback(async (isInitial = false) => {
    setCurrentUrl(getApiBaseUrl());
    if (isInitial) {
      setStatus('checking');
    }

    // Set a timer to show 'waking' if ping takes longer than 2.5 seconds (typical for sleeping Render container)
    const wakingTimer = setTimeout(() => {
      setStatus((prev) => (prev === 'checking' ? 'waking' : prev));
    }, 2500);

    const result = await pingBackendHealth(20000);
    clearTimeout(wakingTimer);

    if (result.ok) {
      setStatus('online');
      // Auto-dismiss the success banner after 4 seconds
      setTimeout(() => {
        setDismissed(true);
      }, 4000);
    } else {
      // If Render is sleeping, it usually takes 30-50s to wake up.
      // Automatically retry pinging up to 4 times
      if (retryCount < 4) {
        setStatus('waking');
        setRetryCount((prev) => prev + 1);
        setTimeout(() => {
          checkHealth(false);
        }, 6000);
      } else {
        setStatus('error');
      }
    }
  }, [retryCount]);

  useEffect(() => {
    setCurrentUrl(getApiBaseUrl());
    checkHealth(true);

    // Heartbeat: Ping every 10 minutes (600,000 ms) to keep Render awake while user is browsing
    const heartbeat = setInterval(() => {
      pingBackendHealth(15000);
    }, 10 * 60 * 1000);

    return () => clearInterval(heartbeat);
  }, []);

  const handleSaveCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setCustomApiBaseUrl(inputUrl.trim());
    setCurrentUrl(getApiBaseUrl());
    setShowConfig(false);
    setDismissed(false);
    setRetryCount(0);
    checkHealth(true);
  };

  // If dismissed or online after auto-dismiss, don't show the banner unless there's an issue or configuration is open
  if (dismissed && !showConfig) {
    // Only show a tiny pill indicator in bottom corner
    return (
      <div className="fixed bottom-3 right-3 z-50">
        <button
          onClick={() => { setDismissed(false); setShowConfig(true); }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-md backdrop-blur-md transition-all ${
            status === 'online' 
              ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50/90 text-amber-700 border border-amber-200 hover:bg-amber-100 animate-pulse'
          }`}
          title={`Backend URL: ${currentUrl}`}
        >
          <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
          <span>{status === 'online' ? 'Server Active' : 'Server Warming Up'}</span>
          <Settings className="w-3 h-3 ml-0.5 opacity-60" />
        </button>
      </div>
    );
  }

  return (
    <aside 
      aria-label="Server status"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      {/* Banner bar */}
      <div className={`px-4 py-2.5 text-sm shadow-md transition-colors border-b flex flex-wrap items-center justify-between gap-3 ${
        status === 'online'
          ? 'bg-emerald-600 text-white border-emerald-700'
          : status === 'waking'
          ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white border-indigo-800'
          : status === 'error'
          ? 'bg-amber-700 text-white border-amber-800'
          : 'bg-slate-800 text-slate-100 border-slate-900'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {status === 'online' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          )}
          {status === 'waking' && (
            <div className="relative flex items-center justify-center shrink-0">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span>
              <Activity className="w-4 h-4 text-amber-300 shrink-0" />
            </div>
          )}
          {status === 'checking' && (
            <RefreshCw className="w-4 h-4 text-indigo-200 shrink-0 animate-spin" />
          )}
          {status === 'error' && (
            <AlertCircle className="w-4 h-4 text-amber-200 shrink-0" />
          )}

          <div className="text-xs sm:text-sm font-medium truncate">
            {status === 'online' && (
              <span>Backend server is online and active!</span>
            )}
            {status === 'waking' && (
              <span>
                Waking up Render cloud backend (takes ~30–50s on free tier)... Please wait while services start.
              </span>
            )}
            {status === 'checking' && (
              <span>Connecting to backend server...</span>
            )}
            {status === 'error' && (
              <span>
                {isHostedSite && isLocalHostTarget 
                  ? 'Backend URL is pointing to localhost on Vercel deployment. Please configure your Render URL.'
                  : 'Backend server is taking longer than usual to respond.'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {status !== 'online' && (
            <button
              onClick={() => { setRetryCount(0); checkHealth(false); }}
              className="flex items-center gap-1 text-xs bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-md transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1 text-xs bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-md transition-colors"
            title="Configure Backend URL"
          >
            <Server className="w-3 h-3" />
            <span className="hidden sm:inline">Backend URL</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded-md transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Config Drawer / Modal if user clicks 'Backend URL' */}
      {showConfig && (
        <div className="bg-white border-b border-slate-200 shadow-xl p-4 sm:p-6 text-slate-800 animate-in slide-in-from-top duration-200">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                Backend Connection Settings
              </h3>
              <button 
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Current active API Base URL:{' '}
              <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs">
                {currentUrl}
              </code>
            </p>

            {isHostedSite && isLocalHostTarget && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <strong>Attention:</strong> This frontend is deployed on Vercel, but the API endpoint is currently defaulting to <code>localhost</code>. Enter your deployed Render backend URL below (e.g. <code>https://ai-career-intelligence-backend.onrender.com</code>) to connect immediately.
              </div>
            )}

            <form onSubmit={handleSaveCustomUrl} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://your-service.onrender.com"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                Save & Connect
              </button>
              {localStorage.getItem('CUSTOM_API_BASE_URL') && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomApiBaseUrl('');
                    setCurrentUrl(getApiBaseUrl());
                    checkHealth(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm px-3 py-2 rounded-lg transition-colors"
                >
                  Reset
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
