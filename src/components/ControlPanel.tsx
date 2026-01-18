import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Stop } from '@phosphor-icons/react';
import { BenchmarkConfig } from '@/lib/types';

interface ControlPanelProps {
  config: BenchmarkConfig;
  onConfigChange: (config: Partial<BenchmarkConfig>) => void;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
  maxThreads: number;
}

export function ControlPanel({
  config,
  onConfigChange,
  isRunning,
  onStart,
  onStop,
  disabled,
  maxThreads
}: ControlPanelProps) {
  const durationOptions = [
    { label: '15 seconds', value: 15 },
    { label: '1 minute', value: 60 },
    { label: '5 minutes', value: 300 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benchmark Controls</CardTitle>
        <CardDescription>Configure and control the performance test</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="threads-slider">Worker Threads</Label>
            <span className="text-sm font-mono text-muted-foreground">{config.threads}</span>
          </div>
          <Slider
            id="threads-slider"
            min={1}
            max={Math.min(maxThreads, 8)}
            step={1}
            value={[config.threads]}
            onValueChange={([value]) => onConfigChange({ threads: value })}
            disabled={disabled || isRunning}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Number of parallel workers (max: {Math.min(maxThreads, 8)})
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="throttle-slider">CPU Throttle</Label>
            <span className="text-sm font-mono text-muted-foreground">{config.throttle}%</span>
          </div>
          <Slider
            id="throttle-slider"
            min={0}
            max={90}
            step={5}
            value={[config.throttle]}
            onValueChange={([value]) => onConfigChange({ throttle: value })}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Lower throttle = more CPU usage. 0% = maximum performance.
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="duration-select">Duration</Label>
          <Select
            value={config.duration.toString()}
            onValueChange={(value) => onConfigChange({ duration: parseInt(value) })}
            disabled={disabled || isRunning}
          >
            <SelectTrigger id="duration-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 pt-4">
          {!isRunning ? (
            <Button
              onClick={onStart}
              disabled={disabled}
              className="flex-1"
              size="lg"
            >
              <Play className="mr-2" weight="fill" />
              Start Benchmark
            </Button>
          ) : (
            <Button
              onClick={onStop}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              <Stop className="mr-2" weight="fill" />
              Stop Benchmark
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
