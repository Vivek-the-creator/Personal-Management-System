import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SearchPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="h-5 w-5" />
          </div>
          <CardTitle>Search</CardTitle>
          <CardDescription>Search across your calendar, notes, and life moments will be polished here later.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            This view is intentionally minimal and ready for future search experiences.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
