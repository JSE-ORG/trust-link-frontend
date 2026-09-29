import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function PaymentEscrowClient() {
  const { t } = useTranslation('dashboard');

  // ... existing logic ...

  return (
    <div>
      {/* ... other JSX ... */}
      <Button>
        {t('confirmPayment')}
      </Button>
      <p>{t('paymentInstructions')}</p>
      {/* ... rest of component ... */}
    </div>
  );
}