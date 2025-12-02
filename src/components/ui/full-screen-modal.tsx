import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const FullScreenModal = DialogPrimitive.Root

const FullScreenModalTrigger = DialogPrimitive.Trigger

const FullScreenModalPortal = DialogPrimitive.Portal

const FullScreenModalClose = DialogPrimitive.Close

const FullScreenModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
FullScreenModalOverlay.displayName = DialogPrimitive.Overlay.displayName

const fullScreenModalContentVariants = cva(
  [
    'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
    'flex flex-col',
    'bg-background',
    'border rounded-lg shadow-lg overflow-hidden',
    'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  ],
  {
    variants: {
      size: {
        sm: 'w-full max-w-md max-h-[85vh]',
        md: 'w-full max-w-lg max-h-[85vh]',
        lg: 'w-full max-w-2xl max-h-[85vh]',
        xl: 'w-full max-w-4xl max-h-[90vh]',
        '2xl': 'w-full max-w-5xl max-h-[90vh]',
        '3xl': 'w-full max-w-6xl max-h-[90vh]',
        full: 'w-[95vw] h-[95vh]',
      },
    },
    defaultVariants: {
      size: 'full',
    },
  }
)

export interface FullScreenModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof fullScreenModalContentVariants> {}

const FullScreenModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  FullScreenModalContentProps
>(({ className, children, size, ...props }, ref) => (
  <FullScreenModalPortal>
    <FullScreenModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(fullScreenModalContentVariants({ size }), className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </FullScreenModalPortal>
))
FullScreenModalContent.displayName = DialogPrimitive.Content.displayName

const FullScreenModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 px-6 py-4 border-b',
      className
    )}
    {...props}
  />
)
FullScreenModalHeader.displayName = 'FullScreenModalHeader'

const FullScreenModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center justify-end space-x-2 px-6 py-4 border-t',
      className
    )}
    {...props}
  />
)
FullScreenModalFooter.displayName = 'FullScreenModalFooter'

const FullScreenModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
))
FullScreenModalTitle.displayName = DialogPrimitive.Title.displayName

const FullScreenModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
FullScreenModalDescription.displayName =
  DialogPrimitive.Description.displayName

const FullScreenModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <ScrollArea className={cn('flex-1 px-6 py-4', className)}>
    {props.children}
  </ScrollArea>
)
FullScreenModalBody.displayName = 'FullScreenModalBody'

export {
  FullScreenModal,
  FullScreenModalPortal,
  FullScreenModalOverlay,
  FullScreenModalClose,
  FullScreenModalTrigger,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalFooter,
  FullScreenModalTitle,
  FullScreenModalDescription,
  FullScreenModalBody,
}
