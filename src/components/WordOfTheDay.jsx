import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export default function WordOfTheDay({ compact = false }) {
    const [wordData, setWordData] = useState({ word: "", meaning: "" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWordOfTheDay = async () => {
            try {
                const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
                const cachedDate = localStorage.getItem("wordOfTheDayDate");
                const cachedWord = localStorage.getItem("wordOfTheDayWord");
                const cachedMeaning = localStorage.getItem("wordOfTheDayMeaning");

                // Use cache if it's the same day
                if (cachedDate === today && cachedWord && cachedMeaning) {
                    setWordData({ word: cachedWord, meaning: cachedMeaning });
                    setLoading(false);
                    return;
                }

                // 1. Fetch random word
                // We fetch multiple to increase chance of finding one in dictionary API
                const randomWordRes = await fetch("https://random-word-api.herokuapp.com/word?number=5");
                const randomWords = await randomWordRes.json();

                let foundValidWord = false;

                // 2. Find meaning from Dictionary API
                for (const word of randomWords) {
                    try {
                        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                        if (dictRes.ok) {
                            const dictData = await dictRes.json();
                            if (dictData && dictData.length > 0 && dictData[0].meanings.length > 0) {
                                const meaning = dictData[0].meanings[0].definitions[0].definition;

                                // Save to state and cache
                                setWordData({ word, meaning });
                                localStorage.setItem("wordOfTheDayDate", today);
                                localStorage.setItem("wordOfTheDayWord", word);
                                localStorage.setItem("wordOfTheDayMeaning", meaning);

                                foundValidWord = true;
                                break; // Stop looking once we find a valid word
                            }
                        }
                    } catch (e) {
                        // Continue to next word if dictionary fetch fails
                    }
                }

                // Fallback if APIs fail entirely
                if (!foundValidWord) {
                    const fallbackWord = "perseverance";
                    const fallbackMeaning = "persistence in doing something despite difficulty or delay in achieving success.";
                    setWordData({ word: fallbackWord, meaning: fallbackMeaning });
                    localStorage.setItem("wordOfTheDayDate", today);
                    localStorage.setItem("wordOfTheDayWord", fallbackWord);
                    localStorage.setItem("wordOfTheDayMeaning", fallbackMeaning);
                }

            } catch (error) {
                console.error("Error fetching word of the day:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWordOfTheDay();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 animate-pulse ps-2 lg:ps-0">
                <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="flex flex-col gap-1 hidden sm:flex">
                    <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-w-0 ps-2 lg:ps-0 py-1">
            <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Word of the Day
                </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
                <span className={`font-black text-slate-800 dark:text-slate-100 capitalize leading-tight ${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>
                    {wordData.word}
                </span>
                <span className={`font-medium text-slate-500 dark:text-slate-400 break-words leading-relaxed w-full ${compact ? 'text-[10px] sm:text-xs line-clamp-1 sm:line-clamp-2' : 'text-xs sm:text-sm'}`}>
                    {wordData.meaning}
                </span>
            </div>
        </div>
    );
}
