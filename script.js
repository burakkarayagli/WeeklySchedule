const dersManager = new DersManager();

function init() {
    const fileInput = document.getElementById('fileInput');
    const searchInput = document.getElementById('searchInput');
    const classSelect = document.getElementById('classSelect');

    fileInput.addEventListener('change', handleFileUpload);
    searchInput.addEventListener('input', handleSearch);
    classSelect.addEventListener('change', function () {
        const selectedClass = this.value;
        const filteredDersler = dersManager.filterDersByClass(selectedClass);
        dersManager.renderDersListesi(filteredDersler);
    });

    const savedData = loadFromLocalStorage();
    if (savedData) {
        dersManager.loadDersler(savedData);
        dersManager.renderDersListesi();
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        parseExcel(file);
    } else {
        showError('Lütfen bir Excel dosyası seçin.');
    }
}

function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const derslerData = XLSX.utils.sheet_to_json(worksheet);
        console.log('Excel verisi:', derslerData);

        if (derslerData.length === 0) {
            console.error('Excel dosyası boş veya okunamadı');
            return;
        }

        dersManager.loadDersler(derslerData);
        saveToLocalStorage(derslerData);
        dersManager.renderDersListesi();

        console.log('Dersler yüklendi ve liste oluşturuldu');
    };
    reader.readAsArrayBuffer(file);
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredDersGruplari = new Map(
        Array.from(dersManager.dersGruplari).filter(([key, dersGrubu]) =>
            dersGrubu.some(ders =>
                ders.ad.toLowerCase().includes(searchTerm) ||
                ders.kod.toLowerCase().includes(searchTerm)
            )
        )
    );
    dersManager.renderDersListesi(filteredDersGruplari);
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
}

window.addEventListener('load', init);

// Renkleri tanımla
const colors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF",
    "#33FFF5", "#F5FF33", "#FF8C33", "#8C33FF", "#33FF8C"
];

// Ders isimlerine göre renkleri saklamak için bir harita oluştur
const colorMap = new Map();

function getColorForCourse(courseName) {
    if (!colorMap.has(courseName)) {
        // Yeni bir renk ata
        const color = colors[colorMap.size % colors.length];
        colorMap.set(courseName, color);
    }
    return colorMap.get(courseName);
}

// Ders programını oluştururken dersleri renklendir
function renderSchedule(schedule) {
    const table = document.getElementById("dersProgrami");
    // Tabloyu temizle ve başlık satırını oluştur
    table.innerHTML = `
        <tr>
            <th>Saat</th>
            <th>Pazartesi</th>
            <th>Salı</th>
            <th>Çarşamba</th>
            <th>Perşembe</th>
            <th>Cuma</th>
            <th>Cumartesi</th>
            <th>Pazar</th>
        </tr>
    `;

    console.log('Schedule:', schedule);

    // Saatleri ve günleri hizalamak için bir harita oluştur
    const timeMap = new Map();

    schedule.forEach((row) => {
        const time = row[0];
        if (!timeMap.has(time)) {
            timeMap.set(time, Array(8).fill(''));
        }
        row.forEach((cell, cellIndex) => {
            if (cellIndex > 0 && cell) {
                timeMap.get(time)[cellIndex] = cell;
            }
        });
    });

    // Haritayı sıralı bir şekilde tabloya yazdır
    Array.from(timeMap.keys()).sort((a, b) => {
        const [aHour, aMinute] = a.split(':').map(Number);
        const [bHour, bMinute] = b.split(':').map(Number);
        return aHour - bHour || aMinute - bMinute;
    }).forEach((time) => {
        const days = timeMap.get(time);
        const tr = document.createElement("tr");
        const timeTd = document.createElement("td");
        timeTd.textContent = time;
        tr.appendChild(timeTd);

        days.forEach((cell, cellIndex) => {
            const td = document.createElement("td");
            td.textContent = cell;
            if (cellIndex > 0 && cell) { // Ders hücreleri için renklendirme
                const color = getColorForCourse(cell);
                td.style.backgroundColor = color;
                console.log(`Cell [${time}, ${cellIndex}] (${cell}): ${color}`);
            }
            tr.appendChild(td);
        });

        table.appendChild(tr);
    });
}

// Call the function after the table is populated
document.addEventListener('DOMContentLoaded', (event) => {
    // Assuming the table is populated by this point
    console.log('DOMContentLoaded event triggered');
    renderSchedule(dersManager.dersProgrami);
});