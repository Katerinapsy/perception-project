// === ΡΥΘΜΙΣΕΙΣ ===
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSc7lPh-y2y4ebC2iv98iGb9pP68thfdENnUtKKU7FvxW4UWP-0FRB2pW3kFTM5Odol__5ay4ZQxRi/pub?gid=334506151&single=true&output=csv";



// Η δομή του Sheet σας:
// 0: Χρονική σήμανση, 1: Φύλο, 2: Ηλικιακή ομάδα, 3: Εκπαιδευτικό επίπεδο,
// 4..11: Εικόνα 1..8  (άρα 0-based indices 4–11)
const IMAGE_FIRST_COL = 4;   // στήλη 5 (= index 4) = Εικόνα 1
const NUM_IMAGES = 8;        // πλήθος εικόνων
const TOP_N = 8;             // πόσες λέξεις δείχνουμε ανά εικόνα
const CANVAS_W = 600, CANVAS_H = 250;

let table;

function preload() {
  table = loadTable(CSV_URL, 'csv', 'header');
}

function setup() {
  // Δεν θέλουμε ένα global canvas — θα φτιάξουμε ένα "τοπικό" για κάθε εικόνα
  noCanvas();

  if (!table) {
    console.warn("Δεν φορτώθηκε ο πίνακας (table). Έλεγξε το CSV_URL.");
    return;
  }

  console.log("Rows:", table.getRowCount(), "Cols:", table.getColumnCount());

  // Για κάθε εικόνα: υπολόγισε και σχεδίασε στο αντίστοιχο container viz1..viz8
  for (let i = 0; i < NUM_IMAGES; i++) {
    const colIndex = IMAGE_FIRST_COL + i;   // 4..11
    const containerId = "viz" + (i + 1);    // viz1..viz8
    drawResultsForImage(colIndex, containerId, i + 1);
  }
}

/**
 * Ζωγραφίζει bar chart για μία στήλη απαντήσεων (μια εικόνα)
 * στο containerId (π.χ. 'viz3'). imageNumber χρησιμοποιείται στον τίτλο.
 */
function drawResultsForImage(colIndex, containerId, imageNumber = null) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Δεν βρέθηκε container #${containerId}. Βεβαιώσου ότι υπάρχει στο index.html.`);
    return;
  }

  // 1) Υπολογισμός συχνοτήτων λέξεων για τη συγκεκριμένη στήλη
  const wordCounts = getWordCountsForColumn(colIndex);

  // 2) Επιλογή top-N λέξεων
  const keys = Object.keys(wordCounts);
  if (keys.length === 0) {
    container.innerHTML = `<div style="padding:8px;color:#666;">Δεν υπάρχουν απαντήσεις για αυτή την εικόνα.</div>`;
    return;
  }
  const sorted = keys.sort((a, b) => wordCounts[b] - wordCounts[a]);
  const top = sorted.slice(0, TOP_N);
  const maxVal = Math.max(...top.map(k => wordCounts[k]));

  // 3) Δημιουργία τοπικού καμβά και σχεδίαση
  const g = createGraphics(CANVAS_W, CANVAS_H);
  g.background(245);

  // Τίτλος
  g.noStroke();
  g.fill(20);
  g.textAlign(g.LEFT, g.TOP);
  g.textSize(16);
  g.text(`Top λέξεις ${imageNumber ? `(Εικόνα ${imageNumber})` : ''}`, 16, 12);

  // Μπάρες
  const margin = 40, barH = 20, gap = 10;
  for (let i = 0; i < top.length; i++) {
    const k = top[i];
    const v = wordCounts[k];
    const x = margin, y = 50 + i * (barH + gap);
    const w = map(v, 0, maxVal, 0, CANVAS_W - margin * 2 - 100);

    g.fill(210);
    g.rect(x, y, CANVAS_W - margin * 2 - 100, barH, 4);
    g.fill(70, 120, 200);
    g.rect(x, y, w, barH, 4);

    g.fill(0);
    g.textAlign(g.LEFT, g.CENTER);
    g.textSize(14);
    g.text(k, x + 5, y + barH / 2);
    g.textAlign(g.RIGHT, g.CENTER);
    g.text(v, CANVAS_W - margin - 10, y + barH / 2);
  }

  // 4) Βάλε το canvas μέσα στο container
  container.innerHTML = "";        // καθάρισε ό,τι είχε
  container.appendChild(g.canvas); // πρόσθεσε το νέο γράφημα
}

/**
 * Επιστρέφει αντικείμενο {λέξη: πλήθος} για τη δοσμένη στήλη colIndex
 */
function getWordCountsForColumn(colIndex) {
  const counts = {};
  for (let r = 0; r < table.getRowCount(); r++) {
    let txt = table.getString(r, colIndex);
    if (!txt) continue;
    txt = normalizeGreek(txt);
    const parts = txt.split(/\s+/);
    for (let w of parts) {
      // καθάρισμα από σύμβολα/στιξη
      w = w.replace(/[^α-ωa-z0-9]/gi, '');
      if (w.length <= 2) continue; // αγνόησε πολύ μικρές λέξεις
      counts[w] = (counts[w] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Μετατρέπει σε πεζά, αφαιρεί τόνους, καθαρίζει στίξη
 */
function normalizeGreek(s) {
  if (!s) return "";
  let out = s.toLowerCase();
  const map = {'ά':'α','έ':'ε','ή':'η','ί':'ι','ό':'ο','ύ':'υ','ώ':'ω','ϊ':'ι','ΐ':'ι','ϋ':'υ','ΰ':'υ'};
  out = out.replace(/[ΆΈΉΊΌΎΏάέήίόύώϊΐϋΰ]/g, m => map[m] || m);
  out = out.replace(/[.,;:!?()«»"'“”–—]/g, ' ');
  return out.trim();
}
