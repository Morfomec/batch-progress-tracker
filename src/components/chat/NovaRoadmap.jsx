import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { X, Map, Target, TrendingUp, Sparkles, BookOpen, MessageCircle, Star, Award, Trophy, CheckCircle, Navigation, Info } from 'lucide-react';

const STAGES = [
    {
        id: 'beginner',
        name: 'Beginner',
        minScore: 0,
        maxScore: 39,
        color: 'from-blue-500 to-cyan-400',
        bgGlow: 'bg-blue-500/20',
        textColor: 'text-blue-500',
        icon: BookOpen,
        description: 'Building the foundation. Focus on basic vocabulary and simple sentence structures.',
        evaluation: 'You are starting to grasp basic English concepts, but might struggle with forming complete sentences or understanding native speakers. This is the perfect time to build a strong foundation!',
        milestones: [
            'Learn the 100 most common English words.',
            'Master basic present, past, and future tenses.',
            'Practice introducing yourself and asking simple questions.'
        ]
    },
    {
        id: 'intermediate',
        name: 'Intermediate',
        minScore: 40,
        maxScore: 75,
        color: 'from-emerald-500 to-teal-400',
        bgGlow: 'bg-emerald-500/20',
        textColor: 'text-emerald-500',
        icon: MessageCircle,
        description: 'Growing confidence. Engaging in everyday conversations with fewer hesitations.',
        evaluation: 'You can hold everyday conversations and express your thoughts! You might still make grammatical errors or pause to find the right words, but your communication is becoming much clearer.',
        milestones: [
            'Expand vocabulary with common phrasal verbs and idioms.',
            'Improve listening comprehension by consuming English media.',
            'Practice speaking continuously without pausing for mental translation.'
        ]
    },
    {
        id: 'advanced',
        name: 'Advanced',
        minScore: 76,
        maxScore: 90,
        color: 'from-violet-500 to-purple-400',
        bgGlow: 'bg-violet-500/20',
        textColor: 'text-violet-500',
        icon: Star,
        description: 'Fluid expression. Able to articulate complex thoughts and debate topics smoothly.',
        evaluation: 'Excellent work! You speak smoothly and can handle complex topics. Your grammar is generally solid, but you can still refine your accent and use of nuanced, professional vocabulary.',
        milestones: [
            'Master complex sentence structures (conditionals, passive voice).',
            'Engage in debates and articulate complex arguments confidently.',
            'Focus on reducing accent and improving natural intonation.'
        ]
    },
    {
        id: 'pro',
        name: 'Fluent Pro',
        minScore: 91,
        maxScore: 100,
        color: 'from-amber-500 to-orange-400',
        bgGlow: 'bg-amber-500/20',
        textColor: 'text-amber-500',
        icon: Trophy,
        description: 'Mastery level. Speaking with near-native fluency, perfect grammar, and rich vocabulary.',
        evaluation: 'You command the English language with near-native proficiency! You express yourself effortlessly, accurately, and fluently in almost any situation, professional or casual.',
        milestones: [
            'Maintain language immersion to preserve fluency.',
            'Explore highly specialized or technical vocabulary.',
            'Mentor others in their English journey.'
        ]
    }
];

