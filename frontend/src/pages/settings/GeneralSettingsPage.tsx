import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function GeneralSettingsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Core language and experience preferences will live here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            General preferences placeholder.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
