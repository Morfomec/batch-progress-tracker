const getLeetCodeDay = (dateInput) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    const utcMs = d.getTime();
    const istMs = utcMs + (5.5 * 60 * 60 * 1000);
    const shiftedMs = istMs - (6 * 60 * 60 * 1000);
    const shiftedDate = new Date(shiftedMs);
    return `${shiftedDate.getUTCFullYear()}-${String(shiftedDate.getUTCMonth() + 1).padStart(2, '0')}-${String(shiftedDate.getUTCDate()).padStart(2, '0')}`;
};

// Test different hours of June 15, 2026 in IST
console.log("IST Time | Shifted Day");
console.log("-----------------------");
for (let hour = 0; hour < 24; hour++) {
    // 2026-06-15T00:00:00+05:30 corresponds to 2026-06-14T18:30:00Z
    // Let's create a date with specific hour in IST
    const utcHour = hour - 5.5;
    const d = new Date(Date.UTC(2026, 5, 14, 18, 30)); // 00:00 IST
    d.setMilliseconds(d.getMilliseconds() + hour * 60 * 60 * 1000);
    const istString = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    console.log(`${istString.padEnd(25)} -> ${getLeetCodeDay(d)}`);
}
