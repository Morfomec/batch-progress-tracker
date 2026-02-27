import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
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
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700 text-center animate-fadeIn">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            Oops! Something went wrong.
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                            We're sorry, but an unexpected error occurred. Don't worry, your data is safe. Try refreshing the page.
                        </p>
                        <p className="text-red-600 dark:text-red-400 font-mono text-sm mb-8 whitespace-pre-wrap text-left break-words">
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.error && this.state.error.stack}
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
