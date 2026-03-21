import { useStore } from '@/store/useStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const THEMES = [
  { id: 'theme-amber', label: 'Dark Amber', description: 'Default — amber accent on near-black' },
  { id: 'theme-blue', label: 'Dark Blue', description: 'Slate — blue accent on dark navy' },
  { id: 'theme-green', label: 'Dark Green', description: 'Terminal — green accent on dark green-black' },
  { id: 'theme-purple', label: 'Dark Purple', description: 'Midnight — purple accent on dark purple-black' },
  { id: 'theme-light', label: 'Light', description: 'Warm white with amber accent' },
]

export function ThemeChanger() {
  const { theme, setTheme } = useStore()

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-[280px] flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-card">
          <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">Theme</p>
          <p className="text-xs text-muted-foreground">Select colour scheme</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 flex flex-col gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  'flex flex-col items-start gap-1 w-full p-3 border rounded-sm text-left transition-colors',
                  theme === t.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                )}
              >
                <span className={cn('font-head font-semibold text-xs tracking-wider uppercase', theme === t.id ? 'text-primary' : 'text-foreground')}>{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6">
          <p className="font-head text-xs tracking-widest uppercase text-muted-foreground mb-4">Current Theme</p>
          <p className="text-primary font-head font-bold text-lg tracking-widest uppercase">{THEMES.find(t => t.id === theme)?.label}</p>
          <p className="text-muted-foreground text-xs mt-1">{THEMES.find(t => t.id === theme)?.description}</p>
          <div className="mt-6 flex flex-col gap-2">
            <div className="h-8 rounded-sm bg-primary flex items-center px-3"><span className="text-primary-foreground text-xs font-mono">Primary</span></div>
            <div className="h-8 rounded-sm bg-muted flex items-center px-3"><span className="text-muted-foreground text-xs font-mono">Muted</span></div>
            <div className="h-8 rounded-sm bg-card border border-border flex items-center px-3"><span className="text-foreground text-xs font-mono">Card / Border</span></div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
