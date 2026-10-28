import type { APIRoute } from 'astro';
export const GET: APIRoute = () => {
 const raw=import.meta.env.PUBLIC_SITE_URL||'';let origin='';try{origin=new URL(raw).origin;}catch{}
 const provisional=!origin||/localhost|127\.0\.0\.1/.test(origin);
 return new Response(provisional?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /room\nDisallow: /play\nSitemap: ${origin}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
};
