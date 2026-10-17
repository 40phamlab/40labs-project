import * as React from 'react';
import { ArrowRight, Cpu, LogIn, ChevronRight } from 'lucide-react';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';

interface ActionPanelProps {
  onGetStarted: () => void;
  onNewDevice?: () => void;
  onSignIn?: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  onGetStarted,
  onNewDevice = () => console.log('TODO: [reason: auth redesign pending] [phase: auth-1A] New device'),
  onSignIn = () => console.log('TODO: [reason: auth redesign pending] [phase: auth-1A] Sign in'),
}) => {
  const { language } = useLanguageStore();
  const [isCompact, setIsCompact] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkHeight = () => {
      setIsCompact(window.innerHeight < 700);
    };
    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) / (rect.width / 2);
      const dy = (e.clientY - centerY) / (rect.height / 2);
      const tiltX = Math.max(-3, Math.min(3, -dy * 3));
      const tiltY = Math.max(-3, Math.min(3, dx * 3));
      setTilt({ x: tiltX, y: tiltY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={panelRef}
      className={`fixed bg-surface/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl space-y-4 select-none z-20 animate-item-rise delay-panel ${
        isCompact ? 'p-4' : 'p-6'
      }`}
      style={{
        right: 'clamp(32px, 5vw, 96px)',
        bottom: 'clamp(24px, 8vh, 88px)',
        width: 'clamp(340px, 28vw, 420px)',
        maxHeight: 'calc(100% - 100px)',
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 100ms ease-out',
        animationFillMode: 'forwards',
      }}
    >
      <div className="space-y-3">
        {/* Primary CTA: Anza / Get Started */}
        <button
          type="button"
          onClick={onGetStarted}
          className={`group w-full px-5 bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#166534] text-white font-semibold rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus:outline-none flex items-center justify-between whitespace-nowrap cursor-pointer ${
            isCompact ? 'min-h-[44px] py-2.5' : 'min-h-[52px] py-3.5'
          }`}
        >
          <span className="text-sm lg:text-base font-sora tracking-tight">{t('landing.cta.start', language)}</span>
          <ArrowRight size={18} className="ml-2 group-hover:translate-x-1.5 transition-transform shrink-0" />
        </button>

        {/* Secondary CTA: Kifaa Kipya / New Device */}
        <button
          type="button"
          onClick={onNewDevice}
          className={`group w-full px-5 bg-gradient-to-r from-amber-600 to-[#F97316] hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus:outline-none flex items-center justify-between whitespace-nowrap cursor-pointer ${
            isCompact ? 'min-h-[44px] py-2.5' : 'min-h-[52px] py-3.5'
          }`}
        >
          <span className="text-sm lg:text-base font-sora tracking-tight">{t('landing.cta.newDevice', language)}</span>
          <Cpu size={18} className="ml-2 group-hover:rotate-12 transition-transform shrink-0" />
        </button>
      </div>

      <div className={`relative flex items-center ${isCompact ? 'my-2' : 'my-4'}`}>
        <div className="flex-grow border-t border-border/60" />
        <span className="flex-shrink mx-3 text-xs font-medium text-amber-500 uppercase tracking-wider">
          {t('landing.cta.haveAccount', language)}
        </span>
        <div className="flex-grow border-t border-border/60" />
      </div>

      {/* Sign In CTA */}
      <button
        type="button"
        onClick={onSignIn}
        className={`group w-full px-5 bg-surface hover:bg-surface-hover border border-border text-foreground font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus:outline-none flex items-center justify-between whitespace-nowrap cursor-pointer ${
          isCompact ? 'min-h-[44px] py-2.5' : 'min-h-[52px] py-3.5'
        }`}
      >
        <div className="flex items-center space-x-2">
          <LogIn size={16} className="text-muted-foreground" />
          <span className="text-sm lg:text-base font-sora tracking-tight">{t('landing.cta.signIn', language)}</span>
        </div>
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
          <ChevronRight size={14} />
        </div>
      </button>
    </div>
  );
};
