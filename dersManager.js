class DersManager {
    constructor() {
        this.dersler = new Map(); // key: ders kodu, value: Ders objesi
        this.dersProgrami = new DersProgrami();
        this.secilenDersler = new Set();
        this.dersRenkleri = new Map();
        this.renkler = [
            '#FFA07A', '#98FB98', '#87CEFA', '#DDA0DD', '#F0E68C',
            '#E6E6FA', '#FFB6C1', '#20B2AA', '#FFA500', '#66CDAA'
        ];
        this.gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        this.dersGruplari = new Map(); // Yeni: Ders gruplarını tutacak
    }

    loadDersler(derslerData) {
        this.dersler.clear();
        this.dersGruplari.clear();
        console.log('Yüklenecek ders sayısı:', derslerData.length);
        derslerData.forEach((dersData, index) => {
            const dersKodu = dersData['Ders Kodu'];
            if (!dersKodu) {
                console.error('Geçersiz ders verisi:', dersData);
                return;
            }
            console.log(`Yüklenen ders ${index + 1}:`, dersKodu);

            const anaDersKodu = dersKodu.split('.')[0];
            const sinif = anaDersKodu.match(/[A-Z]+(\d)/)?.[1] || 'Belirsiz';

            const ders = new Ders(dersData);
            ders.sinif = sinif;

            this.dersler.set(dersKodu, ders);

            // Ders grubuna ekle
            if (!this.dersGruplari.has(anaDersKodu)) {
                this.dersGruplari.set(anaDersKodu, []);
            }
            this.dersGruplari.get(anaDersKodu).push(ders);

            console.log('Yüklenen ders detayları:', {
                kod: ders.kod,
                ad: ders.ad,
                ogretimUyesi: ders.ogretimUyesi,
                gunSaatDerslik: ders.gunSaatDerslik
            });
        });
        console.log('Yüklenen toplam ders sayısı:', this.dersler.size);
        console.log('Oluşturulan ders grubu sayısı:', this.dersGruplari.size);
        this.renderDersListesi();
    }

    ekleDers(ders) {
        const dersKodu = ders.kod;
        if (!this.secilenDersler.has(dersKodu)) {
            this.secilenDersler.add(dersKodu);
            if (!this.dersRenkleri.has(dersKodu)) {
                this.dersRenkleri.set(dersKodu, this.renkler[this.dersRenkleri.size % this.renkler.length]);
            }
        }

        const saatler = this.parseDersSaatleri(ders.gunSaatDerslik);
        if (saatler && saatler.length > 0) {
            saatler.forEach(({ gun, saat }) => {
                this.dersProgrami.addDers(ders, gun, saat);
            });
        } else {
            console.error('Geçersiz ders saati bilgisi:', ders.gunSaatDerslik);
        }

        this.updateUI();
        console.log(`Ders eklendi: ${ders.kod}`);
    }

    silDers(ders) {
        const dersKodu = ders.kod;
        const saatler = this.parseDersSaatleri(ders.gunSaatDerslik);
        saatler.forEach(({ gun, saat }) => {
            this.dersProgrami.removeDers(ders, gun, saat);
        });

        this.secilenDersler.delete(dersKodu);

        this.updateUI();
    }

    parseDersSaatleri(gunSaatDerslik) {
        const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        const saatler = [];

        gunSaatDerslik.split(']').forEach(bilgi => {
            bilgi = bilgi.trim();
            if (!bilgi) return;

            const parcalar = bilgi.split(' ');
            if (parcalar.length < 4) return;

            const gun = parcalar[0];
            const baslangicSaat = parcalar[1];
            const bitisSaat = parcalar[3];

            if (gunler.includes(gun)) {
                saatler.push({
                    gun: gun,
                    saat: `${baslangicSaat}-${bitisSaat}`
                });
            }
        });

        return saatler;
    }

    updateUI() {
        this.updateDersProgrami();
        this.updateSecilenDersler();
    }

    updateDersProgrami() {
        const dersProgramiTable = document.getElementById('dersProgrami');
        // Mevcut içeriği temizle
        while (dersProgramiTable.rows.length > 1) {
            dersProgramiTable.deleteRow(1);
        }

        // Ders programını güncelle
        this.dersProgrami.program.forEach((dersler, key) => {
            const [gun, saat] = key.split('-');
            const row = dersProgramiTable.insertRow();
            const saatCell = row.insertCell();
            saatCell.textContent = saat;

            for (let i = 0; i < this.gunler.length; i++) {
                const cell = row.insertCell();
                if (this.gunler[i] === gun) {
                    const dersAdlari = Array.from(dersler).map(ders => ders.kod);
                    cell.textContent = dersAdlari.join(', ');
                    if (dersAdlari.length > 0) {
                        cell.style.backgroundColor = this.dersRenkleri.get(dersAdlari[0].split('.')[0]);
                    }
                }
            }
        });
    }

    updateSecilenDersler() {
        const secilenDerslerDiv = document.getElementById('secilenDersler');
        secilenDerslerDiv.innerHTML = '';

        this.secilenDersler.forEach(dersKodu => {
            const ders = this.dersler.get(dersKodu);
            const dersElement = document.createElement('span');
            dersElement.className = 'secilen-ders';
            dersElement.textContent = `${ders.kod} - ${ders.ad}`;
            dersElement.style.backgroundColor = this.dersRenkleri.get(dersKodu);

            const silButton = document.createElement('span');
            silButton.className = 'sil-button';
            silButton.textContent = '✕';
            silButton.onclick = () => this.silDers(ders);

            dersElement.appendChild(silButton);
            secilenDerslerDiv.appendChild(dersElement);
        });
    }

    renderDersListesi(filteredDersler = null) {
        const dersListesi = document.getElementById('dersListesi');
        dersListesi.innerHTML = '';

        const dersGruplariToRender = filteredDersler || this.dersGruplari;

        dersGruplariToRender.forEach((dersGrubu, anaDersKodu) => {
            const dersItem = document.createElement('div');
            dersItem.className = 'ders-item';
            const anaDers = dersGrubu[0];
            const dersRengi = this.renkler[this.dersRenkleri.size % this.renkler.length];

            const updateDersItem = (selectedDers) => {
                // Mevcut detay görünürlüğünü sakla
                const isDetailVisible = dersItem.querySelector('.ders-detay')?.style.display === 'block';

                dersItem.innerHTML = `
                    <div class="ders-header">
                        <span class="ders-kodu">${selectedDers.kod}</span>
                        <span class="ders-adi">${selectedDers.ad}</span>
                        <button class="ekle-btn">+</button>
                    </div>
                    <div class="ders-detay" style="display: ${isDetailVisible ? 'block' : 'none'};">
                        <p><strong>Kredi:</strong> ${selectedDers.kredi}</p>
                        <p><strong>Öğretim Elemanı:</strong> ${selectedDers.ogretimElemani}</p>
                        <p><strong>Ders Zamanları:</strong></p>
                        <p>${selectedDers.gunSaatDerslik}</p>
                        ${dersGrubu.length > 1 ? '<div class="alt-dersler"></div>' : ''}
                    </div>
                `;

                const dersHeader = dersItem.querySelector('.ders-header');
                const dersDetay = dersItem.querySelector('.ders-detay');
                const ekleBtn = dersItem.querySelector('.ekle-btn');
                const altDerslerDiv = dersItem.querySelector('.alt-dersler');

                dersHeader.onclick = () => {
                    dersDetay.style.display = dersDetay.style.display === 'none' ? 'block' : 'none';
                };

                ekleBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.ekleDers(selectedDers);
                };

                if (dersGrubu.length > 1 && altDerslerDiv) {
                    altDerslerDiv.innerHTML = ''; // Clear existing buttons
                    dersGrubu.forEach((ders, index) => {
                        const altDersBtn = document.createElement('button');
                        altDersBtn.className = 'alt-ders-btn';
                        if (ders.kod === selectedDers.kod) {
                            altDersBtn.classList.add('active');
                            altDersBtn.style.backgroundColor = dersRengi;
                        }
                        altDersBtn.onclick = (e) => {
                            e.stopPropagation();
                            dersItem.querySelectorAll('.alt-ders-btn').forEach(btn => {
                                btn.classList.remove('active');
                                btn.style.backgroundColor = '';
                            });
                            altDersBtn.classList.add('active');
                            altDersBtn.style.backgroundColor = dersRengi;
                            updateDersItem(ders);
                        };
                        altDerslerDiv.appendChild(altDersBtn);
                    });
                }
            };

            updateDersItem(anaDers);
            dersListesi.appendChild(dersItem);
        });
    }

    filterDersByClass(sinif) {
        if (sinif === 'all') {
            return new Map(this.dersGruplari);
        }
        return new Map(
            Array.from(this.dersGruplari).filter(([_, dersGrubu]) => dersGrubu[0].sinif === sinif)
        );
    }
}

function displayDersListesi(dersler) {
    const dersListesi = document.getElementById('dersListesi');
    dersListesi.innerHTML = '';

    dersler.forEach(ders => {
        const li = document.createElement('li');
        li.textContent = `${ders.ad} (${ders.kod})`;
        li.addEventListener('click', () => toggleDersSelection(ders));
        dersListesi.appendChild(li);
    });
}

function toggleDersSelection(ders) {
    const index = secilenDersler.findIndex(d => d.kod === ders.kod);
    if (index === -1) {
        secilenDersler.push(ders);
    } else {
        secilenDersler.splice(index, 1);
    }
    updateSecilenDersler();
    updateDersProgrami();
}

function updateSecilenDersler() {
    const secilenDerslerContainer = document.getElementById('secilenDersler');
    secilenDerslerContainer.innerHTML = '';

    secilenDersler.forEach(ders => {
        const p = document.createElement('p');
        p.textContent = `${ders.ad} (${ders.kod})`;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Kaldır';
        removeButton.addEventListener('click', () => toggleDersSelection(ders));
        p.appendChild(removeButton);
        secilenDerslerContainer.appendChild(p);
    });
}