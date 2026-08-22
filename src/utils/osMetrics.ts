import os from 'os';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Interface for system metrics
 */
export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    speed: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  network: {
    interfaces: NetworkInterfaceInfo[];
  };
  uptime: number;
  platform: string;
  timestamp: string;
}

/**
 * Network interface information
 */
export interface NetworkInterfaceInfo {
  name: string;
  type: string;
  address: string;
  mac: string;
  internal: boolean;
}

/**
 * Interface for log providers (OS-agnostic)
 */
export interface ILogProvider {
  getRecentLogs(limit?: number): Promise<string[]>;
  getErrorLogs(since?: Date): Promise<string[]>;
}

/**
 * Windows Event Log Provider using PowerShell
 */
class WindowsLogProvider implements ILogProvider {
  async getRecentLogs(limit: number = 50): Promise<string[]> {
    try {
      const powershellCmd = `Get-EventLog -LogName System -Newest ${limit} | Select-Object -Property TimeGenerated,EntryType,Source,Message | ConvertTo-Json`;
      const output = execSync(powershellCmd, { encoding: 'utf8', shell: 'powershell.exe' });
      const events = JSON.parse(output);
      return events.map((e: Record<string, string>) => 
        `[${e.TimeGenerated}] ${e.EntryType}: ${e.Source} - ${e.Message}`
      );
    } catch (error) {
      console.error('Failed to read Windows Event Log:', error);
      return [];
    }
  }

  async getErrorLogs(since?: Date): Promise<string[]> {
    try {
      const sinceStr = since ? since.toISOString() : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const powershellCmd = `Get-EventLog -LogName System -EntryType Error -After "${sinceStr}" | Select-Object -Property TimeGenerated,Source,Message | ConvertTo-Json`;
      const output = execSync(powershellCmd, { encoding: 'utf8', shell: 'powershell.exe' });
      const events = JSON.parse(output);
      return events.map((e: Record<string, string>) => 
        `[${e.TimeGenerated}] ${e.Source}: ${e.Message}`
      );
    } catch (error) {
      console.error('Failed to read Windows Error Logs:', error);
      return [];
    }
  }
}

/**
 * Linux/macOS Syslog Provider
 */
class UnixLogProvider implements ILogProvider {
  private logPath: string;

  constructor() {
    // Determine the appropriate log file based on OS
    if (os.platform() === 'darwin') {
      this.logPath = '/var/log/system.log';
    } else {
      this.logPath = '/var/log/syslog';
    }
  }

  async getRecentLogs(limit: number = 50): Promise<string[]> {
    try {
      if (!fs.existsSync(this.logPath)) {
        console.warn(`Log file ${this.logPath} does not exist`);
        return [];
      }
      
      const content = fs.readFileSync(this.logPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() !== '');
      return lines.slice(-limit);
    } catch (error) {
      console.error(`Failed to read ${this.logPath}:`, error);
      return [];
    }
  }

  async getErrorLogs(since?: Date): Promise<string[]> {
    try {
      if (!fs.existsSync(this.logPath)) {
        return [];
      }
      
      const content = fs.readFileSync(this.logPath, 'utf8');
      const lines = content.split('\n');
      const sinceTime = since?.getTime() || Date.now() - 24 * 60 * 60 * 1000;
      
      return lines.filter(line => {
        if (!line.toLowerCase().includes('error')) return false;
        
        // Try to extract timestamp from syslog format
        const timestampMatch = line.match(/^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/);
        if (!timestampMatch) return true; // Include if can't parse
        
        const logTime = new Date(timestampMatch[1]);
        return logTime.getTime() >= sinceTime;
      }).slice(-50);
    } catch (error) {
      console.error('Failed to read Unix error logs:', error);
      return [];
    }
  }
}

/**
 * Factory function to get the appropriate log provider for the current OS
 */
export function getLogProvider(): ILogProvider {
  const platform = os.platform();
  if (platform === 'win32') {
    return new WindowsLogProvider();
  }
  return new UnixLogProvider();
}

/**
 * Gets CPU usage percentage (cross-platform)
 */
function getCpuUsage(): number {
  const cpus = os.cpus();
  
  // Calculate average usage across all cores
  let totalIdle = 0;
  let totalTick = 0;
  
  for (const cpu of cpus) {
    const times = cpu.times;
    totalIdle += times.idle;
    totalTick += times.user + times.nice + times.sys + times.idle + times.irq;
  }
  
  const idleAvg = totalIdle / cpus.length;
  const tickAvg = totalTick / cpus.length;
  
  // This is a snapshot; for real-time monitoring, you'd compare two snapshots
  // For now, return a reasonable estimate based on current state
  return Math.round((1 - idleAvg / tickAvg) * 100 * 100) / 100;
}

/**
 * Gets disk usage for the root partition (cross-platform)
 */
function getDiskUsage(): { total: number; free: number; used: number; usagePercent: number } {
  const platform = os.platform();
  
  try {
    if (platform === 'win32') {
      // Windows: Use PowerShell to get disk info
      const output = execSync(
        'powershell -Command "Get-Volume -DriveLetter C | Select-Object Size,SizeRemaining | ConvertTo-Json"',
        { encoding: 'utf8' }
      );
      const volume = JSON.parse(output);
      const total = volume.Size;
      const free = volume.SizeRemaining;
      const used = total - free;
      return {
        total,
        free,
        used,
        usagePercent: Math.round((used / total) * 100 * 100) / 100,
      };
    } else {
      // Linux/macOS: Use df command or statfs
      const output = execSync('df -k / | tail -1', { encoding: 'utf8' });
      const parts = output.trim().split(/\s+/);
      // df output: Filesystem 1K-blocks Used Available Use% Mounted
      const total = parseInt(parts[1]) * 1024;
      const used = parseInt(parts[2]) * 1024;
      const free = parseInt(parts[3]) * 1024;
      return {
        total,
        free,
        used,
        usagePercent: parseFloat(parts[4].replace('%', '')),
      };
    }
  } catch (error) {
    console.error('Failed to get disk usage:', error);
    // Fallback values
    return { total: 0, free: 0, used: 0, usagePercent: 0 };
  }
}

/**
 * Gets comprehensive system metrics (cross-platform)
 */
export function getSystemMetrics(): SystemMetrics {
  const memInfo = os.freemem();
  const memTotal = os.totalmem();
  const diskInfo = getDiskUsage();
  const cpus = os.cpus();
  
  const networkInterfaces = os.networkInterfaces();
  const interfaces: NetworkInterfaceInfo[] = [];
  
  for (const [name, iface] of Object.entries(networkInterfaces)) {
    if (iface) {
      for (const detail of iface) {
        interfaces.push({
          name,
          type: detail.family,
          address: detail.address,
          mac: detail.mac,
          internal: detail.internal,
        });
      }
    }
  }
  
  return {
    cpu: {
      usage: getCpuUsage(),
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus.map(cpu => cpu.speed),
    },
    memory: {
      total: memTotal,
      free: memInfo,
      used: memTotal - memInfo,
      usagePercent: Math.round(((memTotal - memInfo) / memTotal) * 100 * 100) / 100,
    },
    disk: diskInfo,
    network: { interfaces },
    uptime: os.uptime(),
    platform: os.platform(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Normalizes bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
