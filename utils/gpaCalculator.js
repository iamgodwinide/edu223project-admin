const grades = {
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    E: 1,
    F: 0
}


const calculate_gpa = courses => {
    if (courses.length > 0) {
        const totalCredits = courses.reduce((prev, curr) => parseInt(prev) + parseInt(curr.credit), 0);
        const totalPoints = courses.reduce((prev, curr) => prev + (grades[curr.grade] * curr.credit), 0);
        const gpa = (totalPoints / totalCredits).toFixed(2);
        return gpa;
    } else {
        return 0;
    }
}

module.exports = calculate_gpa;