import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "quiet" | "leaf";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "sm";
  iconOnly?: boolean;
  danger?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "ghost",
  size = "md",
  iconOnly = false,
  danger = false,
  className = "",
  type = "button",
  ...rest
}: Props): ReactNode {
  const classes = [
    "btn",
    `btn--${variant}`,
    size === "sm" && "btn--sm",
    iconOnly && "btn--icon",
    danger && "btn--danger",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={classes} {...rest} />;
}
