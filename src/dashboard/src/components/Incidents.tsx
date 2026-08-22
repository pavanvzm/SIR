import { useState, useEffect } from 'react';

interface Incident {
  id: string;
  title: string | null;
  description: string | null;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  status: string;
  created_at: string;
  updated_at: string | null;
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    fetchIncidents();
  }, []);

  async function fetchIncidents() {
    try {
      const response = await fetch('/api/incidents', {
        headers: { 'X-API-Key': 'admin-key-change-me' },
      });
      const data = await response.json();
      setIncidents(data.incidents || []);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredIncidents = filter === 'all' 
    ? incidents 
    : incidents.filter(i => i.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Incidents</h1>
        <div className="flex gap-2">
          {(['all', 'active', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-400">No incidents found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Severity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="border-t border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                      {incident.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white max-w-md truncate">
                      {incident.title}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={incident.status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(incident.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    P1: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
    P2: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    P3: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    P4: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[severity] || colors.P3}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
    resolved: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    escalated: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    pending: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}
