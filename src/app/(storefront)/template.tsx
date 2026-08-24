"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * template.tsx remounts on every navigation, giving each storefront page a
 * subtle enter transition without animating the persistent chrome.
 */
export default function StorefrontTemplate({ children }: LayoutProps<"/">) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
