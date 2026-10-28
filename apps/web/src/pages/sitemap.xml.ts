import type { APIRoute } from 'astro';
import { articles } from '../lib/pages';
export const GET: APIRoute = () => {
 const raw=import.meta.env.PUBLIC_SITE_URL||'';let origin='';try{origin=new URL(raw).origin;}catch{}
 const routes=['/','/daily',...Object.keys(articles).map(s=>`/${s}`)];
 const urls=origin&&!/localhost|127\.0\.0\.1/.test(origin)?routes.map(p=>`<url><loc>${origin.replaceAll('&','&amp;')}${p}</loc></url>`).join(''):'';
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
