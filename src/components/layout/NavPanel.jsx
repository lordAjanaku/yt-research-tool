import { useNavigate, useLocation } from 'react-router-dom'
import {
  Search, Radio, CheckSquare, BarChart2,
  Key, Palette, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { path: '/outlier', label: 'Outlier Research', icon: Search },
  { path: '/channel', label: 'Channel Analysis', icon: Radio },
  { path: '/validation', label: 'Topic Validation', icon: CheckSquare },
  { path: '/pattern', label: 'Pattern Analysis', icon: BarChart2 },
]

const BOTTOM_ITEMS = [
  { path: '/api-keys', label: 'API Keys', icon: Key },
  { path: '/theme', label: 'Theme', icon: Palette },
]

export function NavPanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const { navExpanded, setNavExpanded } = useStore()

  const width = navExpanded ? 'w-[220px]' : 'w-[52px]'

  function NavItem({ item }) {
    const active = location.pathname === item.path
    const Icon = item.icon
    const btn = (
      <button
        onClick={() => navigate(item.path)}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2 text-xs font-head font-semibold tracking-wider uppercase transition-colors',
          active
            ? 'bg-primary/10 text-primary border-l-2 border-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        <Icon size={15} className="flex-shrink-0" />
        {navExpanded && <span className="truncate">{item.label}</span>}
      </button>
    )
    if (!navExpanded) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>{btn}</TooltipTrigger>
            <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return btn
  }

  return (
    <div className={cn('flex flex-col h-full bg-card border-r border-border transition-all duration-200 flex-shrink-0', width)}>

      {/* MAIN NAV */}
      <div className="flex flex-col gap-0.5 p-1.5 flex-1 pt-2">
        {NAV_ITEMS.map(item => <NavItem key={item.path} item={item} />)}
      </div>

      {/* BOTTOM — Settings + Toggle */}
      <div className="flex flex-col gap-0.5 p-1.5 border-t border-border">
        {BOTTOM_ITEMS.map(item => <NavItem key={item.path} item={item} />)}
        <Separator className="my-1" />
        <button
          onClick={() => setNavExpanded(!navExpanded)}
          className="flex items-center justify-center w-full p-2 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          title={navExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {navExpanded
            ? <PanelLeftClose size={15} />
            : <PanelLeftOpen size={15} />
          }
        </button>
      </div>
    </div>
  )
}
