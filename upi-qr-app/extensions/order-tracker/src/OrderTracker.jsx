/**
 * "My orders" page in the customer's account.
 *
 * Groups the signed-in customer's orders by what you do in Shopify admin:
 *   Payment processing  - order placed, payment still pending (UPI not marked as paid yet)
 *   Being delivered     - marked as paid, not fulfilled yet
 *   Fulfilled           - you clicked "Fulfill items" (shows "Delivered" once marked as delivered)
 *   Cancelled           - cancelled orders
 * It reads live data each time the page opens, so it changes as soon as you update the order.
 */
import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export default async () => {
  render(<OrderTracker />, document.body);
};

const API = 'shopify://customer-account/api/2026-10/graphql.json';

// Tried in order: if Shopify rejects a field, a smaller query still shows the orders.
const QUERIES = [
  `query MyOrders {
    customer {
      orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
        edges { node {
          id name processedAt cancelledAt financialStatus statusPageUrl
          totalPrice { amount currencyCode }
          fulfillments(first: 10) { edges { node { status latestShipmentStatus } } }
          lineItems(first: 3) { edges { node { title quantity image { url } } } }
        } }
      }
    }
  }`,
  `query MyOrders {
    customer {
      orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
        edges { node {
          id name processedAt cancelledAt financialStatus statusPageUrl
          totalPrice { amount currencyCode }
          fulfillments(first: 10) { edges { node { status } } }
        } }
      }
    }
  }`,
  `query MyOrders {
    customer {
      orders(first: 50) {
        edges { node { id name processedAt financialStatus statusPageUrl totalPrice { amount currencyCode } } }
      }
    }
  }`,
];

async function loadOrders() {
  let lastError = '';
  for (const query of QUERIES) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      const edges = json?.data?.customer?.orders?.edges;
      if (Array.isArray(edges)) return edges.map((e) => e.node).filter(Boolean);
      lastError = (json?.errors || []).map((e) => e.message).join('; ') || `HTTP ${res.status}`;
    } catch (e) {
      lastError = String(e?.message || e);
    }
  }
  throw new Error(lastError || 'Could not load orders');
}

const nodes = (conn) => (conn?.edges || []).map((e) => e.node).filter(Boolean);

/** Decide which group an order belongs to. */
function stageOf(order) {
  const pay = String(order.financialStatus || '').toUpperCase();
  if (order.cancelledAt || pay === 'VOIDED') return 'cancelled';
  const fulfillments = nodes(order.fulfillments).filter((f) => !['CANCELLED', 'ERROR', 'FAILURE'].includes(String(f.status || '').toUpperCase()));
  if (fulfillments.length) return 'fulfilled';
  if (pay === 'PAID' || pay === 'REFUNDED' || pay === 'PARTIALLY_REFUNDED') return 'delivering';
  return 'payment';
}

const isDelivered = (order) => nodes(order.fulfillments).some((f) => String(f.latestShipmentStatus || '').toUpperCase() === 'DELIVERED');

const GROUPS = [
  {
    key: 'payment',
    heading: 'Payment processing',
    badge: 'Awaiting payment',
    tone: 'critical',
    note: 'We confirm your order as soon as we receive your UPI payment. This usually takes a few hours.',
    empty: 'No orders waiting for payment.',
  },
  {
    key: 'delivering',
    heading: 'Being delivered',
    badge: 'Payment received',
    tone: 'auto',
    note: 'Payment received. We are packing your order for delivery in Jaipur.',
    empty: 'No orders on their way right now.',
  },
  {
    key: 'fulfilled',
    heading: 'Fulfilled',
    badge: 'Fulfilled',
    tone: 'neutral',
    note: '',
    empty: 'No fulfilled orders yet.',
  },
  {
    key: 'cancelled',
    heading: 'Cancelled',
    badge: 'Cancelled',
    tone: 'neutral',
    note: '',
    empty: '',
  },
];

