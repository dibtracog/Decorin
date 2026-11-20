/**
 * DecorIn — UPI QR on the Thank you page.
 *
 * Shown only when the customer chose a manual payment method (e.g. "UPI (Scan & Pay)").
 * The order already exists in Shopify as "Payment pending". The customer presses
 * "Pay with UPI", the QR appears, and the UPI note carries the order's confirmation
 * number so you can match the payment in your UPI app to the order in Shopify admin.
 *
 * UPI note formula:  <prefix> <confirmation number> Rs<amount>
 *            e.g.    DecorIn X7K2P9QAB Rs499.00
 */
import { useState } from 'react';
import {
  reactExtension,
  useApi,
  useSubscription,
  useTotalAmount,
  useSelectedPaymentOptions,
  useSettings,
  useTranslate,
  BlockStack,
  InlineStack,
  Heading,
  Text,
  Button,
  Link,
  QRCode,
  Banner,
  Divider,
  View,
} from '@shopify/ui-extensions-react/checkout';

const DEFAULT_UPI_ID = '9149296348@ybl';
const DEFAULT_PAYEE = 'DecorIn';

export default reactExtension('purchase.thank-you.block.render', () => <UpiPayment />);

// UPI apps expect %20 for spaces (not "+")
const enc = (value) => encodeURIComponent(value);

export function buildUpiLink({ upiId, payee, amount, note }) {
  return `upi://pay?pa=${upiId}&pn=${enc(payee)}&am=${amount}&cu=INR&tn=${enc(note)}`;
}

function UpiPayment() {
  const translate = useTranslate();
  const { orderConfirmation } = useApi();
  const confirmation = useSubscription(orderConfirmation);
  const total = useTotalAmount();
  const selectedPayments = useSelectedPaymentOptions();
  const settings = useSettings();
  const [showQr, setShowQr] = useState(false);

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
  const amountLabel = `₹${Number(total.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <BlockStack spacing="base" padding="base" border="base" cornerRadius="large">
      <Heading level={2}>{translate('title')}</Heading>
      <Text appearance="subdued">{translate('intro', { amount: amountLabel })}</Text>

      {!showQr ? (
        <Button kind="primary" onPress={() => setShowQr(true)}>
          {translate('pay_button', { amount: amountLabel })}
        </Button>
      ) : (
        <BlockStack spacing="base">
          <View inlineAlignment="center" padding="base">
            <View maxInlineSize={260} inlineSize="fill">
              <QRCode content={upiLink} size="fill" border="base" accessibilityLabel={translate('qr_label', { amount: amountLabel })} />
            </View>
          </View>
          <Text alignment="center" emphasis="bold">{translate('scan')}</Text>
          <Link to={upiLink} external>{translate('open_app')}</Link>

          <Divider />
          <InlineStack spacing="base" blockAlignment="center">
            <Text appearance="subdued">{translate('upi_id')}</Text>
            <Text emphasis="bold">{upiId}</Text>
          </InlineStack>
          <InlineStack spacing="base" blockAlignment="center">
            <Text appearance="subdued">{translate('reference')}</Text>
            <Text emphasis="bold">{note}</Text>
          </InlineStack>

          <Banner status="info" title={translate('processing_title')}>
            {translate('processing_body')}
          </Banner>
          <Button kind="plain" onPress={() => setShowQr(false)}>{translate('hide')}</Button>
        </BlockStack>
      )}
    </BlockStack>
  );
}
