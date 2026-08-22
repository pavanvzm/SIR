import { useState, useEffect } from 'react';

interface Alert {
  id: string;
  message: string;
  priority: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  created_at: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('unacknowledged');

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const response = await fetch('/api/alerts', {
        headers: { 'X-API-Key': 'admin-key-change-me' },
      });
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function acknowledgeAlert(alertId: string) {
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'X-API-Key': 'admin-key-change-me',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 'current-user' }),
      });
      
      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => !a.acknowledged);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts</h1>
        <div className="flex gap-2">
          {(['all', 'unacknowledged'] as const).map((f) => (
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
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-400">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border ${
                alert.acknowledged
                  ? 'border-gray-200 dark:border-slate-700 opacity-60'
                  : 'border-danger-200 dark:border-danger-900/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <PriorityBadge priority={alert.priority} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white">{alert.message}</p>
                  {alert.acknowledged && (
                    <p className="text-sm text-success-600 dark:text-success-400 mt-2">
                      Acknowledged by {alert.acknowledged_by}
                    </p>
                  )}
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-danger-600 text-white',
    high: 'bg-danger-500 text-white',
    medium: 'bg-warning-500 text-white',
    low: 'bg-primary-500 text-white',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${colors[priority] || colors.low}`}>
      {priority}
    </span>
  );
}
