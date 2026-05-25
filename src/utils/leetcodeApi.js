export const verifyLeetCodeSubmission = async (username, problemUrl) => {
    try {
        if (!username || !problemUrl) {
            throw new Error("Missing username or problem URL");
        }

        // Extract problem slug from URL
        let cleanUrl = problemUrl.split('?')[0]; 
        if (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }
        const parts = cleanUrl.split('/');
        const problemSlug = parts[parts.length - 1];

        if (!problemSlug) {
            throw new Error("Invalid problem URL format");
        }

        let apiAvailable = false;

        // --- API 1: leetcode-api-faisalshohag.vercel.app ---
        try {
            const res1 = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`);
            if (res1.ok) {
                const data1 = await res1.json();
                // Check if the API returned a valid shape
                if (data1 && Array.isArray(data1.recentSubmissions)) {
                    apiAvailable = true;
                    const found = data1.recentSubmissions.find(sub => sub.titleSlug === problemSlug && sub.statusDisplay === "Accepted");
                    if (found) return "VERIFIED";
                    
                    // If we successfully checked their submissions but didn't find it
                    return "UNVERIFIED";
                }
            }
        } catch (e) {
            console.warn("Primary LeetCode API failed:", e);
        }

        // --- API 2: alfa-leetcode-api.onrender.com ---
        if (!apiAvailable) {
            try {
                const res2 = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/acSubmission`);
                if (res2.ok) {
                    const data2 = await res2.json();
                    if (data2 && Array.isArray(data2.submission)) {
                        apiAvailable = true;
                        const found = data2.submission.find(sub => sub.titleSlug === problemSlug);
                        if (found) return "VERIFIED";
                        
                        return "UNVERIFIED";
                    }
                }
            } catch (e) {
                console.warn("Secondary LeetCode API failed:", e);
            }
        }

        // --- FALLBACK: Lenient Verification ---
        // If we reached here, both APIs timed out, crashed, or returned invalid data shapes.
        if (!apiAvailable) {
            console.warn("All LeetCode verification APIs are down. Applying lenient fallback.");
            return "LENIENT";
        }

        return "UNVERIFIED";

    } catch (error) {
        console.error("LeetCode Verification Error:", error);
        throw error; // Only throw for critical internal errors
    }
};
