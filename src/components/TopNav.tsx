import { CalendarClock, LayoutGrid, MapPin, Plus, Tractor } from 'lucide-react';
import type { Translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/feedback';

export type AppTab = 'overview' | 'machinery' | 'plots' | 'dispatch';

interface TopNavProps {
  activeTab: AppTab;
  userRole: 'FARMER' | 'OWNER';
  t: Translations;
  onSelectTab: (tab: AppTab) => void;
  onPrimaryAction: () => void;
}

export function TopNav({
  activeTab,
  userRole,
  t,
  onSelectTab,
  onPrimaryAction,
}: TopNavProps) {
  const navItems: Array<{ id: AppTab; label: string; icon: typeof LayoutGrid }> =
    userRole === 'OWNER'
      ? [
          { id: 'overview', label: t.nav.overview, icon: LayoutGrid },
          { id: 'machinery', label: t.nav.machinery, icon: Tractor },
          { id: 'dispatch', label: t.nav.dispatch, icon: CalendarClock },
        ]
      : [
          { id: 'overview', label: t.nav.overview, icon: LayoutGrid },
          { id: 'machinery', label: t.nav.machinery, icon: Tractor },
          { id: 'plots', label: t.nav.plots, icon: MapPin },
          { id: 'dispatch', label: t.nav.myBookings, icon: CalendarClock },
        ];

  const primaryCtaLabel =
    userRole === 'OWNER' ? t.nav.addEquipment : t.nav.bookMachine;

  return (
    <header className="sticky top-0 z-30 border-b border-stone-300 bg-white/95 backdrop-blur-md transition-colors dark:border-white/10 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            triggerHaptic(10);
            onSelectTab('overview');
          }}
          className="font-display text-xl font-extrabold tracking-tight text-stone-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 dark:text-white"
        >
          {t.brand}
        </a>

        {/* Zone 2: Role-scoped single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onSelectTab(item.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-[48px] items-center gap-2 border-b-2 px-1 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 ${
                  isActive
                    ? 'border-emerald-700 text-emerald-800 dark:border-emerald-400 dark:text-emerald-300'
                    : 'border-transparent text-stone-700 hover:text-stone-950 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 role-specific primary CTA */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(16);
              onPrimaryAction();
            }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{primaryCtaLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
