import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks";
import type { ReactNode } from "react";

interface EventModalDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function EventModalDialog({
  open,
  title,
  onClose,
  children,
}: EventModalDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-0 backdrop-blur-[2px] sm:items-center sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button className="absolute inset-0" type="button" onClick={onClose} aria-label="Close" />
          <motion.div
            initial={isDesktop ? { opacity: 0, scale: 0.96, y: 8 } : { y: "100%" }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.96, y: 8 } : { y: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative z-10 flex max-h-[88vh] sm:max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card p-5 shadow-2xl"
          >
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
