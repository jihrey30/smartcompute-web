import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

export function DotsTrack({ totalItems, paidItems, isComplete }: { totalItems: number, paidItems: number, isComplete: boolean }) {
  return (
    <div className="w-full relative flex items-center justify-between px-3">
      {/* Background Track Line (Thicker & Glowing) */}
      <div className="absolute left-3 right-3 h-2 bg-surface-border/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm border border-white/5">
        {/* Animated Progress Fill */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${totalItems > 1 ? (Math.max(0, paidItems - 1) / (totalItems - 1)) * 100 : 100}%` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} 
          className={cn(
            "h-full rounded-full relative overflow-hidden",
            isComplete ? "bg-gradient-to-r from-success/60 to-success" : "bg-gradient-to-r from-primary/60 via-primary to-secondary"
          )}
        >
          {/* Shimmer inside track */}
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[200%] animate-shimmer" />
        </motion.div>
      </div>

      {/* Glowing Path Dots */}
      {Array.from({ length: totalItems }).map((_, i) => {
        const isPaid = i < paidItems;
        const isCurrent = i === paidItems;
        const isLastDot = i === totalItems - 1;
        
        // Define sizes
        const sizeClass = isLastDot && isComplete ? "w-14 h-14" : isCurrent ? "w-7 h-7" : "w-5 h-5";
        
        return (
          <div key={i} className="relative z-10 flex items-center justify-center">
            {/* Pulse effect for the current active dot */}
            {isCurrent && !isComplete && (
              <motion.div 
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute w-12 h-12 rounded-full bg-primary/40 z-0"
              />
            )}
            
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "rounded-full transition-all duration-500 flex items-center justify-center relative",
                sizeClass,
                isPaid 
                  ? (isComplete 
                      ? "bg-gradient-to-br from-success to-emerald-600 shadow-[0_0_20px_rgba(34,197,94,0.7)] z-20 border-[3px] border-background" 
                      : "bg-gradient-to-br from-primary to-purple-600 shadow-[0_0_15px_rgba(139,92,246,0.6)] z-20 border-[3px] border-background") 
                  : isCurrent 
                    ? "bg-surface border-[3px] border-primary shadow-[0_0_10px_rgba(139,92,246,0.4)] z-20"
                    : "bg-surface border-[2px] border-surface-border shadow-sm z-10"
              )}
            >
              {/* Inner glowing dot for paid items */}
              {isPaid && !isComplete && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]" 
                />
              )}
              
              {/* Target checkmark at the end */}
              {isLastDot && isComplete && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring", bounce: 0.6 }}
                >
                  <CheckCircle2 className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                </motion.div>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export function CondensedTrack({ progressPercentage, isComplete }: { progressPercentage: number, isComplete: boolean }) {
  return (
    <div className="w-full relative flex items-center justify-between h-8">
      {/* Background Track */}
      <div className="absolute left-0 right-0 h-full bg-surface-border/40 rounded-full overflow-hidden shadow-inner border border-white/5 backdrop-blur-md">
        {/* Smooth Fill */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "h-full rounded-full relative overflow-hidden shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]",
            isComplete ? "bg-gradient-to-r from-success/80 via-success to-emerald-500" : "bg-gradient-to-r from-primary/80 via-primary to-secondary"
          )}
        >
          {/* Shimmer effect inside the bar */}
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[200%] animate-shimmer" />
        </motion.div>
      </div>
      
      {/* Target Orb at the end */}
      <div className="absolute right-0 flex items-center justify-center z-10 translate-x-2">
        <motion.div 
          animate={isComplete ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className={cn(
            "w-16 h-16 rounded-full border-[5px] border-background transition-all duration-700 flex items-center justify-center",
            isComplete 
              ? "bg-gradient-to-br from-success to-emerald-600 shadow-[0_0_50px_rgba(34,197,94,0.8)] z-20" 
              : "bg-surface border-surface-border z-10 shadow-lg"
          )}
        >
          {isComplete && <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md" />}
        </motion.div>
      </div>
    </div>
  );
}
