import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AggregatedStats, WorkerInfo } from '@/lib/types';
import { Cpu, ChartLine, Clock, CheckCircle, ArrowsClockwise } from '@phosphor-icons/react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  subtext?: string;
}

function MetricCard({ label, value, unit, icon, subtext }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono font-medium tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-muted-foreground font-mono">{unit}</span>}
      </div>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

interface TelemetryDashboardProps {
  stats: AggregatedStats;
  workers: WorkerInfo[];
  isRunning: boolean;
}

export function TelemetryDashboard({ stats, workers, isRunning }: TelemetryDashboardProps) {
  const formatHashrate = (hashrate: number): string => {
    if (hashrate === 0) return '0';
    if (hashrate >= 1000000) return (hashrate / 1000000).toFixed(2) + 'M';
    if (hashrate >= 1000) return (hashrate / 1000).toFixed(2) + 'K';
    return hashrate.toFixed(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWorkerStateColor = (state: string): string => {
    switch (state) {
      case 'running': return 'bg-accent text-accent-foreground';
      case 'idle': return 'bg-muted text-muted-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      case 'initializing': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartLine weight="bold" />
          Live Telemetry
        </CardTitle>
        <CardDescription>Real-time performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            label="Current Hashrate"
            value={formatHashrate(stats.currentHashrate)}
            unit="H/s"
            icon={<ChartLine />}
            subtext={isRunning ? 'Live measurement' : 'Stopped'}
          />
          <MetricCard
            label="Total Hashes"
            value={stats.totalHashes.toLocaleString()}
            icon={<Cpu />}
            subtext="Across all workers"
          />
          <MetricCard
            label="Elapsed Time"
            value={formatTime(stats.elapsedTime)}
            icon={<Clock />}
          />
          <MetricCard
            label="Peak Hashrate"
            value={formatHashrate(stats.peakHashrate)}
            unit="H/s"
            icon={<ChartLine />}
            subtext="Maximum observed"
          />
          <MetricCard
            label="Avg Hashrate"
            value={formatHashrate(stats.avgHashrate)}
            unit="H/s"
            icon={<ChartLine />}
            subtext="Session average"
          />
          <MetricCard
            label="Active Workers"
            value={`${stats.runningWorkers} / ${workers.length}`}
            icon={<Cpu />}
            subtext={stats.erroredWorkers > 0 ? `${stats.erroredWorkers} errors` : 'All operational'}
          />
          <MetricCard
            label="Solutions Found"
            value={(stats.totalSolutions || 0).toLocaleString()}
            icon={<CheckCircle />}
            subtext="Difficulty targets met"
          />
          <MetricCard
            label="Cache Reinits"
            value={(stats.totalCacheReinits || 0).toLocaleString()}
            icon={<ArrowsClockwise />}
            subtext="Every 2 minutes (realistic)"
          />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Worker Status
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="flex flex-col items-center gap-1 p-2 bg-muted/20 rounded border border-border/50"
              >
                <Badge className={getWorkerStateColor(worker.state)} variant="secondary">
                  #{worker.id}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  {formatHashrate(worker.lastHashrate)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {workers.length > 0 && (
          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <span className="font-medium">Backend:</span>
            <Badge variant="outline" className="font-mono">
              {workers[0].backend === 'webgpu' ? 'WebGPU (GPU)' : 'WASM (CPU)'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
