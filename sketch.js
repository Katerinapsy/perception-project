
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSc7lPh-y2y4ebC2iv98iGb9pP68thfdENnUtKKU7FvxW4UWP-0FRB2pW3kFTM5Odol__5ay4ZQxRi/pub?gid=334506151&single=true&output=csv";


const FIRST_IMAGE_COL = 4;   
const NUM_IMAGES = 8;
const TOP_N = 10;

let table;


window.onerror = function (msg, src, line, col, err) {
  console.error("🔥 JS Error:", msg, " @", src, ":", line, ":", col, err);
};

console.log("✅ Το sketch.js φορτώθηκε");

function normalizeGreek(s) {
  if (!s) return "";
  let out = s.toLowerCase();
  const map = {
    'ά':'α','έ':'ε','ή':'η','ί':'ι','ό':'ο','ύ':'υ','ώ':'ω',
    'ϊ':'ι','ΐ':'ι','ϋ':'υ','ΰ':'υ'
  };
  out = out.replace(/[ΆΈΉΊΌΎΏάέήίόύώϊΐϋΰ]/g, m => map[m] || m);
  out = out.replace(/[.,;:!?()«»"'“”–—]/g, ' ');
  return out.trim();
}

function ensureContainer(id) {
  let el = document.getElementById(id);
  if (!el) {
    
    el = document.createElement("div");
    el.id = id;
    el.style.margin = "8px 0";
    document.body.appendChild(el);
    console.warn(`ℹ️ Δημιουργήθηκε αυτόματα container #${id} (δεν βρέθηκε στο HTML).`);
  }
  return el;
}


function preload() {
  const url = CSV_URL + "&t=" + Date.now(); 
  table = loadTable(url, "csv", "header");
}

function setup() {
  noCanvas();

  if (!table) {
    console.error("❌ Δεν φορτώθηκε ο πίνακας (table). Έλεγξε το CSV_URL.");
    return;
  }

  console.log("ℹ️ Rows:", table.getRowCount(), "Cols:", table.getColumnCount());


  for (let i = 0; i < NUM_IMAGES; i++) {
    const colIndex = FIRST_IMAGE_COL + i; // 4..11
    const sample = table.getRowCount() > 0 ? table.getString(0, colIndex) : "(no rows)";
    console.log(`🔎 Δείγμα (Εικόνα ${i + 1}, col ${colIndex}):`, sample);
  }

 
  for (let i = 0; i < NUM_IMAGES; i++) {
    const colIndex = FIRST_IMAGE_COL + i;           
    const containerId = "viz" + (i + 1);           
    ensureContainer(containerId);                   
    drawBarsForColumn(colIndex, containerId, i + 1);
  }
}


function drawBarsForColumn(colIndex, containerId, imageNumber) {
  
  const counts = {};
  for (let r = 0; r < table.getRowCount(); r++) {
    let txt = table.getString(r, colIndex);
    if (!txt) continue;
    txt = normalizeGreek(txt);
    const parts = txt.split(/\s+/);
    for (let w of parts) {
      if (w.length <= 2) continue;  
      counts[w] = (counts[w] || 0) + 1;
    }
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`❌ Δεν βρέθηκε container #${containerId}`);
    return;
  }

  
  const keys = Object.keys(counts);
  if (keys.length === 0) {
    container.innerHTML = `<div style="padding:12px;color:#b00;border:1px dashed #b00;">
      ⚠️ Δεν υπάρχουν ακόμη απαντήσεις για την Εικόνα ${imageNumber}.
    </div>`;
    return;
  }

  
  const sorted = keys.sort((a, b) => counts[b] - counts[a]).slice(0, TOP_N);
  const maxVal = Math.max(...sorted.map(k => counts[k]));

 
  const widthC = 700;
  const heightC = 80 + sorted.length * 28;
  const g = createGraphics(widthC, heightC);

  
  g.background(245);
  g.noStroke();
  g.fill(20);
  g.textAlign(g.LEFT, g.TOP);
  g.textSize(16);
  g.text(`Εικόνα ${imageNumber} — Top ${TOP_N} λέξεις`, 16, 12);

  
  const margin = 24, baseW = widthC - margin * 2 - 160; 
  const barH = 18, rowGap = 8;

  for (let i = 0; i < sorted.length; i++) {
    const word = sorted[i];
    const val = counts[word];
    const y = 56 + i * (barH + rowGap);
    const w = map(val, 0, maxVal, 0, baseW);

   
    g.fill(220);
    g.rect(margin, y, baseW, barH, 4);

   
    g.fill(70, 120, 200);
    g.rect(margin, y, w, barH, 4);

    
    g.fill(0);
    g.textAlign(g.LEFT, g.CENTER);
    g.textSize(13);
    g.text(word, margin + baseW + 10, y + barH / 2);   
    g.textAlign(g.RIGHT, g.CENTER);
    g.text(val, margin + Math.max(24, w) - 6, y + barH / 2); 
  }

  
  container.innerHTML = "";
  container.appendChild(g.canvas);


  g.canvas.style.border = "1px solid #000";   
  g.canvas.style.display = "block";
  g.canvas.style.margin = "12px auto";
}
