import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active active:scale-[0.97]',
        secondary: 'bg-surface-elevated text-body border border-hairline hover:bg-surface-hover hover:text-ink',
        ghost: 'text-muted hover:text-ink hover:bg-surface-hover',
        destructive: 'bg-error/10 text-error border border-error/25 hover:bg-error/20',
        outline: 'border border-hairline text-body hover:bg-surface-hover hover:text-ink hover:border-hairline-soft',
      },
      size: {
        default: 'h-9 px-4 text-sm rounded-md',
        sm: 'h-7 px-3 text-xs rounded-md',
        lg: 'h-10 px-5 text-sm rounded-lg',
        icon: 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
