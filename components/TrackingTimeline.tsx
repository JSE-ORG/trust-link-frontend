import { useTranslation } from 'react-i18next';

export default function TrackingTimeline() {
  const { t } = useTranslation('dashboard');

  // ... existing logic ...

  return (
    <div>
      <h2>{t('trackingTitle')}</h2>
      <p>{t('trackingDescription')}</p>
      {/* ... rest of component ... */}
    </div>
  );
}