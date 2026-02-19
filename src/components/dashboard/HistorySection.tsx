import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { fadeInUp } from "@/lib/constants";

interface HistorySectionProps {
  selectedPatient: string | null;
  onSelectPatient: (id: string) => void;
  onViewResults: () => void;
}

const HistorySection = ({ selectedPatient, onSelectPatient, onViewResults }: HistorySectionProps) => {
  return (
    <motion.div {...fadeInUp} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Patient History</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Patient history will be available once Firebase is configured and analyses are saved.
        </p>
      </div>

      <div className="glass-card p-12 text-center">
        <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
          No History Available
        </h3>
        <p className="text-sm text-muted-foreground">
          Complete Firebase setup to enable patient history tracking.
          <br />
          See <code className="rounded bg-muted px-2 py-1 text-xs">backend/FIREBASE_SETUP.md</code> for instructions.
        </p>
      </div>
    </motion.div>
  );
};

export default HistorySection;
