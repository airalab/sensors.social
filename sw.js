if(!self.define){let e,s={};const n=(n,i)=>(n=new URL(n+".js",i).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(i,r)=>{const l=e||("document"in self?document.currentScript.src:"")||location.href;if(s[l])return;let o={};const a=e=>n(e,l),u={module:{uri:l},exports:o,require:a};s[l]=Promise.all(i.map((e=>u[e]||a(e)))).then((e=>(r(...e),o)))}}define(["./workbox-32a34f02"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"app-icon-120.png",revision:"ed33837fa042b725590fde3fe8c86bc5"},{url:"app-icon-192.png",revision:"99fdc63826bee0d9dfa81dbdde81593b"},{url:"app-icon-256.png",revision:"d8aa3b549b97e999d07ec2bce0b351a7"},{url:"app-icon-512-rounded.png",revision:"67c9eb98339ee497d04f7c8f76ce66c7"},{url:"app-icon-512.png",revision:"e395e111321876ac227cd8ca945111d0"},{url:"assets/app-icon-512.a5eb7b3f.png",revision:null},{url:"assets/atc.09cec0ab.png",revision:null},{url:"assets/ekovoz.af7d8a74.png",revision:null},{url:"assets/index.883b555a.js",revision:null},{url:"assets/index.b16d1d6a.css",revision:null},{url:"assets/msg-air.abb754d3.js",revision:null},{url:"assets/msg-alert.804a179c.png",revision:null},{url:"assets/msg-alert.9404c396.js",revision:null},{url:"assets/msg-fire.faa011b0.js",revision:null},{url:"assets/msg-forest.a623a1f9.js",revision:null},{url:"assets/msg-gank.34a748fe.js",revision:null},{url:"assets/msg-gank.ef47b6e4.png",revision:null},{url:"assets/msg-garbage.b797b882.js",revision:null},{url:"assets/msg-notif.d72c5a6f.js",revision:null},{url:"assets/msg-notif.fbcb8f30.png",revision:null},{url:"assets/msg-parking.5da4fdeb.js",revision:null},{url:"assets/msg-parking.78bf40b4.png",revision:null},{url:"assets/msg-recycle.2ff7eefc.png",revision:null},{url:"assets/msg-recycle.eab79c00.js",revision:null},{url:"assets/msg-text.470fee8d.js",revision:null},{url:"assets/msg-water.b0066085.js",revision:null},{url:"assets/notosans-bold-webfont.b1ab6654.woff2",revision:null},{url:"assets/notosans-regular-webfont.7d4a5d04.woff2",revision:null},{url:"assets/notosansdisplay-black-webfont.9f247781.woff2",revision:null},{url:"assets/notosansdisplay-medium-webfont.5dca4cb1.woff2",revision:null},{url:"assets/sensors-world-app.8a0828bb.png",revision:null},{url:"assets/sun.d26ef6d1.png",revision:null},{url:"favicon.ico",revision:"8e319c9cafb31249891540cd51c6e8a0"},{url:"index.html",revision:"7845f291647b5d14b65c3194efb0977e"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"untitled folder/192.png",revision:"c077e8e3713cfb404346e7897c6fe85e"},{url:"untitled folder/256.png",revision:"7269f31dbeca5794e34aa525b9cfe383"},{url:"untitled folder/512.png",revision:"d19974ca79fd176170b76249657c7ab3"},{url:"untitled folder/icon512_rounded.png",revision:"c3539307f4aab29831b6cb2a94002add"},{url:"untitled folder/maskable-icon.png",revision:"0b1dc18370b9d45fbfabd7575ea1330d"},{url:"untitled folder/sensors-world-app.png",revision:"4080ed30224bdbd4648ca4ab3f8819fe"},{url:"app-icon-512.png",revision:"e395e111321876ac227cd8ca945111d0"},{url:"app-icon-512-rounded.png",revision:"67c9eb98339ee497d04f7c8f76ce66c7"},{url:"app-icon-256.png",revision:"d8aa3b549b97e999d07ec2bce0b351a7"},{url:"app-icon-192.png",revision:"99fdc63826bee0d9dfa81dbdde81593b"},{url:"manifest.webmanifest",revision:"b4f201b83436cddd66066a96d15118bb"}],{}),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
