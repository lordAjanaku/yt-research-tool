import { ScrollArea } from '@/components/ui/scroll-area'

export function PatternAnalysis() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-[280px] flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-card">
          <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">Pattern Analysis</p>
          <p className="text-xs text-muted-foreground">Upload outlier data for AI analysis</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            <p className="text-muted-foreground text-xs">CSV upload and AI provider status — coming next</p>
          </div>
        </ScrollArea>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="text-muted-foreground text-xs">Pattern charts and statement — coming next</p>
        </div>
      </ScrollArea>
    </div>
  )
}
