import { useState } from 'react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('admin-key-change-me');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem('apiKey', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* API Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This key is used for authenticating API requests from the dashboard.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Role-Based Access Control Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Role-Based Access Control</h2>
        
        <div className="space-y-4">
          <RBACRow 
            role="Admin" 
            description="Full access to all features including user management"
            keyName="ADMIN_API_KEY"
          />
          <RBACRow 
            role="Operator" 
            description="Can create/update incidents and acknowledge alerts"
            keyName="OPERATOR_API_KEY"
          />
          <RBACRow 
            role="Viewer" 
            description="Read-only access to incidents and metrics"
            keyName="VIEWER_API_KEY"
          />
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Information</h2>
        
        <dl className="space-y-3">
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Database" value="SQLite (better-sqlite3)" />
          <InfoRow label="MCP Protocol" value="v1.0.0" />
          <InfoRow label="Platform" value="Cross-Platform (Windows/macOS/Linux)" />
        </dl>
      </div>
    </div>
  );
}

function RBACRow({ role, description, keyName }: { role: string; description: string; keyName: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white">{role}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        <code className="text-xs text-primary-600 dark:text-primary-400 mt-2 block">{keyName}</code>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}
