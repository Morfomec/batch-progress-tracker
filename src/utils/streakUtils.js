export const getLeetCodeDay = (dateInput) => {
    let d;
    if (!dateInput) {
        d = new Date();
    } else if (dateInput instanceof Date) {
        d = dateInput;
    } else if (typeof dateInput === 'object' && dateInput.toDate && typeof dateInput.toDate === 'function') {
        d = dateInput.toDate();
    } else if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        d = new Date(dateInput.seconds * 1000 + (dateInput.nanoseconds || 0) / 1000000);
    } else {
        d = new Date(dateInput);
    }

    // get UTC time
    const utcMs = d.getTime();
    if (isNaN(utcMs)) {
        // Fallback to current date if parsing failed
        const now = new Date();
        return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    }

    // add IST offset (5.5 hours)
    const istMs = utcMs + (5.5 * 60 * 60 * 1000);
    // subtract 6 hours to shift the day boundary to 6:00 AM IST
    const shiftedMs = istMs - (6 * 60 * 60 * 1000);
    
    const shiftedDate = new Date(shiftedMs);
    
    // We only care about the UTC year/month/date of this shifted time
    return `${shiftedDate.getUTCFullYear()}-${String(shiftedDate.getUTCMonth() + 1).padStart(2, '0')}-${String(shiftedDate.getUTCDate()).padStart(2, '0')}`;
};

export const calculateNewStreak = (currentStreak, lastSolveIsoString) => {
    if (!lastSolveIsoString || currentStreak === 0) {
        return { newStreak: 1, isBroken: false, isAlreadySolvedToday: false };
    }

    const todayDay = getLeetCodeDay(new Date());
    const lastDay = getLeetCodeDay(lastSolveIsoString);

    if (todayDay === lastDay) {
        return { newStreak: currentStreak, isBroken: false, isAlreadySolvedToday: true };
    }

    const todayDate = new Date(todayDay);
    const lastDate = new Date(lastDay);
    const diffTime = Math.abs(todayDate - lastDate);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return { newStreak: currentStreak + 1, isBroken: false, isAlreadySolvedToday: false };
    } else {
        return { newStreak: 1, isBroken: true, isAlreadySolvedToday: false };
    }
};

export const isStreakBroken = (currentStreak, lastSolveIsoString) => {
    if (currentStreak === 0) return false;
    if (!lastSolveIsoString) return true; // Has streak but no solve date => broken

    // Parse the date to verify validity
    let d;
    if (lastSolveIsoString instanceof Date) {
        d = lastSolveIsoString;
    } else if (typeof lastSolveIsoString === 'object' && lastSolveIsoString.toDate && typeof lastSolveIsoString.toDate === 'function') {
        d = lastSolveIsoString.toDate();
    } else if (typeof lastSolveIsoString === 'object' && lastSolveIsoString.seconds !== undefined) {
        d = new Date(lastSolveIsoString.seconds * 1000 + (lastSolveIsoString.nanoseconds || 0) / 1000000);
    } else {
        d = new Date(lastSolveIsoString);
    }

    if (isNaN(d.getTime())) {
        return true; // Invalid date format => broken
    }

    const todayDay = getLeetCodeDay(new Date());
    const lastDay = getLeetCodeDay(lastSolveIsoString);

    const todayDate = new Date(todayDay);
    const lastDate = new Date(lastDay);
    const diffTime = Math.abs(todayDate - lastDate);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 1;
};
