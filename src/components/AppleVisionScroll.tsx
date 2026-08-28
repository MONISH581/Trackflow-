import React from "react";
import { motion } from "framer-motion";
import { Cpu, Sparkles, Layers, ArrowDown, Info, CheckCircle2 } from "lucide-react";

interface LabVision {
  desc: string;
  points: string[];
  iconTag: string;
  detailedIntro: string;
}

interface AppleVisionScrollProps {
  officialLabs: string[];
  labVisions: Record<string, LabVision>;
  onSelectLabModal: (labName: string) => void;
  onScrollToAuth: () => void;
}

export const AppleVisionScroll: React.FC<AppleVisionScrollProps> = ({
  officialLabs,
  labVisions,
  onSelectLabModal,
  onScrollToAuth,
}) => {
  return (
    <div className="relative w-full text-slate-800 selection:bg-blue-500 selection:text-white space-y-32 py-20">
      
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center space-y-4 max-w-3xl mx-auto px-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-600 text-xs font-black tracking-[0.25em] uppercase shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span>SEVEN INNOVATION LABORATORIES</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
          Explore Our Laboratories.
        </h2>
        <p className="text-sm md:text-base text-slate-600 font-medium max-w-2xl mx-auto">
          Scroll down naturally to explore each specialized research environment with smooth motion.
        </p>
      </motion.div>

      {/* Separate Full-Width Lab Sections matching Main Page glass-card theme */}
      <div className="space-y-32 px-6 max-w-6xl mx-auto">
        {officialLabs.map((labName, index) => {
          const info = labVisions[labName];
          return (
            <motion.div
              key={labName}
              initial={{ opacity: 0, y: 80, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full glass-card p-8 md:p-12 border border-blue-200/50 shadow-xl relative overflow-hidden text-left bg-white/80 backdrop-blur-xl"
            >
              {/* Subtle Ambient Soft Blue Glow */}
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Lab Header */}
              <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-200/80 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                  <span className="font-extrabold uppercase tracking-widest text-blue-600">
                    LAB 0{index + 1} OF 07 &bull; {info?.iconTag}
                  </span>
                </div>
                <span className="text-slate-400 font-bold uppercase tracking-wider">
                  SRI SHAKTHI LABS
                </span>
              </div>

              {/* Split Content (Left vs Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                {/* Left Column: Title & Intro */}
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-black shadow-sm">
                    <Cpu className="w-6 h-6 text-blue-600" />
                  </div>

                  <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                    {labName}
                  </h3>

                  <p className="text-sm md:text-base text-slate-600 font-normal leading-relaxed">
                    {info?.detailedIntro}
                  </p>

                  <div>
                    <button
                      onClick={() => onSelectLabModal(labName)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer"
                    >
                      <span>Explore Full Vision Modal</span>
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Column: Core Objectives */}
                <div className="space-y-4 bg-slate-50/80 p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-inner">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>CORE OBJECTIVES & VISION</span>
                  </h4>

                  <div className="space-y-3">
                    {info?.points.map((pt, pIdx) => (
                      <motion.div
                        key={pIdx}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 + pIdx * 0.1 }}
                        className="flex items-start gap-3 text-xs text-slate-700 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{pt}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lab Footer */}
              <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Scroll down for next lab</span>
                <button
                  onClick={onScrollToAuth}
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Skip directly to Login</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
