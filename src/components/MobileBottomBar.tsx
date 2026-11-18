import { CalendarClock, LayoutGrid, MapPin, Tractor } from 'lucide-react';
import type { Translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/feedback';
import type { AppTab } from './TopNav';

interface MobileBottomBarProps {
  activeTab: AppTab;
  userRole: 'FARMER' | 'OWNER';
  t: Translations;
  onSelectTab: (tab: AppTab) => void;
}

export function MobileBottomBar({
  activeTab,
  userRole,
  t,
  onSelectTab,
}: MobileBottomBarProps) {
  const mobileTabs: Array<{ id: AppTab; label: string; icon: typeof LayoutGrid }> =
    userRole === 'OWNER'
      ? [
          { id: 'overview', label: t.nav.mobileHome, icon: LayoutGrid },
          { id: 'machinery', label: t.nav.mobileFleet, icon: Tractor },
          { id: 'dispatch', label: t.nav.mobileSchedule, icon: CalendarClock },
        ]
      : [
          { id: 'overview', label: t.nav.mobileHome, icon: LayoutGrid },
          { id: 'machinery', label: t.nav.mobileFleet, icon: Tractor },
          { id: 'plots', label: t.nav.mobilePlots, icon: MapPin },
          { id: 'dispatch', label: t.nav.mobileSchedule, icon: CalendarClock },
        ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 grid h-16 ${
        userRole === 'OWNER' ? 'grid-cols-3' : 'grid-cols-4'
      } border-t border-stone-300 bg-white/95 backdrop-blur-md md:hidden dark:border-white/10 dark:bg-slate-950/90`}
    >
      {mobileTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              triggerHaptic(12);
              onSelectTab(tab.id);
            }}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
              isActive
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-stone-600 dark:text-slate-400'
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
