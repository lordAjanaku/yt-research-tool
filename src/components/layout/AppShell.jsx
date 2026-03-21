import { NavPanel } from './NavPanel'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStore } from '@/store/useStore'

export function AppShell({ children }) {
  const { navExpanded } = useStore()

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <NavPanel />
        <div
          className="flex flex-1 overflow-hidden"
          style={{ marginLeft: 0 }}
        >
          {children}
        </div>
      </div>
      <StatusBar />
    </div>
  )
}
