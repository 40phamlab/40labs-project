import * as React from 'react';
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { t } from '@40labs/i18n';
import { LANDING_SLIDES } from '../lib/slides';
import { useLandingMotion } from '../hooks/useLandingMotion';

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
      className="relative w-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[20px] animate-item-rise delay-carousel"
      style={{
        marginLeft: 'clamp(24px, 6vw, 120px)',
        width: 'clamp(380px, 38vw, 580px)',
        animationFillMode: 'forwards',
      }}
    >
      <div className="relative min-h-[clamp(190px,28vh,270px)] h-auto w-full">
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
            transformStyle = 'translate-y-3 scale-[0.94]';
            opacityStyle = 'opacity-70 z-20';
          } else if (offset === 2) {
            transformStyle = 'translate-y-6 scale-[0.88]';
            opacityStyle = 'opacity-40 z-10';
          }

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 bg-surface/85 backdrop-blur-[16px] border border-border/80 rounded-[20px] shadow-xl p-6 lg:p-7 flex flex-col justify-between transition-all duration-450 ease-out select-none min-h-[clamp(190px,28vh,270px)] ${transformStyle} ${opacityStyle}`}
              style={{
                /* Note: 20px radius is intentionally used on this hero FeatureCarousel card (deviating from standard 12px token) for dramatic visual polish */
                zIndex,
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="hex-clip w-12 h-12 bg-primary/15 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  {slide.icon}
                </div>
                <h3 className="font-sora font-bold text-lg lg:text-xl text-foreground tracking-tight">
                  {t(slide.titleKey, language)}
                </h3>
              </div>

              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed py-2">
                {t(slide.descKey, language)}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs font-mono text-muted-foreground mt-auto">
                <span>0{idx + 1} / 0{totalSlides}</span>
                <span className="text-primary font-semibold">40Labs Core</span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        role="tablist"
        aria-label="Carousel slides"
        className="flex items-center justify-center space-x-2 pt-4"
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
