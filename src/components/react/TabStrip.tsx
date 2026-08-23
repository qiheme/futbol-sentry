import { useRef, useState, type ReactNode } from 'react';

export interface TabDef {
  id: string;
  label: string;
}

// Cobalt has no Tabs component — accessible tab strip styled with Cobalt
// tokens. Hydrated island; panel content arrives as named Astro slots
// (slot="<tab id>" → props[<tab id>]). Tab ids must not collide with the
// reserved props ('tabs', 'label').
interface TabStripProps {
  tabs: TabDef[];
  label?: string;
  [slot: string]: ReactNode | TabDef[] | string | undefined;
}

export default function TabStrip({
  tabs,
  label = 'Sections',
  ...panels
}: TabStripProps) {
  const [active, setActive] = useState(tabs[0]?.id);
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const focusTab = (index: number) => {
    const tab = tabs[(index + tabs.length) % tabs.length];
    if (!tab) return;
    setActive(tab.id);
    refs.current.get(tab.id)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        focusTab(index + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusTab(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusTab(0);
        break;
      case 'End':
        e.preventDefault();
        focusTab(tabs.length - 1);
        break;
    }
  };

  return (
    <div className="tab-strip">
      <div role="tablist" aria-label={label}>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) refs.current.set(tab.id, el);
            }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
        >
          {panels[tab.id] as ReactNode}
        </div>
      ))}
    </div>
  );
}
