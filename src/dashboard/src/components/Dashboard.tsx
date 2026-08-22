import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StatusData {
  activeIncidents: number;
  unresolvedAlerts: number;
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

interface Incident {
  id: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  status: string;
  created_at: string;
}

interface Alert {
  id: string;
  message: string;
  priority: string;
  acknowledged: boolean;
  created_at: string;
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

export default function Dashboard() {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up WebSocket for real-time updates
    const ws = new WebSocket(`ws://${window.location.hostname}:3000/ws`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'incident_created' || data.type === 'incident_updated') {
        fetchDashboardData();
      }
    };

    return () => ws.close();
  }, []);

  async function fetchDashboardData() {
    try {
      const response = await fetch('/api/status', {
        headers: { 'X-API-Key': 'admin-key-change-me' },
      });
      const data = await response.json();
      setStatusData(data);
      setIncidents(data.incidents?.slice(0, 5) || []);
      setAlerts(data.alerts?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const severityData = incidents.reduce((acc, inc) => {
    acc[inc.severity] = (acc[inc.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(severityData).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Incidents"
          value={statusData?.activeIncidents || 0}
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          title="Unresolved Alerts"
          value={statusData?.unresolvedAlerts || 0}
          icon={Bell}
          color="warning"
        />
        <StatCard
          title="CPU Usage"
          value={`${statusData?.systemHealth?.cpuUsage || 0}%`}
          icon={Activity}
          color="primary"
        />
        <StatCard
          title="Memory Usage"
          value={`${statusData?.systemHealth?.memoryUsage || 0}%`}
          icon={TrendingUp}
          color="success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Incident Severity Distribution
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Health Metrics
          </h2>
          <div className="space-y-4">
            <MetricBar label="CPU Usage" value={statusData?.systemHealth?.cpuUsage || 0} color="bg-primary-500" />
            <MetricBar label="Memory Usage" value={statusData?.systemHealth?.memoryUsage || 0} color="bg-success-500" />
            <MetricBar label="Disk Usage" value={statusData?.systemHealth?.diskUsage || 0} color="bg-warning-500" />
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Active Incidents
        </h2>
        {incidents.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No active incidents
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Severity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id} className="border-b border-gray-100 dark:border-slate-700/50">
                    <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                      {incident.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{incident.title}</td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  color: 'primary' | 'danger' | 'warning' | 'success';
}) {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    danger: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
    warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
    success: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-gray-900 dark:text-white font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
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

function Bell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
