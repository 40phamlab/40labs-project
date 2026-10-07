import * as React from 'react';
import { Button, Card } from '@40labs/ui-components';
import { t } from '@40labs/i18n';

interface LandingScreenProps {
  onGetStarted: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onGetStarted }) => {
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [lang, setLang] = React.useState<'sw-TZ' | 'en'>('sw-TZ');

  const features = [
    { title: 'Mauzo ya Mtandaoni', titleEn: 'Online Selling', desc: 'Simamia mauzo na POS kwa urahisi', descEn: 'Manage sales and POS with ease' },
    { title: 'Ripoti za Kila Siku', titleEn: 'Daily Reports', desc: 'Fuatilia mwenendo wa biashara kila siku', descEn: 'Track business performance daily' },
    { title: 'Ununuzi Ndani ya Mfumo', titleEn: 'In-app Purchasing', desc: 'Agiza bidhaa moja kwa moja kutoka kwa wasambazaji', descEn: 'Order products directly from suppliers' },
    { title: 'Wateja Zaidi', titleEn: 'More Customers', desc: 'Boresha uhusiano na wateja wako', descEn: 'Improve customer relations' },
    { title: 'Wasiliana na Ushirikiane', titleEn: 'Reach Out & Collaborate', desc: 'Fanya kazi pamoja na wafanyakazi na wataalamu', descEn: 'Collaborate with staff and specialists' },
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [features.length]);

  const currentFeature = features[carouselIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLang(lang === 'sw-TZ' ? 'en' : 'sw-TZ')}
        >
          {lang === 'sw-TZ' ? 'English' : 'Kiswahili'}
        </Button>
      </div>

      <Card className="w-full max-w-lg p-8 space-y-8 shadow-xl border border-border rounded-xl text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-sora text-primary">40Labs</h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'sw-TZ' ? 'Mfumo wa Kisasa wa Biashara na Afya' : 'Modern Business & Health Platform'}
          </p>
        </div>

        <div className="min-h-[100px] p-4 bg-muted/50 rounded-lg flex flex-col justify-center items-center space-y-1">
          <h3 className="font-semibold text-foreground">
            {lang === 'sw-TZ' ? currentFeature.title : currentFeature.titleEn}
          </h3>
          <p className="text-xs text-muted-foreground">
            {lang === 'sw-TZ' ? currentFeature.desc : currentFeature.descEn}
          </p>
        </div>

        <div className="flex justify-center space-x-1">
          {features.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === carouselIndex ? 'w-6 bg-primary' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>

        <Button className="w-full py-3 text-base font-semibold" onClick={onGetStarted}>
          {lang === 'sw-TZ' ? 'Anza' : 'Get Started'}
        </Button>
      </Card>
    </div>
  );
};
