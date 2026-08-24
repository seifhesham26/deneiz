"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Input } from "./input";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, hint, ...rest }, ref) {
    const { t } = useLang();
    const [visible, setVisible] = useState(false);

    return (
      <Input
        ref={ref}
        label={label}
        error={error}
        hint={hint}
        type={visible ? "text" : "password"}
        dir="ltr"
        trailing={
          <button
            type="button"
            aria-label={visible ? t.common.hidePassword : t.common.showPassword}
            onClick={() => setVisible((value) => !value)}
            className="flex min-h-8 min-w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text-primary"
          >
            {visible ? <EyeOff aria-hidden className="size-4.5" /> : <Eye aria-hidden className="size-4.5" />}
          </button>
        }
        {...rest}
      />
    );
  },
);
