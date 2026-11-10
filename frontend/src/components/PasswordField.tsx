import { useState, type ComponentProps } from "react";
import { TextField } from "./TextField.tsx";

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, "type" | "trailing">;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="rounded-md px-2.5 py-1.5 text-sm font-bold text-primary hover:bg-paper focus-visible:outline-2 focus-visible:outline-primary"
        >
          {visible ? "Hide" : "Show"}
        </button>
      }
    />
  );
}
