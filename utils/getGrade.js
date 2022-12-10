const getGrade = score => {
    if (isNaN(score)) {
        return "F"
    };

    if (score < 40) {
        return "F";
    }
    if (score < 45) {
        return "E";
    }
    if (score < 50) {
        return "D";
    }
    if (score < 60) {
        return "C";
    }
    if (score < 70) {
        return "B";
    } else {
        return "A"
    }
};


module.exports = getGrade;
