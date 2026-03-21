import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function OutlierResearch() {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-[280px] flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-card">
          <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">Data Entry</p>
          <p className="text-xs text-muted-foreground">Fetch or enter manually</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            <p className="text-muted-foreground text-xs">Fetch box and form fields — coming next</p>
          </div>
        </ScrollArea>
      </div>
      {/* RIGHT PANEL */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="text-muted-foreground text-xs">Research table — coming next</p>
        </div>
      </ScrollArea>
    </div>
  )
}
