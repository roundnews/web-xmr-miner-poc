import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, CaretDown } from '@phosphor-icons/react';
import { useState } from 'react';

export function EducationalPanel() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = [
    {
      id: 'what-is-this',
      title: 'What is this tool?',
      content: (
        <>
          <p>This is an educational demonstrator that shows how browsers can perform parallel computing using Web Workers and cryptographic functions.</p>
          <p className="mt-2">It measures your browser's ability to compute SHA-256 hashes across multiple threads, providing real-time performance metrics.</p>
        </>
      )
    },
    {
      id: 'how-it-works',
      title: 'How does it work?',
      content: (
        <>
          <p><strong>Web Workers:</strong> Each worker thread runs independently, computing hashes in parallel without blocking the main UI.</p>
          <p className="mt-2"><strong>SHA-256:</strong> A standard cryptographic hash function that takes arbitrary input and produces a fixed 256-bit output.</p>
          <p className="mt-2"><strong>Throttling:</strong> Workers alternate between work and sleep cycles to control CPU usage and prevent overheating.</p>
        </>
      )
    },
    {
      id: 'browser-constraints',
      title: 'Browser limitations',
      content: (
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Background throttling:</strong> Hidden tabs may run slower to save power</li>
          <li><strong>Memory limits:</strong> Browsers restrict memory allocation to prevent crashes</li>
          <li><strong>No direct hardware access:</strong> Cannot measure actual temperature or detailed CPU metrics</li>
          <li><strong>Variable performance:</strong> Results depend on device, battery state, and thermal conditions</li>
        </ul>
      )
    },
    {
      id: 'safety-tips',
      title: 'Safety & best practices',
      content: (
        <ul className="list-disc list-inside space-y-2">
          <li>Start with low thread counts and short durations to test your device</li>
          <li>Watch for excessive heat and reduce throttle if needed</li>
          <li>Avoid long benchmarks on battery power</li>
          <li>Stop immediately if your device becomes uncomfortably warm</li>
          <li>Close other applications to get more accurate results</li>
        </ul>
      )
    },
    {
      id: 'use-cases',
      title: 'Educational use cases',
      content: (
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Performance testing:</strong> Compare browser and device capabilities</li>
          <li><strong>Learning parallel computing:</strong> Understand worker thread coordination</li>
          <li><strong>Benchmarking:</strong> Create reproducible performance reports</li>
          <li><strong>Understanding browser constraints:</strong> See real-world limitations in action</li>
        </ul>
      )
    }
  ];

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info weight="fill" className="text-accent" />
          Educational Information
        </CardTitle>
        <CardDescription>
          Learn about browser-based parallel computing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sections.map((section) => (
          <Collapsible
            key={section.id}
            open={openSections[section.id]}
            onOpenChange={() => toggleSection(section.id)}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="font-medium text-sm">{section.title}</span>
              <CaretDown
                className={`transition-transform ${openSections[section.id] ? 'rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 py-3 text-sm text-muted-foreground">
              {section.content}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}
