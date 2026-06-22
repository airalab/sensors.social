var K=Object.defineProperty;var Q=(e,t,o)=>t in e?K(e,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[t]=o;var T=(e,t,o)=>(Q(e,typeof t!="symbol"?t+"":t,o),o);var P=class extends Event{constructor(t,{oldState:o="",newState:r="",...i}={}){super(t,i);T(this,"oldState");T(this,"newState");this.oldState=String(o||""),this.newState=String(r||"")}},W=new WeakMap;function $(e,t,o){W.set(e,setTimeout(()=>{W.has(e)&&e.dispatchEvent(new P("toggle",{cancelable:!1,oldState:t,newState:o}))},0))}var O=globalThis.ShadowRoot||function(){},J=globalThis.HTMLDialogElement||function(){},L=new WeakMap,f=new WeakMap,p=new WeakMap,w=new WeakMap;function A(e){return w.get(e)||"hidden"}var k=new WeakMap;function E(e){return[...e].pop()}function X(e){const t=e.popoverTargetElement;if(!(t instanceof HTMLElement))return;const o=A(t);e.popoverTargetAction==="show"&&o==="showing"||e.popoverTargetAction==="hide"&&o==="hidden"||(o==="showing"?y(t,!0,!0):h(t,!1)&&(k.set(t,e),R(t)))}function h(e,t){return!(e.popover!=="auto"&&e.popover!=="manual"&&e.popover!=="hint"||!e.isConnected||t&&A(e)!=="showing"||!t&&A(e)!=="hidden"||e instanceof J&&e.hasAttribute("open")||document.fullscreenElement===e)}function q(e){if(!e)return 0;const t=f.get(document)||new Set,o=p.get(document)||new Set;return o.has(e)?[...o].indexOf(e)+t.size+1:t.has(e)?[...t].indexOf(e)+1:0}function Y(e){const t=U(e),o=Z(e);return q(t)>q(o)?t:o}function m(e){let t;const o=p.get(e)||new Set,r=f.get(e)||new Set,i=o.size>0?o:r.size>0?r:null;return i?(t=E(i),t.isConnected?t:(i.delete(t),m(e))):null}function z(e){for(const t of e||[])if(!t.isConnected)e.delete(t);else return t;return null}function b(e){return typeof e.getRootNode=="function"?e.getRootNode():e.parentNode?b(e.parentNode):e}function U(e){for(;e;){if(e instanceof HTMLElement&&e.popover==="auto"&&w.get(e)==="showing")return e;if(e=e instanceof Element&&e.assignedSlot||e.parentElement||b(e),e instanceof O&&(e=e.host),e instanceof Document)return}}function Z(e){for(;e;){const t=e.popoverTargetElement;if(t instanceof HTMLElement)return t;if(e=e.parentElement||b(e),e instanceof O&&(e=e.host),e instanceof Document)return}}function _(e,t){const o=new Map;let r=0;for(const u of t||[])o.set(u,r),r+=1;o.set(e,r),r+=1;let i=null;function s(u){if(!u)return;let l=!1,n=null,a=null;for(;!l;){if(n=U(u)||null,n===null||!o.has(n))return;(e.popover==="hint"||n.popover==="auto")&&(l=!0),l||(u=n.parentElement)}a=o.get(n),(i===null||o.get(i)<a)&&(i=n)}return s(e.parentElement||b(e)),i}function ee(e){return e.hidden||e instanceof O||(e instanceof HTMLButtonElement||e instanceof HTMLInputElement||e instanceof HTMLSelectElement||e instanceof HTMLTextAreaElement||e instanceof HTMLOptGroupElement||e instanceof HTMLOptionElement||e instanceof HTMLFieldSetElement)&&e.disabled||e instanceof HTMLInputElement&&e.type==="hidden"||e instanceof HTMLAnchorElement&&e.href===""?!1:typeof e.tabIndex=="number"&&e.tabIndex!==-1}function te(e){if(e.shadowRoot&&e.shadowRoot.delegatesFocus!==!0)return null;let t=e;t.shadowRoot&&(t=t.shadowRoot);let o=t.querySelector("[autofocus]");if(o)return o;{const s=t.querySelectorAll("slot");for(const u of s){const l=u.assignedElements({flatten:!0});for(const n of l){if(n.hasAttribute("autofocus"))return n;if(o=n.querySelector("[autofocus]"),o)return o}}}const r=e.ownerDocument.createTreeWalker(t,NodeFilter.SHOW_ELEMENT);let i=r.currentNode;for(;i;){if(ee(i))return i;i=r.nextNode()}}function oe(e){var t;(t=te(e))==null||t.focus()}var M=new WeakMap;function R(e){if(!h(e,!1))return;const t=e.ownerDocument;if(!e.dispatchEvent(new P("beforetoggle",{cancelable:!0,oldState:"closed",newState:"open"}))||!h(e,!1))return;let o=!1;const r=e.popover;let i=null;const s=_(e,f.get(t)||new Set),u=_(e,p.get(t)||new Set);if(r==="auto"&&(x(p.get(t)||new Set,o,!0),v(s||t,o,!0),i="auto"),r==="hint"&&(u?(v(u,o,!0),i="hint"):(x(p.get(t)||new Set,o,!0),s?(v(s,o,!0),i="auto"):i="hint")),r==="auto"||r==="hint"){if(r!==e.popover||!h(e,!1))return;m(t)||(o=!0),i==="auto"?(f.has(t)||f.set(t,new Set),f.get(t).add(e)):i==="hint"&&(p.has(t)||p.set(t,new Set),p.get(t).add(e))}M.delete(e);const l=t.activeElement;e.classList.add(":popover-open"),w.set(e,"showing"),L.has(t)||L.set(t,new Set),L.get(t).add(e),G(k.get(e),!0),oe(e),o&&l&&e.popover==="auto"&&M.set(e,l),$(e,"closed","open")}function y(e,t=!1,o=!1){var r,i;if(!h(e,!0))return;const s=e.ownerDocument;if(["auto","hint"].includes(e.popover)&&(v(e,t,o),!h(e,!0)))return;const u=f.get(s)||new Set,l=u.has(e)&&E(u)===e;if(G(k.get(e),!1),k.delete(e),o&&(e.dispatchEvent(new P("beforetoggle",{oldState:"open",newState:"closed"})),l&&E(u)!==e&&v(e,t,o),!h(e,!0)))return;(r=L.get(s))==null||r.delete(e),u.delete(e),(i=p.get(s))==null||i.delete(e),e.classList.remove(":popover-open"),w.set(e,"hidden"),o&&$(e,"open","closed");const n=M.get(e);n&&(M.delete(e),t&&n.focus())}function ne(e,t=!1,o=!1){let r=m(e);for(;r;)y(r,t,o),r=m(e)}function x(e,t=!1,o=!1){let r=z(e);for(;r;)y(r,t,o),r=z(e)}function j(e,t,o,r){let i=!1,s=!1;for(;i||!s;){s=!0;let u=null,l=!1;for(const n of t)if(n===e)l=!0;else if(l){u=n;break}if(!u)return;for(;A(u)==="showing"&&t.size;)y(E(t),o,r);t.has(e)&&E(t)!==e&&(i=!0),i&&(r=!1)}}function v(e,t,o){var r,i;const s=e.ownerDocument||e;if(e instanceof Document)return ne(s,t,o);if((r=p.get(s))!=null&&r.has(e)){j(e,p.get(s),t,o);return}x(p.get(s)||new Set,t,o),(i=f.get(s))!=null&&i.has(e)&&j(e,f.get(s),t,o)}var H=new WeakMap;function B(e){if(!e.isTrusted)return;const t=e.composedPath()[0];if(!t)return;const o=t.ownerDocument;if(!m(o))return;const i=Y(t);if(i&&e.type==="pointerdown")H.set(o,i);else if(e.type==="pointerup"){const s=H.get(o)===i;H.delete(o),s&&v(i||o,!1,!0)}}var D=new WeakMap;function G(e,t=!1){if(!e)return;D.has(e)||D.set(e,e.getAttribute("aria-expanded"));const o=e.popoverTargetElement;if(o instanceof HTMLElement&&o.popover==="auto")e.setAttribute("aria-expanded",String(t));else{const r=D.get(e);r?e.setAttribute("aria-expanded",r):e.removeAttribute("aria-expanded")}}var V=globalThis.ShadowRoot||function(){};function re(){return typeof HTMLElement<"u"&&typeof HTMLElement.prototype=="object"&&"popover"in HTMLElement.prototype}function d(e,t,o){const r=e[t];Object.defineProperty(e,t,{value(i){return r.call(this,o(i))}})}var ie=/(^|[^\\]):popover-open\b/g;function ae(){return typeof globalThis.CSSLayerBlockRule=="function"}function se(){const e=ae();return`
${e?"@layer popover-polyfill {":""}
  :where([popover]) {
    position: fixed;
    z-index: 2147483647;
    inset: 0;
    padding: 0.25em;
    width: fit-content;
    height: fit-content;
    border-width: initial;
    border-color: initial;
    border-image: initial;
    border-style: solid;
    background-color: canvas;
    color: canvastext;
    overflow: auto;
    margin: auto;
  }

  :where([popover]:not(.\\:popover-open)) {
    display: none;
  }

  :where(dialog[popover].\\:popover-open) {
    display: block;
  }

  :where(dialog[popover][open]) {
    display: revert;
  }

  :where([anchor].\\:popover-open) {
    inset: auto;
  }

  :where([anchor]:popover-open) {
    inset: auto;
  }

  @supports not (background-color: canvas) {
    :where([popover]) {
      background-color: white;
      color: black;
    }
  }

  @supports (width: -moz-fit-content) {
    :where([popover]) {
      width: -moz-fit-content;
      height: -moz-fit-content;
    }
  }

  @supports not (inset: 0) {
    :where([popover]) {
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  }
${e?"}":""}
`}var g=null;function I(e){const t=se();if(g===null)try{g=new CSSStyleSheet,g.replaceSync(t)}catch{g=!1}if(g===!1){const o=document.createElement("style");o.textContent=t,e instanceof Document?e.head.prepend(o):e.prepend(o)}else e.adoptedStyleSheets=[g,...e.adoptedStyleSheets]}function ue(){if(typeof window>"u")return;window.ToggleEvent=window.ToggleEvent||P;function e(n){return n?.includes(":popover-open")&&(n=n.replace(ie,"$1.\\:popover-open")),n}d(Document.prototype,"querySelector",e),d(Document.prototype,"querySelectorAll",e),d(Element.prototype,"querySelector",e),d(Element.prototype,"querySelectorAll",e),d(Element.prototype,"matches",e),d(Element.prototype,"closest",e),d(DocumentFragment.prototype,"querySelectorAll",e),Object.defineProperties(HTMLElement.prototype,{popover:{enumerable:!0,configurable:!0,get(){if(!this.hasAttribute("popover"))return null;const n=(this.getAttribute("popover")||"").toLowerCase();return n===""||n=="auto"?"auto":n=="hint"?"hint":"manual"},set(n){n===null?this.removeAttribute("popover"):this.setAttribute("popover",n)}},showPopover:{enumerable:!0,configurable:!0,value(n={}){R(this)}},hidePopover:{enumerable:!0,configurable:!0,value(){y(this,!0,!0)}},togglePopover:{enumerable:!0,configurable:!0,value(n={}){return typeof n=="boolean"&&(n={force:n}),w.get(this)==="showing"&&n.force===void 0||n.force===!1?y(this,!0,!0):(n.force===void 0||n.force===!0)&&R(this),w.get(this)==="showing"}}});const t=Element.prototype.attachShadow;t&&Object.defineProperties(Element.prototype,{attachShadow:{enumerable:!0,configurable:!0,writable:!0,value(n){const a=t.call(this,n);return I(a),a}}});const o=HTMLElement.prototype.attachInternals;o&&Object.defineProperties(HTMLElement.prototype,{attachInternals:{enumerable:!0,configurable:!0,writable:!0,value(){const n=o.call(this);return n.shadowRoot&&I(n.shadowRoot),n}}});const r=new WeakMap;function i(n){Object.defineProperties(n.prototype,{popoverTargetElement:{enumerable:!0,configurable:!0,set(a){if(a===null)this.removeAttribute("popovertarget"),r.delete(this);else if(a instanceof Element)this.setAttribute("popovertarget",""),r.set(this,a);else throw new TypeError("popoverTargetElement must be an element or null")},get(){if(this.localName!=="button"&&this.localName!=="input"||this.localName==="input"&&this.type!=="reset"&&this.type!=="image"&&this.type!=="button"||this.disabled||this.form&&this.type==="submit")return null;const a=r.get(this);if(a&&a.isConnected)return a;if(a&&!a.isConnected)return r.delete(this),null;const c=b(this),S=this.getAttribute("popovertarget");return(c instanceof Document||c instanceof V)&&S&&c.getElementById(S)||null}},popoverTargetAction:{enumerable:!0,configurable:!0,get(){const a=(this.getAttribute("popovertargetaction")||"").toLowerCase();return a==="show"||a==="hide"?a:"toggle"},set(a){this.setAttribute("popovertargetaction",a)}}})}i(HTMLButtonElement),i(HTMLInputElement);const s=n=>{if(n.defaultPrevented)return;const a=n.composedPath(),c=a[0];if(!(c instanceof Element)||c?.shadowRoot)return;const S=b(c);if(!(S instanceof V||S instanceof Document))return;const F=a.find(N=>{var C;return(C=N.matches)==null?void 0:C.call(N,"[popovertargetaction],[popovertarget]")});if(F){X(F),n.preventDefault();return}},u=n=>{const a=n.key,c=n.target;!n.defaultPrevented&&c&&(a==="Escape"||a==="Esc")&&v(c.ownerDocument,!0,!0)};(n=>{n.addEventListener("click",s),n.addEventListener("keydown",u),n.addEventListener("pointerdown",B),n.addEventListener("pointerup",B)})(document),I(document)}re()||ue();
