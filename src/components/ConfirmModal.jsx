import { useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "delete",
    actionButtonText = "Delete",
    actionButtonColor = "bg-rose-600 hover:bg-rose-700"
}) {
    const [inputVal, setInputVal] = useState("");

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (inputVal === confirmText) {
            onConfirm();
            setInputVal("");
        }
    };

    const handleClose = () => {
        setInputVal("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-900/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{description}</p>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Type <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400">{confirmText}</span> to confirm:
                        </p>
                        <input
                            type="text"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            placeholder={confirmText}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-mono"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={inputVal !== confirmText}
                        className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2 transition-all shadow-sm ${inputVal === confirmText
                                ? `${actionButtonColor} cursor-pointer`
                                : "bg-slate-300 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70"
                            }`}
                    >
                        <Check className="w-4 h-4" />
                        {actionButtonText}
                    </button>
                </div>

            </div>
        </div>
    );
}
