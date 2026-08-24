import { cookies } from "next/headers";

/**
 * Inline bootstrap: applies the persisted theme before first paint so there
 * is no flash of the wrong scheme. Kept tiny on purpose.
 */
export async function ThemeScript() {
  const cookieStore = await cookies();
  // SSR default mirrors the visitor's OS preference; localStorage wins after
  const theme = cookieStore.get("deneiz-theme")?.value === "dark" ? "dark" : "light";

  const script = `(function(){try{var s=localStorage.getItem("deneiz-theme");var t=s==="dark"||s==="light"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"${theme}");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
