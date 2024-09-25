class Ders {
    constructor(dersData) {
        this.kod = dersData['Ders Kodu'] || '';
        this.ad = dersData['Ders Adı'] || '';
        this.ogretimElemani = dersData['Öğretim Elemanı'] || 'Belirtilmemiş';
        this.kredi = dersData['Kredi'] || '';
        this.gunSaatDerslik = dersData['Gün Saat Derslik'] || '';
        this.teorik = dersData['Teorik'] || '';
        this.uygulama = dersData['Uygulama'] || '';
        this.uzemDersi = dersData['Uzem Dersi'] === 'Evet';
        this.sinif = this.getSinif();
        console.log('Oluşturulan ders:', this.kod, 'Gün Saat Derslik:', this.gunSaatDerslik);
    }

    getSinif() {
        const match = this.kod.match(/^[A-Z]+(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num >= 1000 && num < 2000) return '1';
            if (num >= 2000 && num < 3000) return '2';
            if (num >= 3000 && num < 4000) return '3';
            if (num >= 4000 && num < 5000) return '4';
        }
        return 'Bilinmiyor';
    }

    addAltDers(altDers) {
        this.altDersler.push(altDers);
    }

    hasAltDers() {
        return this.altDersler.length > 0;
    }
}

class AltDers {
    constructor(dersData) {
        this.kod = dersData['Ders Kodu'];
        this.ogretimUyesi = dersData['Öğretim Üyesi'];
        this.gunSaatDerslik = dersData['Gün Saat Derslik'];
    }
}

class DersProgrami {
    constructor() {
        this.program = new Map(); // key: gün-saat, value: Set of AltDers
    }

    addDers(altDers, gun, saat) {
        const key = `${gun}-${saat}`;
        if (!this.program.has(key)) {
            this.program.set(key, new Set());
        }
        this.program.get(key).add(altDers);
    }

    removeDers(altDers, gun, saat) {
        const key = `${gun}-${saat}`;
        if (this.program.has(key)) {
            this.program.get(key).delete(altDers);
            if (this.program.get(key).size === 0) {
                this.program.delete(key);
            }
        }
    }

    getDersler(gun, saat) {
        const key = `${gun}-${saat}`;
        return this.program.has(key) ? Array.from(this.program.get(key)) : [];
    }
}