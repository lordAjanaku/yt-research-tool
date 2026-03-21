import { ScrollArea } from '@/components/ui/scroll-area'

export function TopicValidation() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-[280px] flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-card">
          <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">Topic Validation</p>
          <p className="text-xs text-muted-foreground">5-phase validation system</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            <p className="text-muted-foreground text-xs">Phase navigator V1–V5 — coming next</p>
          </div>
        </ScrollArea>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="text-muted-foreground text-xs">Phase output and scorecard — coming next</p>
        </div>
      </ScrollArea>
    </div>
  )
}
