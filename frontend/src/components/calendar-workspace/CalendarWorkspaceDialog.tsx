import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks";
import type { ReactNode } from "react";

interface CalendarWorkspaceDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function CalendarWorkspaceDialog({
  open,
  title,
  onClose,
  children,
}: CalendarWorkspaceDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[2px]"
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
            className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-auto rounded-t-2xl border border-border/60 bg-card p-5 shadow-2xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
