import{j as n}from"./query-vendor-DK_LJBGx.js";import{c as b,d as t}from"./index-BMpL5RLw.js";/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=b("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]),g=({variant:s="primary",size:o="md",isLoading:e=!1,disabled:r=!1,children:a,className:u="",type:l="button",...c})=>{const d=s==="secondary"?t.buttonSecondary:s==="outline"?t.buttonOutline:s==="ghost"?t.buttonGhost:s==="danger"?t.buttonDanger:t.buttonPrimary,m=o==="sm"?t.buttonSm:o==="lg"?t.buttonLg:"";return n.jsxs("button",{type:l,disabled:r||e,className:`${t.button} ${d} ${m} ${u}`.trim(),...c,children:[e&&n.jsx(i,{className:"spinner",size:o==="sm"?14:o==="lg"?20:16,"aria-hidden":"true"}),a]})};export{g as B};
