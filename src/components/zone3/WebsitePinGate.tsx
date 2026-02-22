import { useState } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';

const CORRECT_PIN = '2710';

interface WebsitePinGateProps {
  brandName: string;
  sessionKey: string;
  onVerified: () => void;
}

export function WebsitePinGate({ brandName, sessionKey, onVerified }: WebsitePinGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem(sessionKey, 'true');
      onVerified();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,8%)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8">
        <span className="text-2xl font-bold text-white tracking-tight">{brandName}</span>
        <p className="text-sm text-[hsl(215,16%,60%)]">Preview – Zugangscode eingeben</p>

        <InputOTP
          maxLength={4}
          value={pin}
          onChange={(value) => {
            setPin(value);
            setError(false);
          }}
          onComplete={handleSubmit}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="bg-white/10 border-white/20 text-white" />
            <InputOTPSlot index={1} className="bg-white/10 border-white/20 text-white" />
            <InputOTPSlot index={2} className="bg-white/10 border-white/20 text-white" />
            <InputOTPSlot index={3} className="bg-white/10 border-white/20 text-white" />
          </InputOTPGroup>
        </InputOTP>

        {error && (
          <p className="text-sm text-red-400">Falscher Code – bitte erneut versuchen.</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={pin.length < 4}
          className="rounded-full bg-white text-[hsl(220,20%,10%)] hover:bg-white/90 px-8"
        >
          Zugang
        </Button>
      </div>
    </div>
  );
}
