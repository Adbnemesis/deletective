// Prevent accidental deployment of development metadata. This is not brand/legal clearance.
const raw=process.env.PUBLIC_SITE_URL;
let origin;
try {origin=new URL(raw);} catch {throw new Error('Set PUBLIC_SITE_URL to your approved HTTPS production origin before deploying.');}
if(origin.protocol!=='https:' || /localhost|127\.0\.0\.1|\.example$|\.test$/.test(origin.hostname) || origin.username || origin.password || origin.search || origin.hash || origin.pathname!=='/') {
  throw new Error('PUBLIC_SITE_URL must be a clean, approved HTTPS origin (no path, credentials, test domain, or query).');
}
console.log('Production origin configuration is present. Confirm launch dependencies in docs/launch-checklist.md before publishing.');
