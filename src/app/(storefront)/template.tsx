/**
 * template.tsx remounts on every navigation, giving each storefront page a
 * subtle enter transition without animating the persistent chrome.
 *
 * The animation is CSS (see .page-enter in globals.css) rather than
 * framer-motion: a motion wrapper applies its `initial` styles during SSR, so
 * every page was server-rendered at opacity 0 and stayed invisible until the
 * bundle hydrated. CSS animates without JS and honours prefers-reduced-motion.
 */
export default function StorefrontTemplate({ children }: LayoutProps<"/">) {
  return <div className="page-enter">{children}</div>;
}