function OrderTracker() {
  const [state, setState] = useState({ loading: true, error: '', orders: [] });

  const refresh = async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const orders = await loadOrders();
      setState({ loading: false, error: '', orders });
    } catch (e) {
      setState({ loading: false, error: String(e?.message || e), orders: [] });
    }
  };

  useEffect(() => { refresh(); }, []);

  const grouped = Object.fromEntries(GROUPS.map((g) => [g.key, []]));
  for (const order of state.orders) grouped[stageOf(order)].push(order);

  return (
    <s-page heading="My orders" subheading="See where each of your orders is. This page updates as soon as we update your order.">
      <s-stack direction="block" gap="large">
        {state.loading && (
          <s-section>
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-spinner accessibilityLabel="Loading your orders" />
              <s-text color="subdued">Loading your orders…</s-text>
            </s-stack>
          </s-section>
        )}

        {!state.loading && state.error && (
          <s-banner tone="critical" heading="We couldn't load your orders">
            <s-stack direction="block" gap="small">
              <s-paragraph>Please try again in a moment. Your orders are also listed on the Orders page.</s-paragraph>
              <s-text color="subdued">{state.error}</s-text>
              <s-stack direction="inline" gap="small">
                <s-button onClick={refresh}>Try again</s-button>
                <s-button variant="secondary" href="shopify:customer-account/orders">Go to Orders</s-button>
              </s-stack>
            </s-stack>
          </s-banner>
        )}

        {!state.loading && !state.error && state.orders.length === 0 && (
          <s-section>
            <s-stack direction="block" gap="small">
              <s-heading>No orders yet</s-heading>
              <s-paragraph>When you place an order, it will appear here with its payment and delivery status.</s-paragraph>
            </s-stack>
          </s-section>
        )}

        {!state.loading && !state.error && state.orders.length > 0 && (
          <>
            <s-stack direction="inline" gap="small" alignItems="center">
              {GROUPS.filter((g) => g.key !== 'cancelled' || grouped.cancelled.length).map((g) => (
                <s-badge key={g.key} tone={g.tone}>{`${g.heading}: ${grouped[g.key].length}`}</s-badge>
              ))}
              <s-button variant="secondary" onClick={refresh}>Refresh</s-button>
            </s-stack>

            {GROUPS.filter((g) => g.key !== 'cancelled' || grouped.cancelled.length).map((g) => (
              <s-section key={g.key} heading={`${g.heading} (${grouped[g.key].length})`}>
                {grouped[g.key].length === 0 ? (
                  <s-text color="subdued">{g.empty}</s-text>
                ) : (
                  <s-stack direction="block" gap="base">
                    {grouped[g.key].map((order) => <OrderCard key={order.id} order={order} group={g} />)}
                  </s-stack>
                )}
              </s-section>
            ))}
          </>
        )}
      </s-stack>
    </s-page>
  );
}

function OrderCard({ order, group }) {
  const items = nodes(order.lineItems);
  const first = items[0];
  const more = items.length > 1 ? ` + ${items.length - 1} more` : '';
  const delivered = group.key === 'fulfilled' && isDelivered(order);
  const total = order.totalPrice
    ? shopify.i18n.formatCurrency(Number(order.totalPrice.amount), { currency: order.totalPrice.currencyCode })
    : '';
  let date = '';
  try { date = shopify.i18n.formatDate(new Date(order.processedAt), { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { date = ''; }

  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
        <s-stack direction="inline" gap="base" alignItems="center">
          {first?.image?.url && <s-product-thumbnail src={first.image.url} alt={first.title} size="small" />}
          <s-stack direction="block" gap="small-100">
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-text type="strong">{`Order ${order.name}`}</s-text>
              <s-badge tone={group.tone}>{delivered ? 'Delivered' : group.badge}</s-badge>
            </s-stack>
            {first && <s-text>{`${first.title}${first.quantity > 1 ? ` × ${first.quantity}` : ''}${more}`}</s-text>}
            <s-text color="subdued">{[date, total].filter(Boolean).join(' · ')}</s-text>
            {group.note && <s-text color="subdued">{group.note}</s-text>}
          </s-stack>
        </s-stack>
        {order.statusPageUrl && <s-button variant="secondary" href={order.statusPageUrl}>View order</s-button>}
      </s-stack>
    </s-box>
  );
}
