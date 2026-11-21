/** @jsxImportSource preact */
/**
 * DecorIn — review manager (admin UI extension, API 2026-10, Preact).
 *
 * Shows on each product page in Shopify admin. Lists the reviews customers left
 * for that product (or for all products with the "All products" switch), with
 * the reviewer's name and phone number, and lets you Approve, mark as Spam
 * (hides it) or Delete permanently.
 *
 * Reviews are comments on the blog post "reviews/product-reviews" (the same one
 * the theme uses). Each comment starts with [[product-handle|rating|headline]].
 * The reviewer's phone is stored as the comment email: <digits>@example.com.
 */
import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

const BLOG_HANDLE = 'reviews';
const ARTICLE_HANDLE = 'product-reviews';
const TAG_RE = /^\s*\[\[([^|\]]+)\|([1-5])(?:\|([^\]]*))?\]\]\s*/;

export default async () => {
  render(<ReviewManager />, document.body);
};

/** @returns {Promise<any>} */
const gql = async (query, variables = {}) => {
  const res = await shopify.query(query, { variables });
  if (res.errors && res.errors.length) throw new Error(res.errors.map((e) => e.message).join('; '));
  return res.data;
};

const stripHtml = (html) => String(html || '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

const phoneFromEmail = (email) => {
  const m = String(email || '').match(/^\+?(\d{10,13})@/);
  if (!m) return email || '';
  const d = m[1];
  const local = d.slice(-10);
  return `+${d.length > 10 ? d.slice(0, d.length - 10) : '91'} ${local.slice(0, 5)} ${local.slice(5)}`;
};

const parse = (c) => {
  const text = stripHtml(c.bodyHtml || c.body);
  const m = text.match(TAG_RE);
  return {
    id: c.id,
    status: String(c.status || '').toUpperCase(),
    date: c.createdAt ? new Date(c.createdAt) : null,
    name: c.author?.name || 'Anonymous',
    phone: phoneFromEmail(c.author?.email),
    email: String(c.author?.email || '').trim().toLowerCase(),
    handle: m ? m[1].trim() : '',
    rating: m ? Number(m[2]) : 0,
    title: m ? (m[3] || '').trim() : '',
    body: m ? text.slice(m[0].length).trim() : text,
  };
};

const findArticle = async () => {
  try {
    const d = await gql(`query ($q: String!) { articles(first: 10, query: $q) { nodes { id handle blog { handle } } } }`, { q: `handle:${ARTICLE_HANDLE}` });
    const nodes = d?.articles?.nodes || [];
    const hit = nodes.find((a) => a.handle === ARTICLE_HANDLE && a.blog?.handle === BLOG_HANDLE) || nodes.find((a) => a.handle === ARTICLE_HANDLE);
    if (hit) return hit.id;
  } catch (e) { /* fall through to the slower lookup */ }
  const d = await gql(`{ blogs(first: 25) { nodes { handle articles(first: 100) { nodes { id handle } } } } }`);
  for (const b of d?.blogs?.nodes || []) {
    if (b.handle !== BLOG_HANDLE) continue;
    const a = (b.articles?.nodes || []).find((x) => x.handle === ARTICLE_HANDLE);
    if (a) return a.id;
  }
  return null;
};

const loadComments = async (articleId) => {
  const all = [];
  let after = null;
  for (let i = 0; i < 8; i++) {
    const d = await gql(`query ($id: ID!, $after: String) {
      node(id: $id) { ... on Article { comments(first: 250, after: $after) {
        nodes { id body bodyHtml status createdAt author { name email } }
        pageInfo { hasNextPage endCursor }
      } } }
    }`, { id: articleId, after });
    const conn = d?.node?.comments;
    if (!conn) break;
    all.push(...conn.nodes.map(parse));
    if (!conn.pageInfo?.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }
  return all.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
};

const STATUS = {
  PUBLISHED: { label: 'Published', tone: 'success' },
  PENDING: { label: 'Pending', tone: 'warning' },
  UNAPPROVED: { label: 'Pending', tone: 'warning' },
  SPAM: { label: 'Spam', tone: 'critical' },
  REMOVED: { label: 'Removed', tone: 'neutral' },
};

function ReviewManager() {
  const productId = shopify.data.selected?.[0]?.id;
  const [state, setState] = useState({ loading: true, error: '', articleId: null, handle: '', reviews: [] });
  const [allProducts, setAllProducts] = useState(false);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const p = await gql(`query ($id: ID!) { product(id: $id) { handle } }`, { id: productId });
      const articleId = await findArticle();
      if (!articleId) {
        setState({ loading: false, error: `Blog post "${BLOG_HANDLE}/${ARTICLE_HANDLE}" not found. Create the Reviews blog and the "Product reviews" post first.`, articleId: null, handle: p?.product?.handle || '', reviews: [] });
        return;
      }
      const reviews = await loadComments(articleId);
      setState({ loading: false, error: '', articleId, handle: p?.product?.handle || '', reviews });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: String(e.message || e) }));
    }
  };
  useEffect(() => { load(); }, [productId]);

  const visible = useMemo(() => state.reviews.filter((r) => {
    if (!allProducts && r.handle !== state.handle) return false;
    if (filter === 'pending') return r.status === 'PENDING' || r.status === 'UNAPPROVED';
    if (filter === 'published') return r.status === 'PUBLISHED';
    if (filter === 'spam') return r.status === 'SPAM';
    return true;
  }), [state, allProducts, filter]);

  const mine = state.reviews.filter((r) => r.handle === state.handle);
  const published = mine.filter((r) => r.status === 'PUBLISHED');
  const pendingCount = (allProducts ? state.reviews : mine).filter((r) => r.status === 'PENDING' || r.status === 'UNAPPROVED').length;
  const avg = published.length ? (published.reduce((a, r) => a + r.rating, 0) / published.length).toFixed(1) : null;

  const act = async (review, action) => {
    setBusy(review.id); setNotice('');
    try {
      if (action === 'delete') {
        const d = await gql(`mutation ($id: ID!) { commentDelete(id: $id) { deletedCommentId userErrors { field message } } }`, { id: review.id });
        const errs = d?.commentDelete?.userErrors || [];
        if (errs.length) throw new Error(errs.map((e) => e.message).join('; '));
        setState((s) => ({ ...s, reviews: s.reviews.filter((r) => r.id !== review.id) }));
        setNotice(`Deleted ${review.name}'s review.`);
      } else {
        const field = action === 'approve' ? 'commentApprove' : 'commentSpam';
        const d = await gql(`mutation ($id: ID!) { ${field}(id: $id) { comment { id status } userErrors { field message } } }`, { id: review.id });
        const payload = d?.[field];
        const errs = payload?.userErrors || [];
        if (errs.length) throw new Error(errs.map((e) => e.message).join('; '));
        const status = String(payload?.comment?.status || (action === 'approve' ? 'PUBLISHED' : 'SPAM')).toUpperCase();
        setState((s) => ({ ...s, reviews: s.reviews.map((r) => (r.id === review.id ? { ...r, status } : r)) }));
        setNotice(action === 'approve' ? `Approved ${review.name}'s review. It shows on the store within a couple of minutes.` : `Marked ${review.name}'s review as spam. It is hidden from the store.`);
      }
    } catch (e) {
      setNotice(`Could not update the review: ${e.message || e}`);
    } finally {
      setBusy(''); setConfirmId('');
    }
  };

  const summary = state.loading ? 'Loading…' : `${mine.length} review${mine.length === 1 ? '' : 's'}${pendingCount ? `, ${pendingCount} pending` : ''}`;

  return (
    <s-admin-block heading="Customer reviews" collapsedSummary={summary}>
      <s-stack direction="block" gap="base">
        {state.loading && <s-stack direction="inline" gap="small" alignItems="center"><s-spinner accessibilityLabel="Loading reviews" /><s-text color="subdued">Loading reviews…</s-text></s-stack>}

        {!state.loading && state.error && (
          <s-banner tone="critical" heading="Reviews could not be loaded">
            <s-paragraph>{state.error}</s-paragraph>
            <s-button variant="secondary" onClick={load}>Try again</s-button>
          </s-banner>
        )}

        {!state.loading && !state.error && (
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
              <s-text type="strong">
                {avg ? `★ ${avg} / 5 from ${published.length} published review${published.length === 1 ? '' : 's'}` : 'No published reviews for this product yet'}
              </s-text>
              <s-button variant="tertiary" icon="refresh" onClick={load}>Refresh</s-button>
            </s-stack>

            <s-stack direction="inline" gap="base" alignItems="center">
              <s-select label="Show" value={filter} onChange={(e) => setFilter(e.currentTarget.value)}>
                <s-option value="all">All</s-option>
                <s-option value="pending">Pending approval</s-option>
                <s-option value="published">Published</s-option>
                <s-option value="spam">Spam</s-option>
              </s-select>
              <s-switch label="All products" checked={allProducts} onChange={(e) => setAllProducts(e.currentTarget.checked)} />
            </s-stack>

            {notice && <s-banner tone={notice.startsWith('Could not') ? 'critical' : 'success'} dismissible onDismiss={() => setNotice('')}>{notice}</s-banner>}

            {visible.length === 0 && (
              <s-box padding="base" background="subdued" borderRadius="base">
                <s-text color="subdued">{allProducts ? 'No reviews match this filter.' : 'No reviews for this product match this filter.'}</s-text>
              </s-box>
            )}

            {visible.map((r) => {
              const st = STATUS[r.status] || { label: r.status || 'Unknown', tone: 'neutral' };
              const isPending = r.status === 'PENDING' || r.status === 'UNAPPROVED';
              return (
                <s-box key={r.id} padding="base" border="base" borderRadius="base">
                  <s-stack direction="block" gap="small-200">
                    <s-stack direction="inline" gap="small" alignItems="center" justifyContent="space-between">
                      <s-stack direction="inline" gap="small" alignItems="center">
                        <s-text type="strong">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</s-text>
                        <s-badge tone={st.tone}>{st.label}</s-badge>
                        {!r.rating && <s-badge tone="critical">No rating — not shown on store</s-badge>}
                        {allProducts && <s-badge tone="info">{r.handle || 'untagged'}</s-badge>}
                      </s-stack>
                      <s-text color="subdued">{r.date ? r.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</s-text>
                    </s-stack>
                    {r.title && <s-text type="strong">{r.title}</s-text>}
                    <s-paragraph>{r.body}</s-paragraph>
                    <s-text color="subdued">{r.name}{r.phone ? ` · ${r.phone}` : ''}</s-text>
                    <s-stack direction="inline" gap="small">
                      {r.status !== 'PUBLISHED' && r.rating > 0 && (
                        <s-button variant={isPending ? 'primary' : 'secondary'} loading={busy === r.id} disabled={!!busy} onClick={() => act(r, 'approve')}>Approve</s-button>
                      )}
                      {r.status !== 'SPAM' && (
                        <s-button variant="secondary" disabled={!!busy} onClick={() => act(r, 'spam')}>{r.status === 'PUBLISHED' ? 'Hide (spam)' : 'Spam'}</s-button>
                      )}
                      {confirmId === r.id ? (
                        <>
                          <s-button tone="critical" variant="primary" loading={busy === r.id} disabled={!!busy && busy !== r.id} onClick={() => act(r, 'delete')}>Yes, delete forever</s-button>
                          <s-button variant="tertiary" disabled={!!busy} onClick={() => setConfirmId('')}>Cancel</s-button>
                        </>
                      ) : (
                        <s-button tone="critical" variant="tertiary" icon="delete" disabled={!!busy} onClick={() => setConfirmId(r.id)}>Delete</s-button>
                      )}
                    </s-stack>
                  </s-stack>
                </s-box>
              );
            })}
          </s-stack>
        )}
      </s-stack>
    </s-admin-block>
  );
}
