import * as React from 'react';
import { Button, Input, PasswordInput, PhoneInput, Select, Checkbox, Card } from '@40labs/ui-components';
import { authApi } from '../../api/authApi';
import { TermsModal } from './components/TermsModal';
import { PinOtpInput } from './components/PinOtpInput';
import { TZ_ADMIN_AREAS } from '../../lib/tzAdminAreas';

interface RegistrationWizardProps {
  onComplete: () => void;
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({ onComplete }) => {
  const [step, setStep] = React.useState<number>(1);
  const [formData, setFormData] = React.useState({
    name: '',
    type: 'Pharmacy',
    email: '',
    phone: '',
    role_scopes: 'pharmacy',
    scale: 'medium',
    region: TZ_ADMIN_AREAS[0].name,
    district: TZ_ADMIN_AREAS[0].districts[0],
    mtaa: '',
    kata: '',
    matawi: '1',
    lipaNamba: '',
    paymentNumber: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerPhone: '',
    ownerEmail: '',
    otpCode: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [gpsEnabled, setGpsEnabled] = React.useState(false);
  const [latLng, setLatLng] = React.useState<{ lat?: number; lng?: number }>({});
  const [otpCountdown, setOtpCountdown] = React.useState(60);
  const [canResendOtp, setCanResendOtp] = React.useState(false);

  const [termsOpen, setTermsOpen] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{ businessId: string; username: string; codes: string[] } | null>(null);
  const [codesSaved, setCodesSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // OTP Countdown timer
  React.useEffect(() => {
    if (step === 5 && otpCountdown > 0) {
      const timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    } else if (otpCountdown === 0) {
      setCanResendOtp(true);
    }
  }, [step, otpCountdown]);

  const updateField = (key: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'region') {
        const found = TZ_ADMIN_AREAS.find((r) => r.name === value);
        if (found) {
          updated.district = found.districts[0];
        }
      }
      return updated;
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 512 * 1024) {
        setError('Logo lazima iwe chini ya KB 512');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGpsToggle = (checked: boolean) => {
    setGpsEnabled(checked);
    if (checked && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLatLng({})
      );
    } else {
      setLatLng({});
    }
  };

  const handleNext = async () => {
    setError(null);
    if (step === 5) {
      setLoading(true);
      try {
        await authApi.otpVerify(formData.ownerPhone, formData.otpCode);
        setStep(6);
      } catch (err: any) {
        setError(err?.code || 'INVALID_CREDENTIALS');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 7) {
      if (!termsAccepted) {
        setTermsOpen(true);
        return;
      }
      setLoading(true);
      try {
        // Compute terms_text_sha256 using WebCrypto
        const termsString = '40Labs Terms of Service & Privacy Policy v1.0';
        const msgUint8 = new TextEncoder().encode(termsString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const terms_text_sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        await authApi.registrationCommit({ ...formData, terms_text_sha256, locale: 'sw-TZ' });
        const mockRes = {
          businessId: 'AFYA-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          username: formData.username,
          codes: ['ABCDE-12345', 'FGHIJ-67890', 'KLMNO-11111', 'PQRST-22222', 'UVWXY-33333', 'ZABCD-44444', 'EFGHI-55555', 'JKLMN-66666'],
        };
        setSuccessData(mockRes);
        setStep(8);
      } catch (err: any) {
        setError(err?.code || 'POLICY_VIOLATION');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step < 8) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1 && step < 8) {
      setStep((s) => s - 1);
    }
  };

  const currentRegionObj = TZ_ADMIN_AREAS.find((r) => r.name === formData.region) || TZ_ADMIN_AREAS[0];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <Card className="w-full max-w-xl p-8 space-y-6 shadow-lg border border-border rounded-xl">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold font-sora text-foreground">
            {step === 1 && 'Biashara'}
            {step === 2 && 'Aina na Ukubwa'}
            {step === 3 && 'Eneo'}
            {step === 4 && 'Malipo'}
            {step === 5 && 'Mmiliki na SMS OTP'}
            {step === 6 && 'Akaunti'}
            {step === 7 && 'Masharti'}
            {step === 8 && 'Mafanikio'}
          </h1>
          <p className="text-xs text-muted-foreground font-mono">Hatua {step} ya 8</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Step 1: Business */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">Logo</span>
                )}
              </div>
              <input type="file" accept="image/png, image/jpeg" onChange={handleLogoUpload} className="text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Jina la Biashara</label>
              <Input
                value={formData.name}
                onChange={(e: any) => updateField('name', e.target.value)}
                placeholder="Jina la biashara"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Aina ya Biashara</label>
              <Select
                value={formData.type}
                onChange={(e: any) => updateField('type', e.target.value)}
                options={[
                  { label: 'Duka la Dawa', value: 'Pharmacy' },
                  { label: 'Maabara', value: 'Laboratory' },
                  { label: 'Hospitali / Kituo cha Afya', value: 'Hospital' },
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Barua pepe</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: any) => updateField('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Namba ya Simu</label>
              <PhoneInput
                value={formData.phone}
                onChange={(val: string) => updateField('phone', val)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Mode / Scale */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Mtindo (Role Scopes)</label>
              <Select
                value={formData.role_scopes}
                onChange={(e: any) => updateField('role_scopes', e.target.value)}
                options={[
                  { label: 'Duka la Dawa (Pharmacy)', value: 'pharmacy' },
                  { label: 'Maabara (Lab)', value: 'lab' },
                  { label: 'Vyote (Both)', value: 'both' },
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Ukubwa (Scale)</label>
              <Select
                value={formData.scale}
                onChange={(e: any) => updateField('scale', e.target.value)}
                options={[
                  { label: 'Mdogo (Small)', value: 'small' },
                  { label: 'Wastani (Medium)', value: 'medium' },
                  { label: 'Kubwa (Large)', value: 'large' },
                ]}
              />
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Nchi</label>
              <Input value="Tanzania" disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Mkoa</label>
              <Select
                value={formData.region}
                onChange={(e: any) => updateField('region', e.target.value)}
                options={TZ_ADMIN_AREAS.map((r) => ({ label: r.name, value: r.name }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Wilaya</label>
              <Select
                value={formData.district}
                onChange={(e: any) => updateField('district', e.target.value)}
                options={currentRegionObj.districts.map((d) => ({ label: d, value: d }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Mtaa</label>
              <Input
                value={formData.mtaa}
                onChange={(e: any) => updateField('mtaa', e.target.value)}
                placeholder="Mtaa"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Kata</label>
              <Input
                value={formData.kata}
                onChange={(e: any) => updateField('kata', e.target.value)}
                placeholder="Kata"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                checked={gpsEnabled}
                onChange={(e: any) => handleGpsToggle(e.target?.checked ?? !gpsEnabled)}
                label="Wezesha GPS (Eneo la sasa)"
              />
            </div>
            {latLng.lat && (
              <p className="text-xs text-muted-foreground font-mono">
                Lat: {latLng.lat.toFixed(4)}, Lng: {latLng.lng?.toFixed(4)}
              </p>
            )}
          </div>
        )}

        {/* Step 4: Payments */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Idadi ya Matawi</label>
              <Input
                value={formData.matawi}
                onChange={(e: any) => updateField('matawi', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Lipa Namba</label>
              <Input
                value={formData.lipaNamba}
                onChange={(e: any) => updateField('lipaNamba', e.target.value)}
                placeholder="Lipa namba"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Namba ya Malipo</label>
              <Input
                value={formData.paymentNumber}
                onChange={(e: any) => updateField('paymentNumber', e.target.value)}
                placeholder="Namba ya malipo"
              />
            </div>
          </div>
        )}

        {/* Step 5: Owner & SMS OTP */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Jina la Kwanza la Mmiliki</label>
              <Input
                value={formData.ownerFirstName}
                onChange={(e: any) => updateField('ownerFirstName', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Jina la Mwisho la Mmiliki</label>
              <Input
                value={formData.ownerLastName}
                onChange={(e: any) => updateField('ownerLastName', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Simu ya Mmiliki (SMS OTP)</label>
              <PhoneInput
                value={formData.ownerPhone}
                onChange={(val: string) => updateField('ownerPhone', val)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Weka SMS OTP</label>
              <PinOtpInput
                length={6}
                value={formData.otpCode}
                onChange={(val) => updateField('otpCode', val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                {otpCountdown > 0 ? `Subiri sekunde ${otpCountdown} kutuma tena` : 'Tayari kutuma'}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!canResendOtp}
                onClick={() => {
                  authApi.otpRequest(formData.ownerPhone);
                  setOtpCountdown(60);
                  setCanResendOtp(false);
                }}
              >
                Tuma msimbo
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Account */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Jina la Mtumiaji (Username)</label>
              <Input
                autoComplete="username"
                value={formData.username}
                onChange={(e: any) => updateField('username', e.target.value.toLowerCase().trim())}
                placeholder="username (a-z, 0-9, ._-)"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Nenosiri (Password)</label>
              <PasswordInput
                autoComplete="new-password"
                value={formData.password}
                onChange={(e: any) => updateField('password', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Thibitisha Nenosiri</label>
              <PasswordInput
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e: any) => updateField('confirmPassword', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 7: Terms */}
        {step === 7 && (
          <div className="space-y-6 text-center py-6">
            <p className="text-sm text-foreground">
              Tafadhali soma na ukubali{' '}
              <button
                type="button"
                className="text-primary underline font-medium hover:opacity-80"
                onClick={() => setTermsOpen(true)}
              >
                vigezo na masharti
              </button>{' '}
              ya 40Labs. (Soma zaidi…)
            </p>
            <div className="flex justify-center items-center pt-2">
              <Checkbox
                checked={termsAccepted}
                onChange={(e: any) => setTermsAccepted(e.target?.checked ?? !termsAccepted)}
                label="Kubali masharti na sera ya faragha"
              />
            </div>
          </div>
        )}

        {/* Step 8: Success */}
        {step === 8 && successData && (
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold text-foreground">
              Hongera {formData.ownerFirstName}! Biashara yako imesajiliwa kikamilifu.
            </p>
            <div className="p-4 bg-muted rounded-lg font-mono text-xs space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span><strong>Business ID:</strong> {successData.businessId}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(successData.businessId)}
                >
                  Nakili
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span><strong>Username:</strong> {successData.username}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(successData.username)}
                >
                  Nakili
                </Button>
              </div>
            </div>
            <div className="text-left space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Namba za Urejeshaji (Recovery Codes):</p>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs p-3 bg-background border border-border rounded">
                {successData.codes.map((c, idx) => (
                  <span key={idx}>{c}</span>
                ))}
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([successData.codes.join('\n')], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = '40labs-recovery-codes.txt';
                    a.click();
                  }}
                >
                  Pakua (.txt)
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Chapisha
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center pt-2">
              <Checkbox
                checked={codesSaved}
                onChange={(e: any) => setCodesSaved(e.target?.checked ?? !codesSaved)}
                label="Nimehifadhi namba zangu za urejeshaji"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-border">
          {step > 1 && step < 8 && (
            <Button variant="outline" onClick={handleBack}>
              Rudi
            </Button>
          )}
          {step === 4 && (
            <Button variant="outline" onClick={() => setStep(5)}>
              Ruka (Skip)
            </Button>
          )}
          <div className="ml-auto">
            {step < 8 ? (
              <Button
                disabled={loading || (step === 7 && !termsAccepted)}
                onClick={handleNext}
              >
                {loading ? 'Inapakia...' : step === 7 ? 'Maliza' : 'Endelea'}
              </Button>
            ) : (
              <Button
                disabled={!codesSaved}
                onClick={onComplete}
              >
                Anza
              </Button>
            )}
          </div>
        </div>
      </Card>

      <TermsModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setTermsOpen(false);
        }}
      />
    </div>
  );
};
