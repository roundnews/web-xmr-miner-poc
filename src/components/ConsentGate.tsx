import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WarningCircle, Info } from '@phosphor-icons/react';

export function ConsentGate({ 
  consented, 
  onConsentChange 
}: { 
  consented: boolean; 
  onConsentChange: (consented: boolean) => void;
}) {
  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WarningCircle className="text-accent" weight="fill" />
          Resource Usage Consent
        </CardTitle>
        <CardDescription>
          This is an educational demonstrator of browser-based parallel computing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>What this tool does:</strong> Runs cryptographic hash functions (SHA-256) 
            across multiple Web Workers to demonstrate browser computing capabilities and measure performance.
          </AlertDescription>
        </Alert>

        <Alert>
          <WarningCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>What you should know:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>This will use CPU resources and may drain battery on mobile devices</li>
              <li>Your device may become warm during extended benchmarks</li>
              <li>You can stop execution at any time</li>
              <li>No data is collected or sent to any server</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
          <input
            type="checkbox"
            id="consent-checkbox"
            checked={consented}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border accent-accent"
          />
          <label htmlFor="consent-checkbox" className="text-sm cursor-pointer select-none">
            I understand this will use my device's CPU resources and may impact battery life. 
            I consent to running this benchmark on my device.
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
