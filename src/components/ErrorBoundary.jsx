import React from 'react';
import { AlertTriangle, RefreshCcw, Home, MessageCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleRefresh = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen relative flex items-center justify-center p-4 transition-colors duration-300 overflow-hidden bg-slate-50 dark:bg-black">
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                    
                    <div className="relative z-10 max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-slate-200/50 dark:border-white/5 text-center animate-fadeIn">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            Oops! Something went wrong.
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            We're sorry, but an unexpected error occurred. Don't worry, your data is safe. You can try refreshing the page or let us know so we can fix it!
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleRefresh}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <RefreshCcw className="w-5 h-5" />
                                Refresh Page
                            </button>
                            <button
                                onClick={() => {
                                    const errorText = this.state.error ? this.state.error.toString() : "Unknown Error";
                                    const message = `Hi! I encountered a bug in Batch Tracker.%0A%0AError:%0A${errorText}`;
                                    // Make sure to replace YOUR_PHONE_NUMBER below with your actual WhatsApp number including country code (e.g., 919876543210 for India)
                                    window.open(`https://wa.me/+919061752197?text=${message}`, '_blank');
                                }}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-green-200/50 dark:shadow-none hover:shadow-green-300/50 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Let me know (WhatsApp)
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <Home className="w-5 h-5" />
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
