/**
 * Tema betikleri — satır içi (inline) gömülür, flash olmadan açık/koyu kutup.
 * Varsayılan: "blueprint" (koyu navy masa). Kullanıcı tercihi: localStorage `aa.theme`.
 * Renk literal'i içermez: `theme-color` meta'sı `--bg` token'ından türetilir.
 */

const boot =
  'try{var s=localStorage.getItem("aa.theme");' +
  'var light=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches;' +
  'var dark=s?s==="dark":!light;' +
  'document.documentElement.classList.toggle("dark",dark);}catch(e){document.documentElement.classList.add("dark");}';

const paint =
  'try{var el=document.documentElement;' +
  'function sync(){var v=getComputedStyle(el).getPropertyValue("--bg").trim();if(!v)return;' +
  'var m=document.querySelector(\'meta[name="theme-color"]\');' +
  'if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m);}' +
  'm.setAttribute("content",v);}' +
  'sync();' +
  'if(window.MutationObserver)new MutationObserver(sync).observe(el,{attributes:true,attributeFilter:["class"]});}catch(e){}';

export const themeBootScript = `(function(){${boot}})();`;
export const themeColorScript = `(function(){${paint}})();`;
