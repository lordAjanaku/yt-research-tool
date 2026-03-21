import { useStore } from '@/store/useStore'
import { ScrollArea } from '@/components/ui/scroll-area'

const THEMES = [
  {
    value: 'theme-amber',
    label: 'Dark Amber',
    description: 'Default dark theme with amber accent',
    preview: { bg: '#060608', card: '#0c0e12', accent: '#C8960C', text: '#C8C8B8' },
  },
  {
    value: 'theme-blue',
    label: 'Dark Blue',
    description: 'Dark theme with blue accent',
    preview: { bg: '#060810', card: '#0c0f1a', accent: '#2980B9', text: '#C0C8D8' },
  },
  {
    value: 'theme-green',
    label: 'Terminal Green',
    description: 'Dark theme with green accent',
    preview: { bg: '#060A06', card: '#0a0f0a', accent: '#27AE60', text: '#B8C8B8' },
  },
  {
    value: 'theme-purple',
    label: 'Midnight Purple',
    description: 'Dark theme with purple accent',
    preview: { bg: '#08060A', card: '#100c14', accent: '#8E44AD', text: '#C4B8D0' },
  },
  {
    value: 'theme-light',
    label: 'Light',
    description: 'Light theme for bright environments',
    preview: { bg: '#F5F4F0', card: '#FFFFFF', accent: '#B8860B', text: '#2A2A22' },
  },
]

export function ThemeChanger() {
  const { theme, setTheme } = useStore()

  function handleTheme(value) {
    setTheme(value)
    document.documentElement.className = value
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">

          {/* PAGE TITLE */}
          <div>
            <p className="font-head font-bold text-sm tracking-widest uppercase text-primary">Theme</p>
            <p className="text-xs text-muted-foreground mt-1">Choose the visual style for the tool. Your preference is saved automatically.</p>
          </div>

          {/* THEME CARDS */}
          <div className="flex flex-col gap-3">
            {THEMES.map(t => {
              const active = theme === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => handleTheme(t.value)}
                  className={`flex items-center gap-4 border p-4 text-left transition-all ${
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  {/* COLOUR PREVIEW SWATCH */}
                  <div className="flex-shrink-0 flex flex-col gap-1">
                    <div className="flex gap-1">
                      <div className="w-8 h-8 border border-border/40 flex-shrink-0" style={{ background: t.preview.bg }} />
                      <div className="w-8 h-8 border border-border/40 flex-shrink-0" style={{ background: t.preview.card }} />
                    </div>
                    <div className="flex gap-1">
                      <div className="w-8 h-8 border border-border/40 flex-shrink-0" style={{ background: t.preview.accent }} />
                      <div className="w-8 h-8 border border-border/40 flex-shrink-0" style={{ background: t.preview.text }} />
                    </div>
                  </div>

                  {/* LABEL */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-head font-semibold text-sm tracking-wider ${
                      active ? 'text-primary' : 'text-foreground'
                    }`}>{t.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                  </div>

                  {/* ACTIVE INDICATOR */}
                  <div className={`flex-shrink-0 w-4 h-4 border-2 rounded-full ${
                    active ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`} />
                </button>
              )
            })}
          </div>

        </div>
      </ScrollArea>
    </div>
  )
}
