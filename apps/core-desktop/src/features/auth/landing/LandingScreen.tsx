import * as React from 'react';
import { Button, Card } from '@40labs/ui-components';
import { ThemeLogo } from '../../../components/brand';
import { Store, Package, ShoppingCart, TestTube, BarChart3, ShieldCheck, ArrowRight, LogIn } from 'lucide-react';

interface LandingScreenProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onGetStarted, onLogin }) => {
  const [lang, setLang] = React.useState<'sw-TZ' | 'en'>('sw-TZ');

  const capabilities = [
    {
      icon: <Store className="w-5 h-5 text-primary" />,
      title: { sw: 'Mauzo na POS', en: 'Sales & POS' },
      desc: { sw: 'Simamia mauzo ya dukani na stakabadhi za wateja kwa urahisi.', en: 'Manage storefront POS and customer receipts effortlessly.' }
    },
    {
      icon: <Package className="w-5 h-5 text-primary" />,
      title: { sw: 'Usimamizi wa Stoo', en: 'Inventory Control' },
      desc: { sw: 'Fuatilia dawa, vifaa tiba, na bidhaa bila kupitiliza au kupungukiwa.', en: 'Track pharmaceuticals and medical supplies in real time.' }
    },
    {
      icon: <ShoppingCart className="w-5 h-5 text-primary" />,
      title: { sw: 'Ununuzi wa Ndani', en: 'In-App Purchasing' },
      desc: { sw: 'Agiza bidhaa moja kwa moja kutoka kwa wasambazaji waliothibitishwa.', en: 'Order products directly from certified medical suppliers.' }
    },
    {
      icon: <TestTube className="w-5 h-5 text-primary" />,
      title: { sw: 'Maabara na Uchunguzi', en: 'Laboratory & Diagnostics' },
      desc: { sw: 'Simamia maombi ya vipimo, matokeo, na rekodi za wagonjwa.', en: 'Manage test requests, diagnostic results, and patient logs.' }
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-primary" />,
      title: { sw: 'Ripoti za Kila Siku', en: 'Daily Financial Reports' },
      desc: { sw: 'Tazama mapato, matumizi, na mwenendo wa biashara yako kwa usahihi.', en: 'Monitor revenues, expenses, and business performance accurately.' }
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-primary" />,
      title: { sw: 'Usalama na Faragha', en: 'Secure & Offline-First' },
      desc: { sw: 'Data zako zinalindwa ndani ya kifaa chako kwa viwango vya juu.', en: 'Your business data is securely stored and protected locally.' }
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col select-none">
      {/* Top Bar */}
      <div className="w-full px-6 py-4 flex items-center justify-between border-b border-border bg-surface">
        <div className="flex items-center space-x-3">
          <ThemeLogo variant="full" height={36} />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Core v1.0</span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            intent="neutral"
            size="sm"
            onClick={() => setLang(lang === 'sw-TZ' ? 'en' : 'sw-TZ')}
          >
            {lang === 'sw-TZ' ? 'English' : 'Kiswahili'}
          </Button>
          {onLogin && (
            <Button
              intent="neutral"
              size="sm"
              onClick={onLogin}
              className="flex items-center space-x-1"
            >
              <LogIn size={14} className="mr-1" />
              <span>{lang === 'sw-TZ' ? 'Ingia' : 'Login'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Hero & Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-3xl lg:text-5xl font-bold font-sora text-foreground tracking-tight">
            {lang === 'sw-TZ'
              ? 'Mfumo wa Kisasa wa Biashara na Huduma za Afya'
              : 'Modern Business & Healthcare Platform'}
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
            {lang === 'sw-TZ'
              ? 'Suluhisho thabiti kwa maduka ya dawa, maabara, na vituo vya afya nchini Tanzania. Simamia mauzo, stoo, ununuzi, na ripoti mahali pamoja.'
              : 'Robust enterprise solution for pharmacies, laboratories, and clinics in Tanzania. Manage sales, inventory, procurement, and reports seamlessly.'}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              className="w-full sm:w-auto px-8 py-3 text-base font-semibold flex items-center justify-center space-x-2"
              onClick={onGetStarted}
            >
              <span>{lang === 'sw-TZ' ? 'Anza Kusajili Biashara' : 'Get Started'}</span>
              <ArrowRight size={18} className="ml-1" />
            </Button>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4">
          {capabilities.map((cap, idx) => (
            <Card key={idx} className="p-6 space-y-3 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {cap.icon}
              </div>
              <h3 className="font-semibold text-foreground text-sm lg:text-base">
                {lang === 'sw-TZ' ? cap.title.sw : cap.title.en}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'sw-TZ' ? cap.desc.sw : cap.desc.en}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
