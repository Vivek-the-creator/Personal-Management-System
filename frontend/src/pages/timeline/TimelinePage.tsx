import { motion } from "framer-motion";
import { GitBranch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TimelinePage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GitBranch className="h-5 w-5" />
          </div>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Your personal life timeline will be surfaced here as a focused view.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            Timeline views and life stream experiences will be added in later phases.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
