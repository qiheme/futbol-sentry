import LogoMark from '@q-labs/cobalt/LogoMark';
import NavItem from '@q-labs/cobalt/NavItem';
import TopNav from '@q-labs/cobalt/TopNav';

export type NavSection = 'home' | 'competitions';

// Rendered statically inside .astro layouts (no client directive → zero JS).
export default function SiteNav({ current }: { current?: NavSection }) {
  return (
    <TopNav
      logo={
        <a href="/" className="site-logo" aria-label="PitchGlobe home">
          <LogoMark name="ring" size={22} />
          <span>PitchGlobe</span>
        </a>
      }
    >
      <a href="/">
        <NavItem label="Home" active={current === 'home'} />
      </a>
      <a href="/competitions">
        <NavItem label="Competitions" active={current === 'competitions'} />
      </a>
    </TopNav>
  );
}
