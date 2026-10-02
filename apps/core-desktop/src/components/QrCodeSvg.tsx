import * as React from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({ value, size = 192, className = '' }) => {
  const [svgString, setSvgString] = React.useState<string>('');

  React.useEffect(() => {
    if (!value) return;
    QRCode.toString(
      value,
      {
        type: 'svg',
        margin: 4,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err, string) => {
        if (!err && string) {
          setSvgString(string);
        }
      }
    );
  }, [value]);

  if (!svgString) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-white flex items-center justify-center p-4 border border-border rounded-card ${className}`}
      >
        <span className="text-xs font-mono text-text-muted">Generating QR...</span>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`bg-white p-2 rounded-card border border-border shadow-sm flex items-center justify-center overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};
