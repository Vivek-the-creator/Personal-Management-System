import { motion } from "framer-motion";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { useDocumentTitle } from "@/hooks";

export function CalendarsPage() {
  useDocumentTitle("Calendar — Chronicle");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <MonthCalendar />
    </motion.div>
  );
}
