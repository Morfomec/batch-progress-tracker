export function calculateScore(examStatus, linkedinActivity) {
    let score = 0;

    if (examStatus === "Passed") {
        score += 3;
    }

    if (linkedinActivity === "Posted") {
        score += 3;
    } else if (linkedinActivity === "Commented" || linkedinActivity === "Shared") {
        score += 1;
    }

    return score;
}