export default function NovaRoadmap({ isOpen, onClose }) {
    const { user, userProfile } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [averageScore, setAverageScore] = useState(0);

    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, "users", user.uid, "novaHistory"),
                    orderBy("createdAt", "desc")
                );
                const snapshot = await getDocs(q);
                const docs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: typeof doc.data().createdAt?.toDate === 'function' ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now())
                }));
                
                setHistory(docs);

                if (docs.length > 0) {
                    const totalScore = docs.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
                    setAverageScore(Math.round(totalScore / docs.length));
                } else {
                    setAverageScore(0);
                }
            } catch (error) {
                console.error("Error fetching Nova history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [isOpen, user]);

    if (!isOpen) return null;

    const currentStageIndex = STAGES.findIndex(stage => averageScore >= stage.minScore && averageScore <= stage.maxScore);
    const currentStage = STAGES[currentStageIndex !== -1 ? currentStageIndex : 0];

    // Calculate progress to next stage
    let progressToNext = 100;
    let nextStage = null;
    if (currentStageIndex < STAGES.length - 1) {
        nextStage = STAGES[currentStageIndex + 1];
        const stageRange = currentStage.maxScore - currentStage.minScore;
        const scoreIntoStage = averageScore - currentStage.minScore;
        progressToNext = Math.max(0, Math.min(100, (scoreIntoStage / stageRange) * 100));
    }

    const userName = userProfile?.nickName || userProfile?.fullName || user?.displayName || "Student";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-7xl h-[95vh] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-fadeIn">
                
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none transition-colors duration-1000 ${currentStage.bgGlow}`} />
                    
                    <div className="relative z-10 flex items-center gap-4">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentStage.color} text-white shadow-lg`}>
                            <Map className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Your Nova Story</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
                                <Target className="w-4 h-4" /> Comprehensive English Language Evaluation & Roadmap
                            </p>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="relative z-10 p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Evaluating your English proficiency...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        
                        {/* 1. Evaluation Section */}
                        <div className="p-6 lg:p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="max-w-4xl mx-auto text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-6 shadow-sm">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Stage Evaluation</span>
                                </div>
                                
                                <h3 className="text-2xl sm:text-3xl font-medium text-slate-600 dark:text-slate-400 mb-4">
                                    {userName}, based on your history, you are currently at the
                                </h3>
                                
                                <div className={`text-6xl sm:text-7xl font-black bg-gradient-to-r ${currentStage.color} bg-clip-text text-transparent drop-shadow-sm mb-6`}>
                                    {currentStage.name} Stage
                                </div>
                                
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg text-left max-w-3xl mx-auto relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${currentStage.color}`} />
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${currentStage.color} text-white shadow-md flex-shrink-0 mt-1`}>
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Communication Profile</h4>
                                            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                                                {currentStage.evaluation}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Average Score</p>
                                                <p className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                    <Award className={`w-5 h-5 ${currentStage.textColor}`} /> {averageScore}/100
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Sessions</p>
                                                <p className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                    <MessageCircle className="w-5 h-5 text-indigo-500" /> {history.length}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {nextStage && (
                                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex-1 min-w-[250px]">
                                                <div className="flex justify-between items-end mb-2">
                                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Path to <span className={nextStage.textColor}>{nextStage.name}</span></p>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{nextStage.minScore - averageScore} pts to go</p>
                                                </div>
                                                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full bg-gradient-to-r ${currentStage.color} rounded-full transition-all duration-1000`} style={{ width: `${progressToNext}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row min-h-0">
                            {/* 2. Actionable Roadmap Section */}
                            <div className="w-full lg:w-3/5 p-6 lg:p-8 lg:border-r border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                                        <Navigation className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Roadmap to Pro</h3>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Actionable milestones to reach English fluency</p>
                                    </div>
                                </div>

                                <div className="relative pl-6 sm:pl-10 pb-8">
                                    {/* Vertical track */}
                                    <div className="absolute left-6 sm:left-10 top-8 bottom-8 w-1.5 bg-slate-100 dark:bg-slate-800 rounded-full -translate-x-1/2" />
                                    
                                    {/* Fill track */}
                                    <div 
                                        className={`absolute left-6 sm:left-10 bottom-8 w-1.5 bg-gradient-to-t ${currentStage.color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--color-primary),0.5)] -translate-x-1/2`}
                                        style={{ height: currentStageIndex === STAGES.length - 1 ? '100%' : `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
                                    />

                                    <div className="space-y-12">
                                        {STAGES.map((stage, index) => {
                                            const isCompleted = index < currentStageIndex;
                                            const isCurrent = index === currentStageIndex;
                                            const isLocked = index > currentStageIndex;
                                            const StageIcon = stage.icon;

                                            return (
                                                <div key={stage.id} className={`relative ${isLocked ? 'opacity-50' : ''} transition-opacity duration-300`}>
                                                    
                                                    {/* Node */}
                                                    <div className={`absolute left-0 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transform transition-all duration-300 z-10 ${isCurrent ? 'scale-110 shadow-xl border-4' : 'border-2'} ${isCompleted || isCurrent ? `bg-gradient-to-br ${stage.color} text-white` : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                                                         style={isCurrent ? { borderColor: 'var(--bg-white, #fff)' } : {}}>
                                                        <StageIcon className={`w-6 h-6 sm:w-7 sm:h-7 ${isCurrent ? 'animate-pulse' : ''}`} />
                                                    </div>

                                                    {/* Content Card */}
                                                    <div className="pl-10 sm:pl-14">
                                                        <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border ${isCurrent ? `border-indigo-200 dark:border-indigo-500/30 shadow-xl shadow-indigo-500/5` : 'border-slate-200 dark:border-slate-700 shadow-sm'} transition-all`}>
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <h4 className={`text-2xl font-black mb-1 ${isCurrent ? stage.textColor : isCompleted ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                        {stage.name}
                                                                    </h4>
                                                                    <p className={`text-sm font-bold ${isCurrent ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                        Score Goal: {stage.minScore}-{stage.maxScore}
                                                                    </p>
                                                                </div>
                                                                {isCompleted && (
                                                                    <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                                        <CheckCircle className="w-3 h-3" /> Mastered
                                                                    </div>
                                                                )}
                                                                {isCurrent && (
                                                                    <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                                                        In Progress
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="space-y-4">
                                                                <p className="text-slate-600 dark:text-slate-300 font-medium">
                                                                    {stage.description}
                                                                </p>
                                                                
                                                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                        <Target className="w-4 h-4" /> Required Milestones
                                                                    </h5>
                                                                    <ul className="space-y-2">
                                                                        {stage.milestones.map((milestone, idx) => (
                                                                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                                                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isCompleted ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                                                                                <span>{milestone}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* 3. History Feed Section */}
                            <div className="w-full lg:w-2/5 p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Call History</h3>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Your entire timeline of sessions</p>
                                    </div>
                                </div>

                                {history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                                            <MessageCircle className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No history yet</h4>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-[200px] text-sm">Have your first conversation with Nova to begin your journey!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {history.map((call) => (
                                            <div key={call.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-indigo-500" /> 
                                                            {call.createdAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                                        </p>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-lg text-sm font-black ${Number(call.score) >= 75 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : Number(call.score) >= 40 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                                        {call.score}/100
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    {call.summary && (
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                <Target className="w-4 h-4 text-indigo-500" /> AI Feedback
                                                            </h5>
                                                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{call.summary}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {call.transcript && (
                                                        <div>
                                                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">Transcript Snippet</h5>
                                                            <p className="text-slate-500 dark:text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 line-clamp-2">"{call.transcript}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
