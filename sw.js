if(!self.define){let s,e={};const n=(n,i)=>(n=new URL(n+".js",i).href,e[n]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=n,s.onload=e,document.head.appendChild(s)}else s=n,importScripts(n),e()})).then((()=>{let s=e[n];if(!s)throw new Error(`Module ${n} didn’t register its module`);return s})));self.define=(i,l)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let a={};const o=s=>n(s,r),u={module:{uri:r},exports:a,require:o};e[r]=Promise.all(i.map((s=>u[s]||o(s)))).then((s=>(l(...s),a)))}}define(["./workbox-32a34f02"],(function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"192.png",revision:"c077e8e3713cfb404346e7897c6fe85e"},{url:"256.png",revision:"7269f31dbeca5794e34aa525b9cfe383"},{url:"512.png",revision:"d19974ca79fd176170b76249657c7ab3"},{url:"assets/atc.09cec0ab.png",revision:null},{url:"assets/download_icon.34219614.svg",revision:null},{url:"assets/ekovoz.af7d8a74.png",revision:null},{url:"assets/index.155b3a0d.js",revision:null},{url:"assets/index.e89a339e.css",revision:null},{url:"assets/location-arrow-solid.4871ebf4.svg",revision:null},{url:"assets/msg-air.abb754d3.js",revision:null},{url:"assets/msg-alert.804a179c.png",revision:null},{url:"assets/msg-alert.9404c396.js",revision:null},{url:"assets/msg-fire.faa011b0.js",revision:null},{url:"assets/msg-forest.a623a1f9.js",revision:null},{url:"assets/msg-gank.34a748fe.js",revision:null},{url:"assets/msg-gank.ef47b6e4.png",revision:null},{url:"assets/msg-garbage.b797b882.js",revision:null},{url:"assets/msg-notif.d72c5a6f.js",revision:null},{url:"assets/msg-notif.fbcb8f30.png",revision:null},{url:"assets/msg-parking.5da4fdeb.js",revision:null},{url:"assets/msg-parking.78bf40b4.png",revision:null},{url:"assets/msg-recycle.2ff7eefc.png",revision:null},{url:"assets/msg-recycle.eab79c00.js",revision:null},{url:"assets/msg-text.470fee8d.js",revision:null},{url:"assets/msg-water.b0066085.js",revision:null},{url:"assets/notosans-bold-webfont.b1ab6654.woff2",revision:null},{url:"assets/notosans-regular-webfont.7d4a5d04.woff2",revision:null},{url:"assets/notosansdisplay-black-webfont.9f247781.woff2",revision:null},{url:"assets/notosansdisplay-medium-webfont.5dca4cb1.woff2",revision:null},{url:"assets/sensors-world-app.8a0828bb.png",revision:null},{url:"assets/spinner-solid.7debe01f.svg",revision:null},{url:"assets/sun.d26ef6d1.png",revision:null},{url:"favicon.ico",revision:"bce0d05faf247521df789e2343a107d1"},{url:"icon512_rounded.png",revision:"c3539307f4aab29831b6cb2a94002add"},{url:"index.html",revision:"38a82568e6c54f16cdf10ac310878e5d"},{url:"maskable-icon.png",revision:"0b1dc18370b9d45fbfabd7575ea1330d"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"sensors-world-app.png",revision:"4080ed30224bdbd4648ca4ab3f8819fe"},{url:"maskable-icon.png",revision:"0b1dc18370b9d45fbfabd7575ea1330d"},{url:"icon512_rounded.png",revision:"c3539307f4aab29831b6cb2a94002add"},{url:"512.png",revision:"d19974ca79fd176170b76249657c7ab3"},{url:"256.png",revision:"7269f31dbeca5794e34aa525b9cfe383"},{url:"192.png",revision:"c077e8e3713cfb404346e7897c6fe85e"},{url:"manifest.webmanifest",revision:"81d54066997e8e7c9403719cfec51d46"}],{}),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
