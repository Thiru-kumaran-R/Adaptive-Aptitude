import{j as r}from"./query-vendor-DK_LJBGx.js";import{c as i,d as e}from"./index-BMpL5RLw.js";/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=i("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=i("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),y=({id:l,message:a,correlationId:s,onDismiss:t,className:o=""})=>r.jsxs("div",{id:l,role:"alert",className:`${e.errorAlert} ${o}`.trim(),children:[r.jsx(d,{size:20,style:{color:"var(--status-error)",flexShrink:0,marginTop:"2px"},"aria-hidden":"true"}),r.jsxs("div",{style:{flex:1},children:[r.jsx("div",{children:a}),s&&r.jsxs("div",{className:e.errorCorrelation,children:["Ref: ",s]})]}),t&&r.jsx("button",{type:"button",onClick:t,"aria-label":"Dismiss error",className:e.buttonGhost,style:{padding:"2px",borderRadius:"var(--radius-sm)"},children:r.jsx(c,{size:16,"aria-hidden":"true"})})]});export{y as E,c as X};
