import { useStore } from '@/store/useStore'
import { ScrollArea } from '@/components/ui/scroll-area'

const THEMES = [
  {
    value: 'theme-amber',
    label: 'Dark Amber',
    description: 'Default dark theme with amber accent',
    group: 'Dark',
    preview: { bg: '#060608', card: '#0c0e12', accent: '#C8960C', text: '#C8C8B8' },
  },
  {
    value: 'theme-blue',
    label: 'Dark Blue',
    description: 'Dark theme with electric blue accent',
    group: 'Dark',
    preview: { bg: '#060810', card: '#0c0f1a', accent: '#2980B9', text: '#C0C8D8' },
  },
  {
    value: 'theme-green',
    label: 'Terminal Green',
    description: 'Classic terminal aesthetic',
    group: 'Dark',
    preview: { bg: '#060A06', card: '#0a0f0a', accent: '#27AE60', text: '#B8C8B8' },
  },
  {
    value: 'theme-purple',
    label: 'Midnight Purple',
    description: 'Deep dark with violet accent',
    group: 'Dark',
    preview: { bg: '#08060A', card: '#100c14', accent: '#8E44AD', text: '#C4B8D0' },
  },
  {
    value: 'theme-red',
    label: 'Crimson',
    description: 'Dark theme with crimson red accent',
    group: 'Dark',
    preview: { bg: '#0A0606', card: '#110c0c', accent: '#C0392B', text: '#C8B8B8' },
  },
  {
    value: 'theme-cyan',
    label: 'Ocean Cyan',
    description: 'Dark theme with deep teal accent',
    group: 'Dark',
    preview: { bg: '#050A0B', card: '#0a1012', accent: '#17A589', text: '#B8CDCC' },
  },
  {
    value: 'theme-orange',
    label: 'Ember',
    description: 'Dark theme with burning orange accent',
    group: 'Dark',
    preview: { bg: '#0A0704', card: '#110e09', accent: '#D35400', text: '#C8C0B0' },
  },
  {
    value: 'theme-rose',
    label: 'Rose Gold',
    description: 'Dark theme with dusty rose accent',
    group: 'Dark',
    preview: { bg: '#0A0608', card: '#110c0f', accent: '#C0627A', text: '#CCBCC2' },
  },
  {
    value: 'theme-light',
    label: 'Light Amber',
    description: 'Clean light theme with amber accent',
    group: 'Light',
    preview: { bg: '#F5F4F0', card: '#FFFFFF', accent: '#B8860B', text: '#2A2A22' },
  },
  {
    value: 'theme-light-blue',
    label: 'Light Blue',
    description: 'Clean light theme with blue accent',
    group: 'Light',
    preview: { bg: '#F0F4F8', card: '#FFFFFF', accent: '#1A6BA0', text: '#1A2530' },
  },
]

const GROUPS = ['Dark', 'Light']

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

          <div>
            <p className="font-head font-bold text-sm tracking-widest uppercase text-primary">Theme</p>
            <p className="text-xs text-muted-foreground mt-1">Choose the visual style for the tool. Your preference is saved automatically.</p>
          </div>

          {GROUPS.map(group => (
            <div key={group} className="flex flex-col gap-3">
              <p className="font-head font-semibold text-[10px] tracking-widest uppercase text-muted-foreground">{group}</p>
              {THEMES.filter(t => t.group === group).map(t => {
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
                    {/* COLOUR SWATCH */}
                    <div className="flex-shrink-0 flex flex-col gap-1">
                      <div className="flex gap-1">
                        <div className="w-8 h-8 border border-white/10" style={{ background: t.preview.bg }} />
                        <div className="w-8 h-8 border border-white/10" style={{ background: t.preview.card }} />
                      </div>
                      <div className="flex gap-1">
                        <div className="w-8 h-8 border border-white/10" style={{ background: t.preview.accent }} />
                        <div className="w-8 h-8 border border-white/10" style={{ background: t.preview.text }} />
                      </div>
                    </div>

                    {/* LABEL */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-head font-semibold text-sm tracking-wider ${
                        active ? 'text-primary' : 'text-foreground'
                      }`}>{t.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                    </div>

                    {/* ACTIVE DOT */}
                    <div className={`flex-shrink-0 w-4 h-4 border-2 rounded-full ${
                      active ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`} />
                  </button>
                )
              })}
            </div>
          ))}

        </div>
      </ScrollArea>
    </div>
  )
}
