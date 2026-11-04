// Page-view counts with Vercel Web Analytics: no cookies, nothing that identifies a builder, and only
// on the live address, so local copies and previews are never counted.
const LIVE_HOSTS = ['dragonconnectorapp.vercel.app'];

export function startAnalytics(hostname = location.hostname) {
  if (!LIVE_HOSTS.includes(hostname) || document.querySelector('script[data-analytics]')) return false;
  window.va = window.va || function va(...args) { (window.vaq = window.vaq || []).push(args); };
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  script.dataset.analytics = 'vercel';
  document.head.append(script);
  return true;
}
