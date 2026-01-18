import { useState, useEffect, useRef } from 'react';
import { ConsentGate } from '@/components/ConsentGate';
import { ControlPanel } from '@/components/ControlPanel';
import { TelemetryDashboard } from '@/components/TelemetryDashboard';
import { ReportExport } from '@/components/ReportExport';
import { EducationalPanel } from '@/components/EducationalPanel';
import { WorkerCoordinator } from '@/lib/coordinator';
import { BenchmarkConfig, AggregatedStats, BenchmarkReport, WorkerInfo } from '@/lib/types';
import { toast } from 'sonner';

function App() {
  const [consented, setConsented] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<BenchmarkConfig>({
    threads: 1,
    throttle: 30,
    duration: 60,
    statsInterval: 1000
  });
  const [stats, setStats] = useState<AggregatedStats>({
    totalHashes: 0,
    currentHashrate: 0,
    peakHashrate: 0,
    avgHashrate: 0,
    runningWorkers: 0,
    erroredWorkers: 0,
    elapsedTime: 0
  });
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [report, setReport] = useState<BenchmarkReport | null>(null);

  const coordinatorRef = useRef<WorkerCoordinator | null>(null);
  const maxThreads = navigator.hardwareConcurrency || 4;

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        toast.warning('Tab hidden - benchmark may be throttled by browser');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning]);

  const handleConfigChange = (newConfig: Partial<BenchmarkConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    if (coordinatorRef.current && newConfig.throttle !== undefined) {
      coordinatorRef.current.updateThrottle(newConfig.throttle);
    }
  };

  const handleStart = async () => {
    try {
      toast.info('Initializing workers...');
      
      const coordinator = new WorkerCoordinator(config);
      coordinatorRef.current = coordinator;

      coordinator.setStatsCallback((newStats) => {
        setStats(newStats);
        setWorkers(coordinator.getWorkerInfo());
      });

      coordinator.setCompleteCallback(() => {
        handleStop();
        toast.success('Benchmark completed!');
      });

      await coordinator.initialize();
      
      const initialWorkers = coordinator.getWorkerInfo();
      const errorCount = initialWorkers.filter(w => w.state === 'error').length;
      
      if (errorCount === initialWorkers.length) {
        toast.error('Failed to initialize workers. Check browser compatibility.');
        coordinator.terminate();
        coordinatorRef.current = null;
        return;
      }

      if (errorCount > 0) {
        toast.warning(`${errorCount} worker(s) failed to initialize`);
      }

      setWorkers(initialWorkers);
      coordinator.start();
      setIsRunning(true);
      toast.success('Benchmark started!');
    } catch (error) {
      toast.error('Failed to start benchmark: ' + (error instanceof Error ? error.message : 'Unknown error'));
      if (coordinatorRef.current) {
        coordinatorRef.current.terminate();
        coordinatorRef.current = null;
      }
    }
  };

  const handleStop = () => {
    if (coordinatorRef.current) {
      coordinatorRef.current.stop();
      
      const finalStats = coordinatorRef.current.getAggregatedStats();
      const finalWorkers = coordinatorRef.current.getWorkerInfo();
      const timeSeriesData = coordinatorRef.current.getTimeSeriesData();
      const finalConfig = coordinatorRef.current.getConfig();

      const benchmarkReport: BenchmarkReport = {
        timestamp: new Date().toISOString(),
        config: finalConfig,
        deviceInfo: {
          userAgent: navigator.userAgent,
          hardwareConcurrency: navigator.hardwareConcurrency,
          memory: (navigator as any).deviceMemory
        },
        stats: finalStats,
        timeSeriesData,
        workerData: finalWorkers.map(w => ({
          workerId: w.id,
          totalHashes: w.totalHashes,
          finalState: w.state,
          error: w.error
        }))
      };

      setReport(benchmarkReport);
      
      setTimeout(() => {
        coordinatorRef.current?.terminate();
        coordinatorRef.current = null;
      }, 500);
    }
    setIsRunning(false);
  };

  const handleExport = () => {
    if (!report) return;

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `benchmark-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded!');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center space-y-2 py-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Web XMR miner POC
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Educational WebAssembly + Web Workers benchmark measuring parallel computing capabilities
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ConsentGate consented={consented} onConsentChange={setConsented} />
            
            <ControlPanel
              config={config}
              onConfigChange={handleConfigChange}
              isRunning={isRunning}
              onStart={handleStart}
              onStop={handleStop}
              disabled={!consented}
              maxThreads={maxThreads}
            />

            <TelemetryDashboard
              stats={stats}
              workers={workers}
              isRunning={isRunning}
            />

            {report && (
              <ReportExport
                report={report}
                onExport={handleExport}
                disabled={false}
              />
            )}
          </div>

          <div className="space-y-6">
            <EducationalPanel />
          </div>
        </div>

        <footer className="text-center text-sm text-muted-foreground py-8 border-t">
          <p>Educational demonstrator • No data collection • Open source</p>
        </footer>
      </div>
    </div>
  );
}

export default App;