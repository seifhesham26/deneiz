/**
 * Inline bootstrap: applies the persisted theme before first paint so there
 * is no flash of the wrong scheme. Kept tiny on purpose.
 *
 * No cookie is read here: the toggle only ever writes localStorage, so the
 * server branch was always "light" — and awaiting cookies() opted the whole
 * app into dynamic rendering for a value that never varied.
 */
export function ThemeScript() {
  const script = `(function(){try{var s=localStorage.getItem("deneiz-theme");var t=s==="dark"||s==="light"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
