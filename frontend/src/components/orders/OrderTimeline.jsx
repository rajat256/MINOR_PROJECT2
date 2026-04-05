import { memo } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const formatTimelineDate = (value) => {
    if (!value) return "Pending";
    return new Date(value).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const OrderTimeline = ({ updates = [] }) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Timeline</h3>
            <div className="space-y-0">
                {updates.map((step, index) => {
                    const isLast = index === updates.length - 1;

                    return (
                        <div key={`${step.title}-${index}`} className="relative pl-12 pb-7 last:pb-0">
                            {!isLast && (
                                <>
                                    <div className="absolute left-[11px] top-3 bottom-0 w-[2px] bg-slate-200" />
                                    {step.done && (
                                        <motion.div
                                            className="absolute left-[11px] top-3 bottom-0 w-[2px] bg-emerald-400 origin-top"
                                            initial={{ scaleY: 0 }}
                                            animate={{ scaleY: 1 }}
                                            transition={{ duration: 0.35, delay: index * 0.12 }}
                                        />
                                    )}
                                </>
                            )}

                            <motion.div
                                className="absolute left-0 top-0"
                                initial={{ scale: 0.86, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.25, delay: index * 0.08 }}
                            >
                                {step.done ? (
                                    <div className="w-6 h-6 rounded-full border-2 border-emerald-600 bg-emerald-50 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center">
                                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                                    </div>
                                )}
                            </motion.div>

                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className={`text-base font-semibold ${step.done ? "text-slate-900" : "text-slate-400"}`}>
                                        {step.title}
                                    </p>
                                    <p className={`text-sm mt-1 ${step.done ? "text-slate-600" : "text-slate-400"}`}>
                                        {step.description}
                                    </p>
                                </div>
                                <span className={`text-xs font-medium rounded-full px-2 py-1 border ${step.done ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
                                    {formatTimelineDate(step.timestamp)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default memo(OrderTimeline);
