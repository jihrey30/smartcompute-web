import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, Sparkles, TrendingUp, Trophy, Target, Zap } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useConfettiParticles } from '@/hooks/useConfettiParticles';
import { DotsTrack, CondensedTrack } from './MilestoneTracks';

interface MilestoneTrackerProps {
  totalItems: number;
  paidItems: number;
  streak?: number;
  className?: string;
}

export function MilestoneTracker({ totalItems, paidItems, streak = 0, className }: MilestoneTrackerProps) {
  const isComplete = totalItems > 0 && paidItems === totalItems;
  const particles = useConfettiParticles(isComplete);

  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : '';
  const progressPercentage = totalItems > 0 ? (paidItems / totalItems) * 100 : 0;
  const remaining = totalItems - paidItems;

  const MAX_DOTS = 15;
  const useCondensedBar = totalItems > MAX_DOTS;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 pt-16 sm:p-8 shadow-2xl transition-all duration-700 border border-white/5", 
        isComplete ? "ring-2 ring-success/30 shadow-[0_0_50px_rgba(34,197,94,0.15)]" : "shadow-[0_0_40px_rgba(139,92,246,0.08)]",
        className
      )}
      style={{ 
        background: isComplete 
          ? 'linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--success)/0.08) 100%)'
          : 'linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--primary)/0.05) 100%)' 
      }}
    >
      
      {/* Background ambient glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
        {/* Animated Mesh Gradient Background */}
        <div 
          className={cn(
            "absolute top-[-20%] right-[-10%] w-[80%] sm:w-[60%] h-[120%] rounded-full blur-[80px] sm:blur-[100px] opacity-20 transition-colors duration-1000",
            isComplete ? "bg-success" : "bg-primary/80"
          )} 
        />
        <div 
          className={cn(
            "absolute bottom-[-30%] left-[-20%] w-[90%] sm:w-[70%] h-[100%] rounded-full blur-[60px] sm:blur-[80px] opacity-10 transition-colors duration-1000",
            isComplete ? "bg-success" : "bg-secondary/60"
          )} 
        />
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      </div>

      {/* Confetti / Stars for completion */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            {particles.map((p, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  y: "110%", 
                  x: `${p.x}%`,
                  scale: 0 
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  y: ["110%", "-20%"],
                  x: `${p.x}%`,
                  scale: [0, p.scaleMax, 0],
                  rotate: p.rotate
                }}
                transition={{ 
                  duration: p.duration, 
                  repeat: Infinity, 
                  delay: p.delay 
                }}
                className="absolute bottom-0 text-success/50"
              >
                <Sparkles size={p.size} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Right Completion Indicator */}
      <AnimatePresence>
        {isComplete && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2 bg-success/10 backdrop-blur-md border border-success/30 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.15)] overflow-hidden group"
          >
            {/* Shimmer inside the badge */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
            
            <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-success/20 text-success">
              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-success uppercase">
              100% Covered
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-5 mb-6 sm:mb-8">
        <div className="flex gap-4 sm:gap-5 items-start sm:items-center w-full">
          {/* Glassmorphic Icon */}
          <div className={cn(
            "hidden sm:flex flex-shrink-0 w-14 h-14 rounded-2xl items-center justify-center shadow-xl border backdrop-blur-xl relative overflow-hidden",
            isComplete 
              ? "bg-success/20 border-success/30 shadow-success/20 text-success" 
              : "bg-primary/20 border-primary/30 shadow-primary/20 text-primary"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
            {isComplete ? <Trophy className="w-7 h-7 relative z-10" /> : <Target className="w-7 h-7 relative z-10" />}
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <h2 className={cn(
                "text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 sm:mb-3 leading-tight bg-clip-text text-transparent",
                isComplete 
                  ? "bg-gradient-to-r from-foreground via-foreground to-success/80" 
                  : "bg-gradient-to-r from-foreground via-foreground to-primary/80"
              )}>
                {isComplete 
                  ? `You covered every part of this payday${firstName ? `, ${firstName}` : ''}!` 
                  : `Keep going${firstName ? ` ${firstName}` : ''}, on track to cover your payday.`}
              </h2>
              <div className="flex items-center gap-2.5 bg-surface/50 backdrop-blur-md border border-white/5 py-1.5 px-3 rounded-lg w-fit shadow-sm">
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full",
                  isComplete ? "bg-success/20 text-success" : "bg-primary/20 text-primary"
                )}>
                  {isComplete ? <Zap className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                </div>
                <p className="text-foreground/80 text-sm font-medium">
                  {isComplete 
                    ? "Rent, essentials, your future fund—everything has a place. That is a real win." 
                    : <span className="font-semibold">{remaining} {remaining === 1 ? 'item' : 'items'} remaining to cover.</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative z-10 w-full mt-6 mb-6 h-14 flex items-center">
        {useCondensedBar ? (
          <CondensedTrack progressPercentage={progressPercentage} isComplete={isComplete} />
        ) : (
          <DotsTrack totalItems={totalItems} paidItems={paidItems} isComplete={isComplete} />
        )}
      </div>

      {/* Footer Streak */}
      {streak > 0 && (
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 mt-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shadow-md border border-white/10 relative overflow-hidden",
              streak >= 3 ? "bg-gradient-to-br from-orange-400 via-red-500 to-rose-600 text-white" : "bg-surface text-foreground"
            )}>
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
              <TrendingUp className="w-5 h-5 relative z-10" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tighter leading-none">{streak}</div>
              <div className="text-foreground/50 font-bold tracking-widest uppercase text-[10px] mt-1 flex items-center gap-1.5">
                {streak === 1 ? 'Payday' : 'Paydays'} in a row {streak >= 3 && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
              </div>
            </div>
          </div>
          {streak >= 3 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group text-[13px] font-bold text-white transition-all flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              See your streak story 
              <motion.span 
                className="group-hover:translate-x-1 transition-transform"
              >&rarr;</motion.span>
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}
