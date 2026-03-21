import { useLocation } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/store/useStore'

const SECTION_LABELS = {
  '/outlier': 'Outlier Research',
  '/channel': 'Channel Analysis',
  '/validation': 'Topic Validation',
  '/pattern': 'Pattern Analysis',
  '/api-keys': 'API Keys',
  '/theme': 'Theme',
}

export function TopBar() {
  const location = useLocation()
  const { entries } = useStore()
  const label = SECTION_LABELS[location.pathname] || 'YT Research Tool'

  return (
    <div className="h-12 flex items-center justify-between px-4 bg-card border-b border-border flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-head font-bold text-primary tracking-widest text-sm uppercase">YT Research</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-head text-foreground tracking-wider text-sm uppercase">{label}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
        <span>LOGGED <b className="text-primary">{entries.length}</b></span>
        <span>QUALIFIED <b className="text-primary">{entries.filter(e => e.qualifies).length}</b></span>
      </div>
    </div>
  )
}
