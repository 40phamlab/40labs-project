import * as React from 'react';
import { Button, Card } from '@40labs/ui-components';
import { Download, Printer, Copy, Check } from 'lucide-react';
import { authApi } from '../../../api/authApi';

interface RecoveryCodesScreenProps {
  onComplete: () => void;
}

export const RecoveryCodesScreen: React.FC<RecoveryCodesScreenProps> = ({ onComplete }) => {
  const [codes, setCodes] = React.useState<Array<string>>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [savedChecked, setSavedChecked] = React.useState(false);

  React.useEffect(() => {
    authApi.recoveryGenerateInitial()
      .then((generated) => {
        setCodes(generated);
      })
      .catch((err) => {
        setError(err?.code || 'Imeshindwa kutengeneza namba za rejesho');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleCopy = () => {
    const text = codes.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = `40Labs - Namba za Rejesho za SUDO\n\nTafadhali hifadhi namba hizi mahali salama:\n\n` + codes.join('\n') + `\n\nKila namba inaweza kutumika mara moja tu.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '40labs-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>40Labs Recovery Codes</title></head>
          <body style="font-family: monospace; padding: 40px;">
            <h2>40Labs - Namba za Rejesho za SUDO</h2>
            <p>Hifadhi namba hizi mahali salama. Hazitaonyeshwa tena!</p>
            <ul>
              ${codes.map((c) => `<li style="font-size: 18px; margin: 8px 0;">${c}</li>`).join('')}
            </ul>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground font-sora">
        <span>Inatengeneza namba za rejesho...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <Card className="w-full max-w-lg p-8 space-y-6 shadow-lg border border-border rounded-xl">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold font-sora text-foreground">Namba za Rejesho za SUDO</h1>
          <p className="text-xs text-muted-foreground">
            Hizi ni namba 8 za siri za kurejesha akaunti yako ya SUDO zikitokea dharura. Hazitaonyeshwa tena!
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 bg-muted/50 p-4 rounded-lg border border-border">
          {codes.map((code, idx) => (
            <div key={idx} className="font-mono text-sm font-bold text-center py-2 bg-background rounded border border-border">
              {code}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <Button intent="neutral" size="sm" onClick={handleDownload} leftIcon={<Download size={16} />}>
            Pakua (TXT)
          </Button>
          <Button intent="neutral" size="sm" onClick={handlePrint} leftIcon={<Printer size={16} />}>
            Chapisha
          </Button>
          <Button intent="neutral" size="sm" onClick={handleCopy} leftIcon={copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}>
            {copied ? 'Imenakiliwa' : 'Nakili'}
          </Button>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={savedChecked}
              onChange={(e) => setSavedChecked(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary accent-primary"
            />
            <span className="text-xs text-foreground font-medium">
              Nimehifadhi namba hizi za rejesho mahali salama ambapo ninaweza kuzipata nikihitajika.
            </span>
          </label>

          <Button
            className="w-full"
            disabled={!savedChecked}
            onClick={onComplete}
          >
            Anza Kutumia Mfumo
          </Button>
        </div>
      </Card>
    </div>
  );
};
