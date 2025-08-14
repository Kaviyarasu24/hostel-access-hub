import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-smooth",
  {
    variants: {
      status: {
        pending: "bg-warning/10 text-warning border border-warning/20",
        approved: "bg-accent/10 text-accent border border-accent/20",
        rejected: "bg-destructive/10 text-destructive border border-destructive/20",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: "pending" | "approved" | "rejected";
}

const StatusBadge = ({ className, status, ...props }: StatusBadgeProps) => {
  return (
    <div
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
};

export { StatusBadge, statusBadgeVariants };