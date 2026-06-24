import { HTMLAttributes, forwardRef } from "react";

type CardVariant = "default" | "premium";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", hover = false, className = "", children, ...rest }, ref) => {
    const base = variant === "premium" ? "card-premium" : "card";
    const hoverClass = hover ? "card-hover" : "";
    const classes = [base, hoverClass, className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
