import * as React from 'react';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';
import { LANDING_SLIDES } from '../lib/slides';
import { useLandingMotion } from '../hooks/useLandingMotion';
import { Check } from 'lucide-react';

export const FeatureCarousel: React.FC = () => {
  const { language } = useLanguageStore();
  const { paused } = useLandingMotion();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [userInteracted, setUserInteracted] = React.useState(false);

  const totalSlides = LANDING_SLIDES.length;

  React.useEffect(() => {
    if (paused || isHovered || isFocused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4500);

    return () => clearInterval(timer);
  }, [paused, isHovered, isFocused, totalSlides]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setUserInteracted(true);
    if (e.key === 'ArrowRight') {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    } else if (e.key === 'ArrowLeft') {
      setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Features Carousel"
      aria-live={userInteracted ? 'polite' : 'off'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[20px] animate-item-rise delay-carousel select-none"
      style={{
        marginLeft: 'clamp(24px, 6vw, 120px)',
        width: 'clamp(440px, 38vw, 600px)',
        animationFillMode: 'forwards',
      }}
    >
      <div className="relative min-h-[clamp(360px,54vh,500px)] h-auto w-full">
        {LANDING_SLIDES.map((slide, idx) => {
          const offset = (idx - currentIndex + totalSlides) % totalSlides;

          if (offset > 2) return null;

          let transformStyle = '';
          let opacityStyle = 'opacity-0 pointer-events-none';
          let zIndex = 3 - offset;

          if (offset === 0) {
            transformStyle = 'translate-y-0 scale-100';
            opacityStyle = 'opacity-100 z-30';
          } else if (offset === 1) {
            transformStyle = 'translate-y-[14px] scale-[0.96]';
            opacityStyle = 'opacity-70 z-20';
          } else if (offset === 2) {
            transformStyle = 'translate-y-[28px] scale-[0.92]';
            opacityStyle = 'opacity-40 z-10';
          }

          const isFront = offset === 0;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 bg-white/74 dark:bg-surface/85 backdrop-blur-[16px] border border-border/85 rounded-[20px] shadow-2xl flex flex-col justify-between transition-all duration-450 ease-out ${transformStyle} ${opacityStyle}`}
              style={{
                zIndex,
                padding: 'clamp(24px, 4vh, 40px)',
                minHeight: 'clamp(360px, 54vh, 500px)',
                height: 'auto',
              }}
            >
              {isFront ? (
                <div className="flex flex-col h-full justify-between">
                  <div className="flex items-center justify-between">
                    <div
                      className="hex-clip bg-primary/15 flex items-center justify-center text-primary shrink-0 shadow-sm"
                      style={{ width: 'clamp(48px, 5.5vh, 56px)', height: 'clamp(48px, 5.5vh, 56px)' }}
                    >
                      {slide.icon}
                    </div>
                    {slide.soon && (
                      <span className="px-3 py-1 rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-500 text-xs font-semibold uppercase tracking-wider">
                        {t('landing.badge.soon', language)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col" style={{ gap: '12px', marginTop: '18px', marginBottom: '18px' }}>
                    <h2
                      className="font-sora font-bold text-foreground tracking-tight"
                      style={{ fontSize: 'clamp(24px, 2.2vw, 32px)' }}
                    >
                      {t(slide.titleKey, language)}
                    </h2>
                    <p
                      className="text-muted-foreground leading-[1.55] line-clamp-4"
                      style={{ fontSize: 'clamp(15px, 1.2vw, 17px)' }}
                    >
                      {t(slide.messageKey, language)}
                    </p>
                  </div>

                  <div className="flex flex-col" style={{ gap: '10px', marginBottom: 'auto' }}>
                    {[slide.p1Key, slide.p2Key, slide.p3Key].map((pKey, pIdx) => (
                      <div key={pIdx} className="flex items-center space-x-2.5 text-sm text-foreground/90">
                        <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center text-green-600 shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span>{t(pKey, language)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs font-mono text-muted-foreground" style={{ marginTop: '24px' }}>
                    <span>0{idx + 1} / 0{totalSlides}</span>
                    {slide.soon ? (
                      <span className="px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-500 font-semibold uppercase text-[10px]">
                        {t('landing.badge.soon', language)}
                      </span>
                    ) : <span />}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          );
        })}
      </div>

      <div
        role="tablist"
        aria-label="Carousel slides"
        className="flex items-center justify-center space-x-2 pt-6"
      >
        {LANDING_SLIDES.map((_, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              role="tab"
              aria-selected={isActive}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => {
                setUserInteracted(true);
                setCurrentIndex(idx);
              }}
              className={`transition-all duration-300 rounded-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'w-6 h-2 bg-[#F97316]'
                  : 'w-2 h-2 bg-border hover:bg-muted-foreground/50'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
