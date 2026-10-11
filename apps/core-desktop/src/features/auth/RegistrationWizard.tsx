import * as React from 'react';
import { Button, Input, PasswordInput, PhoneInput, Checkbox, Card } from '@40labs/ui-components';
import { authApi } from '../../api/authApi';
import { TermsModal } from './components/TermsModal';
import { PinOtpInput } from './components/PinOtpInput';
import { TZ_ADMIN_AREAS } from '../../lib/tzAdminAreas';
import { normalizePhoneTZ } from '@40labs/i18n';

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
  const [otpCountdown, setOtpCountdown] = React.useState(0);
  const [canResendOtp, setCanResendOtp] = React.useState(true);

  const [termsOpen, setTermsOpen] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{ businessId: string; username: string } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // OTP Countdown timer
  React.useEffect(() => {
    if (step === 8 && otpCountdown > 0) {
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
    if (step === 1 && !formData.name.trim()) {
      setError('Weka jina la biashara.');
      return;
    }
    if (step === 5) {
      if (!formData.ownerFirstName.trim() || !formData.ownerLastName.trim()) {
        setError('Weka majina ya kwanza na ya mwisho ya mmiliki.');
        return;
      }
      const phone = normalizePhoneTZ(formData.ownerPhone);
      if (!phone) {
        setError('Weka namba sahihi ya simu ya Tanzania (mfano 0712 345 678).');
        return;
      }
      if (formData.ownerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim())) {
        setError('Weka barua pepe sahihi.');
        return;
      }
      setStep(6);
      return;
    }

    if (step === 6) {
      if (!/^[a-z0-9._-]{3,32}$/.test(formData.username)) {
        setError('Jina la mtumiaji liwe na herufi ndogo, namba, . _ au -, na urefu wa herufi 3 hadi 32.');
        return;
      }
      if (formData.password.length < 12 || formData.password !== formData.confirmPassword) {
        setError(formData.password !== formData.confirmPassword
          ? 'Nenosiri hazilingani.'
          : 'Nenosiri liwe na angalau herufi 12.');
        return;
      }
    }
    if (step === 7) {
      if (!termsAccepted) {
        setTermsOpen(true);
        return;
      }
    }

    if (step === 8) {
      const phone = normalizePhoneTZ(formData.ownerPhone);
      if (!phone) {
        setError('Weka namba sahihi ya simu ya Tanzania.');
        return;
      }
      if (!/^\d{6}$/.test(formData.otpCode)) {
        setError('Weka msimbo sahihi wa OTP wenye tarakimu 6.');
        return;
      }
      setLoading(true);
      try {
        const token = await authApi.otpVerify(phone, formData.otpCode);

        const termsString = '40Labs Terms of Service & Privacy Policy v1.0';
        const msgUint8 = new TextEncoder().encode(termsString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const terms_text_sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const registered = await authApi.registrationCommit({
          verification_token: token,
          business_name: formData.name.trim(),
          business_type: formData.type,
          business_email: formData.email.trim() || null,
          business_phone: normalizePhoneTZ(formData.phone) || null,
          role_scopes: formData.role_scopes,
          scale: formData.scale,
          region: formData.region,
          district: formData.district,
          mtaa: formData.mtaa.trim() || null,
          kata: formData.kata.trim() || null,
          latitude: latLng.lat ?? null,
          longitude: latLng.lng ?? null,
          declared_branch_count: Number(formData.matawi || 1),
          lipa_namba: formData.lipaNamba.trim() || null,
          payment_number: formData.paymentNumber.trim() || null,
          logo_data_url: logoPreview,
          owner_first_name: formData.ownerFirstName.trim(),
          owner_last_name: formData.ownerLastName.trim(),
          owner_email: formData.ownerEmail.trim() || null,
          owner_phone: phone,
          username: formData.username,
          password: formData.password,
          terms_accepted: true,
          terms_version: 'v1.0',
          terms_locale: 'sw-TZ',
          terms_text_sha256,
        });
        const businessId = registered?.businessId || registered?.business_id;
        if (!businessId) {
          throw new Error('Usajili haukurejesha Business ID. Tafadhali wasiliana na msaada kabla ya kujaribu tena.');
        }
        setSuccessData({ businessId, username: formData.username });
        setStep(9);
      } catch (err: any) {
        setError(err?.code || err?.message || 'Imeshindikana kuthibitisha OTP na kukamilisha usajili.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step < 9) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1 && step < 9) {
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
            {step === 5 && 'Mmiliki'}
            {step === 6 && 'Akaunti'}
            {step === 7 && 'Masharti'}
            {step === 8 && 'Thibitisha Simu (OTP)'}
            {step === 9 && 'Mafanikio'}
          </h1>
          <p className="text-xs text-muted-foreground font-mono">{step < 9 ? `Hatua ${step} ya 8` : 'Usajili umekamilika'}</p>
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
              <select
                value={formData.type}
                onChange={(e) => updateField('type', e.target.value)}
                className="w-full text-xs bg-panel-subtle border border-border rounded-input p-2 text-text-primary"
              >
                <option value="Pharmacy">Duka la Dawa</option>
                <option value="Laboratory">Maabara</option>
                <option value="Hospital">Hospitali / Kituo cha Afya</option>
              </select>
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
                onChange={(val: any) => updateField('phone', typeof val === 'string' ? val : val?.target?.value || '')}
              />
            </div>
          </div>
        )}

        {/* Step 2: Mode / Scale */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Mtindo (Role Scopes)</label>
              <select
                value={formData.role_scopes}
                onChange={(e) => updateField('role_scopes', e.target.value)}
                className="w-full text-xs bg-panel-subtle border border-border rounded-input p-2 text-text-primary"
              >
                <option value="pharmacy">Duka la Dawa (Pharmacy)</option>
                <option value="lab">Maabara (Lab)</option>
                <option value="both">Vyote (Both)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Ukubwa (Scale)</label>
              <select
                value={formData.scale}
                onChange={(e) => updateField('scale', e.target.value)}
                className="w-full text-xs bg-panel-subtle border border-border rounded-input p-2 text-text-primary"
              >
                <option value="small">Mdogo (Small)</option>
                <option value="medium">Wastani (Medium)</option>
                <option value="large">Kubwa (Large)</option>
              </select>
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
              <select
                value={formData.region}
                onChange={(e) => updateField('region', e.target.value)}
                className="w-full text-xs bg-panel-subtle border border-border rounded-input p-2 text-text-primary"
              >
                {TZ_ADMIN_AREAS.map((r) => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Wilaya</label>
              <select
                value={formData.district}
                onChange={(e) => updateField('district', e.target.value)}
                className="w-full text-xs bg-panel-subtle border border-border rounded-input p-2 text-text-primary"
              >
                {currentRegionObj.districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
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
            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gpsEnabled}
                  onChange={(e) => handleGpsToggle(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary accent-primary"
                />
                <span className="text-xs text-foreground font-medium">Wezesha GPS (Nasa eneo la sasa)</span>
              </label>
              {latLng.lat && latLng.lng && (
                <p className="text-[10px] font-mono text-muted-foreground mt-1">
                  Lat: {latLng.lat.toFixed(4)}, Lng: {latLng.lng.toFixed(4)}
                </p>
              )}
            </div>
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
                placeholder="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Lipa Namba</label>
              <Input
                value={formData.lipaNamba}
                onChange={(e: any) => updateField('lipaNamba', e.target.value)}
                placeholder="Namba ya biashara"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Namba ya Malipo (Simu)</label>
              <Input
                value={formData.paymentNumber}
                onChange={(e: any) => updateField('paymentNumber', e.target.value)}
                placeholder="+255..."
              />
            </div>
          </div>
        )}

        {/* Step 5: Owner details */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Jina la Kwanza la Mmiliki</label>
              <Input
                value={formData.ownerFirstName}
                onChange={(e: any) => updateField('ownerFirstName', e.target.value)}
                placeholder="Jina la kwanza"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Jina la Mwisho la Mmiliki</label>
              <Input
                value={formData.ownerLastName}
                onChange={(e: any) => updateField('ownerLastName', e.target.value)}
                placeholder="Jina la mwisho"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Namba ya Simu ya Mmiliki</label>
              <PhoneInput
                value={formData.ownerPhone}
                onChange={(val: any) => updateField('ownerPhone', typeof val === 'string' ? val : val?.target?.value || '')}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Barua pepe ya Mmiliki</label>
              <Input
                type="email"
                value={formData.ownerEmail}
                onChange={(e: any) => updateField('ownerEmail', e.target.value)}
                placeholder="owner@example.com"
              />
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

        {/* Step 8: Final phone verification */}
        {step === 8 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tuma msimbo kwa namba ya mmiliki kisha uweke tarakimu 6 ili kuthibitisha na kukamilisha usajili.
            </p>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Namba ya Simu ya Mmiliki</label>
              <Input value={normalizePhoneTZ(formData.ownerPhone) || formData.ownerPhone} readOnly />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground font-mono">
                {otpCountdown > 0 ? `Subiri sekunde ${otpCountdown} kutuma tena` : 'Tayari kutuma msimbo'}
              </span>
              <Button
                intent="neutral"
                size="sm"
                disabled={loading || !canResendOtp}
                onClick={async () => {
                  setError(null);
                  const phone = normalizePhoneTZ(formData.ownerPhone);
                  if (!phone) {
                    setError('Weka namba sahihi ya simu ya Tanzania (mfano 0712 345 678).');
                    return;
                  }
                  setLoading(true);
                  try {
                    await authApi.otpRequest(phone);
                    setOtpCountdown(60);
                    setCanResendOtp(false);
                    updateField('otpCode', '');
                  } catch (err: any) {
                    setError(err?.code || err?.message || 'Imeshindikana kutuma OTP.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {otpCountdown > 0 ? 'Tuma tena baadaye' : 'Tuma msimbo'}
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Msimbo wa SMS (OTP)</label>
              <PinOtpInput length={6} value={formData.otpCode} onChange={(val) => updateField('otpCode', val)} />
            </div>
          </div>
        )}

        {/* Step 8: Success */}
        {step === 9 && successData && (
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold text-foreground">
              Hongera {formData.ownerFirstName}! Biashara yako imesajiliwa kikamilifu.
            </p>
            <div className="p-4 bg-muted rounded-lg font-mono text-xs space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span><strong>Business ID:</strong> {successData.businessId}</span>
                <Button
                  intent="neutral"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(successData.businessId)}
                >
                  Nakili
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span><strong>Username:</strong> {successData.username}</span>
                <Button
                  intent="neutral"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(successData.username)}
                >
                  Nakili
                </Button>
              </div>
            </div>

          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-border">
          {step > 1 && step < 9 && (
            <Button intent="neutral" onClick={handleBack}>
              Rudi
            </Button>
          )}
          <div className="ml-auto">
            {step < 9 ? (
              <Button
                disabled={loading || (step === 7 && !termsAccepted) || (step === 8 && !formData.otpCode)}
                onClick={handleNext}
              >
                {loading ? 'Inasubiri...' : step === 8 ? 'Thibitisha na Sajili' : step === 7 ? 'Endelea' : 'Endelea'}
              </Button>
            ) : (
              <Button
                disabled={!successData}
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
