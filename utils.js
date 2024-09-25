function compareSaatAraligi(a, b) {
    const [aStart] = a.split(' - ');
    const [bStart] = b.split(' - ');
    return aStart.localeCompare(bStart);
}

function getYearFromCourseCode(courseCode) {
    const match = courseCode.match(/^[A-Z]+(\d)/);
    return match ? match[1] : null;
}

function saveToLocalStorage(data) {
    localStorage.setItem('dersProgramiData', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('dersProgramiData');
    return data ? JSON.parse(data) : null;
}