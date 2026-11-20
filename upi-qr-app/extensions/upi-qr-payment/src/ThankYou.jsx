/**
 * DecorIn — UPI QR on the Thank you page (checkout UI extension, API 2026-10, Preact).
 *
 * Shown only when the customer chose a manual payment method (your "UPI (Scan & Pay)").
 * The order already exists in Shopify as "Payment pending". The customer presses
 * "Pay with UPI", the QR appears, and the UPI note carries the order's confirmation
 * number so you can match the payment in your UPI app to the order in Shopify admin.
 *
 * UPI note formula:  <prefix> <confirmation number> Rs<amount>
 *            e.g.    DecorIn X7K2P9QAB Rs499.00
 */
import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState } from 'preact/hooks';

const DEFAULT_UPI_ID = '9149296348@ybl';
const DEFAULT_PAYEE = 'DecorIn';

export default async () => {
  render(<UpiPayment />, document.body);
};

// UPI apps expect %20 for spaces (not "+")
export function buildUpiLink({ upiId, payee, amount, note }) {
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payee)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
}

function UpiPayment() {
  const [showQr, setShowQr] = useState(false);

  const selectedPayments = shopify.selectedPaymentOptions.value || [];
  const total = shopify.cost.totalAmount.value;
  const confirmation = shopify.orderConfirmation.value;
  const settings = shopify.settings.value || {};
  const t = (key, options = undefined) => shopify.i18n.translate(key, options);

  // Only for orders paid with a manual payment method, in rupees
  const isManual = selectedPayments.some((option) => option.type === 'manualPayment');
  if (!isManual || !total || total.currencyCode !== 'INR') return null;

  const upiId = String(settings.upi_id || DEFAULT_UPI_ID).trim();
  const payee = String(settings.payee_name || DEFAULT_PAYEE).trim();
  const prefix = String(settings.note_prefix || DEFAULT_PAYEE).trim();

  const amount = Number(total.amount).toFixed(2);
  const reference =
    (confirmation && confirmation.number) ||
    (confirmation && confirmation.order && confirmation.order.id.split('/').pop()) ||
    '';
  const note = `${prefix} ${reference} Rs${amount}`.trim();
  const upiLink = buildUpiLink({ upiId, payee, amount, note });
  const amountLabel = shopify.i18n.formatCurrency(Number(total.amount), { currency: 'INR' });

  return (
    <s-section heading={t('title')}>
      <s-stack gap="base">
        <s-paragraph color="subdued">{t('intro', { amount: amountLabel })}</s-paragraph>

        {!showQr ? (
          <s-button variant="primary" inlineSize="fill" onClick={() => setShowQr(true)}>
            {t('pay_button', { amount: amountLabel })}
          </s-button>
        ) : (
          <s-stack gap="base">
            <s-stack alignItems="center">
              <s-box maxInlineSize="260px" inlineSize="100%">
                <s-qr-code content={upiLink} size="fill" border="base" accessibilityLabel={t('qr_label', { amount: amountLabel })} />
              </s-box>
            </s-stack>
            <s-text type="strong">{t('scan')}</s-text>
            <s-link href={upiLink} target="_blank">{t('open_app')}</s-link>

            <s-divider />
            <s-stack direction="inline" gap="base" justifyContent="space-between">
              <s-text color="subdued">{t('upi_id')}</s-text>
              <s-text type="strong">{upiId}</s-text>
            </s-stack>
            <s-stack direction="inline" gap="base" justifyContent="space-between">
              <s-text color="subdued">{t('reference')}</s-text>
              <s-text type="strong">{note}</s-text>
            </s-stack>

            <s-banner tone="info" heading={t('processing_title')}>
              <s-paragraph>{t('processing_body')}</s-paragraph>
            </s-banner>
            <s-button variant="secondary" onClick={() => setShowQr(false)}>{t('hide')}</s-button>
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}
