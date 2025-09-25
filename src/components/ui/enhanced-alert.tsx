import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning:
          "border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-500 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-200",
        success:
          "border-green-500/50 text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-200 dark:border-green-500 [&>svg]:text-green-600 dark:[&>svg]:text-green-200",
        info:
          "border-blue-500/50 text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-500 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface EnhancedAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'success' | 'info'
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  onClose?: () => void
  closeable?: boolean
}

const EnhancedAlert = React.forwardRef<HTMLDivElement, EnhancedAlertProps>(
  ({ className, variant, title, message, type, action, onClose, closeable = false, ...props }, ref) => {
    // Map type to variant if not explicitly set
    const alertVariant = variant || (type === 'error' ? 'destructive' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : type === 'info' ? 'info' : 'default')
    
    const getIcon = () => {
      switch (type || 'error') {
        case 'error':
          return <AlertCircle className="h-4 w-4" />
        case 'warning':
          return <AlertTriangle className="h-4 w-4" />
        case 'success':
          return <CheckCircle2 className="h-4 w-4" />
        case 'info':
          return <Info className="h-4 w-4" />
        default:
          return <AlertCircle className="h-4 w-4" />
      }
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant: alertVariant }), className)}
        {...props}
      >
        {getIcon()}
        {closeable && onClose && (
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div>
          {title && (
            <h5 className="mb-1 font-medium leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-sm [&_p]:leading-relaxed">
            {message}
          </div>
          {action && (
            <div className="mt-3">
              {action.href ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ) : (
                <Button onClick={action.onClick} variant="outline" size="sm">
                  {action.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)
EnhancedAlert.displayName = "EnhancedAlert"

export { EnhancedAlert }