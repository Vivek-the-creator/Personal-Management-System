import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">404</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          The route you requested does not exist yet. Return home and continue exploring the product shell.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link to="/calendar">
              <ArrowLeft className="h-4 w-4" /> Back to Calendar
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
