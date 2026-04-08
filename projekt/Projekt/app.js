const state = { data: null, originalShowInfo: null };

const buildingMap = {
  papiermaschine: 'papiermaschine',
  stoffaufbereitung: 'stoffaufbereitung',
  kraftwerk_soll: 'biomasse',
  kraftwerk_ist: 'biomasse',
  wasser: 'infrastruktur',
  staerke: 'infrastruktur',
  streichmassen: 'infrastruktur',
  altpapierlager: 'stoffaufbereitung',
  chemielager: 'infrastruktur',
  ausruestung: 'infrastruktur'
};

async function init() {
  state.data = await fetch('data.json').then(r => r.json());
  setupNavigation();
  renderIntro();
  renderKpis();
  renderTechnology();
  renderSustainability();
  renderEconomics();
  setupMasterplanBridge();
  document.getElementById('closeDetail').addEventListener('click', () => {
    document.getElementById('detailPanel').classList.remove('open');
  });
}

function setupNavigation() {
  document.querySelectorAll('.main-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.main-nav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.section;
      document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    });
  });

  document.querySelectorAll('.subnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subnav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const frame = document.getElementById('masterplanFrame');
      const tab = btn.dataset.tab;
      if (frame.contentWindow?.setTab) frame.contentWindow.setTab(tab);
    });
  });
}

function renderIntro() {
  const s = document.getElementById('execSummary');
  const pts = [
    'Netto-Produktion steigt von 327,5 auf 512,5 t/d bei parallel reduzierten spezifischen Verbräuchen.',
    'Energiepfad wird auf Biomasse (Konzept 1) umgestellt und entkoppelt den Standort von fossilem Kostenrisiko.',
    'Rohstoffbasis wechselt von Frischfaser auf Recyclingfaser bei gleichzeitiger Produktaufwertung durch Slot-Die-Coating.',
    'Der Umbau kombiniert technische Machbarkeit mit belastbarer Investitionslogik aus Output-, Qualitäts- und OPEX-Wirkung.'
  ];
  s.innerHTML = pts.map(p => `<li>${p}</li>`).join('');
}

function renderKpis() {
  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = state.data.kpi.map(k => {
    const d = ((k.umbau - k.bestand) / k.bestand) * 100;
    const cls = d >= 0 ? 'pos' : 'neg';
    return `<div class="kpi"><h3>${k.label}</h3><p>${fmt(k.bestand)} → ${fmt(k.umbau)} ${k.unit}</p><p class="delta ${cls}">${d >= 0 ? '+' : ''}${d.toFixed(1)} %</p></div>`;
  }).join('');
}

function renderTechnology() {
  const svg = document.getElementById('layerSvg');
  const layers = state.data.productLayers;
  let y = 30;
  svg.innerHTML = layers.map((l, i) => {
    const h = 50;
    const c = i % 2 ? '#dce6f0' : '#dce8df';
    const out = `<rect x="60" y="${y}" width="720" height="${h}" fill="${c}" stroke="#c8d2de"/><text x="80" y="${y + 30}" font-size="16">${l.name} · ${l.value} ${l.unit} · ${l.role}</text>`;
    y += h + 14;
    return out;
  }).join('');

  document.getElementById('coatingGroups').innerHTML = state.data.coatingFunctions.map(c =>
    `<div><h4>${c.group}</h4><p>${c.function}</p><p class="muted">${c.components.join(' · ')}</p></div>`
  ).join('');
}

function renderSustainability() {
  document.getElementById('pcfScope').textContent = state.data.pcf.scope;
  document.getElementById('pcfText').textContent = state.data.pcf.insight;
  document.getElementById('pcfDrivers').innerHTML = state.data.pcf.drivers.map(d => `<span class="pill">${d}</span>`).join('');
  document.getElementById('waterMeasures').innerHTML = state.data.water.measures.map(m => `<li>${m}</li>`).join('');
  document.getElementById('waterMetric').innerHTML = `<h3>Wasserkennzahl</h3><p>${state.data.water.before.toFixed(2)} → ${state.data.water.after.toFixed(2)} ${state.data.water.unit}</p>`;
}

function renderEconomics() {
  document.getElementById('capexBlocks').innerHTML = state.data.economics.capexBlocks.map(c =>
    `<div class="kpi"><h3>${c.name}</h3><p>${c.value.toFixed(1)} ${c.unit}</p></div>`
  ).join('');

  document.getElementById('opexTable').innerHTML = state.data.economics.opexCompare.map(r =>
    `<tr><td>${r.label}</td><td>${r.bestand}</td><td>${r.umbau}</td></tr>`
  ).join('');

  document.getElementById('investmentLogic').textContent = state.data.economics.logic;
}

function setupMasterplanBridge() {
  const frame = document.getElementById('masterplanFrame');
  frame.addEventListener('load', () => {
    const cw = frame.contentWindow;
    if (!cw || !cw.showInfo) return;

    state.originalShowInfo = cw.showInfo.bind(cw);
    cw.showInfo = (key) => {
      state.originalShowInfo(key);
      const mapped = buildingMap[key];
      if (mapped) openDetail(mapped);
    };
  });
}

function openDetail(key) {
  const d = state.data.details[key];
  if (!d) return;
  document.getElementById('detailTitle').textContent = d.title;
  document.getElementById('detailSystem').textContent = d.system;
  document.getElementById('detailChange').textContent = d.change;
  document.getElementById('detailSustainability').textContent = d.sustainability;
  document.getElementById('detailEconomy').textContent = d.economy;

  const main = document.getElementById('detailImageMain');
  main.src = d.image;
  main.style.display = 'block';

  const alt = document.getElementById('detailImageAlt');
  if (d.imageAlt) {
    alt.src = d.imageAlt;
    alt.style.display = 'block';
  } else {
    alt.style.display = 'none';
  }

  document.getElementById('detailPanel').classList.add('open');
}

function fmt(v) {
  return Number(v).toLocaleString('de-DE', { maximumFractionDigits: 2 });
}

init();
