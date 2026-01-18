import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadSimple } from '@phosphor-icons/react';
import { BenchmarkReport } from '@/lib/types';

interface ReportExportProps {
  report: BenchmarkReport | null;
  onExport: () => void;
  disabled: boolean;
}

export function ReportExport({ report, onExport, disabled }: ReportExportProps) {
  if (!report) return null;

  const formatHashrate = (hashrate: number): string => {
    if (hashrate >= 1000000) return (hashrate / 1000000).toFixed(2) + 'M H/s';
    if (hashrate >= 1000) return (hashrate / 1000).toFixed(2) + 'K H/s';
    return hashrate.toFixed(0) + ' H/s';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benchmark Results</CardTitle>
        <CardDescription>Export your performance data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total Hashes</p>
            <p className="text-xl font-mono font-medium">{report.stats.totalHashes.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Peak Hashrate</p>
            <p className="text-xl font-mono font-medium">{formatHashrate(report.stats.peakHashrate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Hashrate</p>
            <p className="text-xl font-mono font-medium">{formatHashrate(report.stats.avgHashrate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="text-xl font-mono font-medium">{report.stats.elapsedTime.toFixed(1)}s</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Configuration</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Workers: {report.config.threads}</p>
            <p>Throttle: {report.config.throttle}%</p>
            <p>Browser: {report.deviceInfo.userAgent.split(' ').slice(-2).join(' ')}</p>
            <p>CPU Cores: {report.deviceInfo.hardwareConcurrency}</p>
          </div>
        </div>

        <Button onClick={onExport} disabled={disabled} className="w-full">
          <DownloadSimple className="mr-2" weight="bold" />
          Export JSON Report
        </Button>
      </CardContent>
    </Card>
  );
}
