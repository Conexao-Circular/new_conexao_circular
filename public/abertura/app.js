// Abertura extraída de conexao-circular-app, commit 8cb6994.
// Os perfis demonstrativos aparecem somente como fallback quando a API pública
// não devolve iniciativas verificadas.
const featuredDemoBusinesses = [
  { id: "demo-mercado", name: "Mercado do Bairro", type: "Mercado", neighborhood: "Icaraí", icon: "🥕", lat: -22.9046, lng: -43.1098, practice: "Valoriza produtores locais e oferece escolhas de menor desperdício.", href: "/loja" },
  { id: "demo-hospedagem", name: "Hospedagem Mar Aberto", type: "Hospedagem", neighborhood: "São Francisco", icon: "🌊", lat: -22.9196, lng: -43.0978, practice: "Apresenta aos visitantes práticas de redução de descartáveis e experiências locais.", href: "/loja" },
  { id: "demo-reparo", name: "Oficina Reparo Vivo", type: "Reparo e reúso", neighborhood: "Centro", icon: "🛠️", lat: -22.8958, lng: -43.1237, practice: "Prolonga a vida útil de objetos por meio de pequenos reparos e orientação.", href: "/loja" },
  { id: "demo-brecho", name: "Brechó Segunda Volta", type: "Moda circular", neighborhood: "Santa Rosa", icon: "🧥", lat: -22.9039, lng: -43.1055, practice: "Promove reúso, troca de histórias e circulação de roupas.", href: "/loja" },
  { id: "demo-composta", name: "Composta Niterói", type: "Compostagem", neighborhood: "Fonseca", icon: "🌱", lat: -22.883, lng: -43.104, practice: "Compartilha informação sobre resíduos orgânicos e soluções locais.", href: "/loja" },
  { id: "demo-atelie", name: "Ateliê Feito de Novo", type: "Artesanato", neighborhood: "Piratininga", icon: "🎨", lat: -22.953, lng: -43.061, practice: "Transforma materiais recuperados em peças autorais.", href: "/loja" },
  { id: "demo-coleta", name: "Coleta Orgânica Itaipu", type: "Parceiro Circular", neighborhood: "Itaipu", icon: "🌿", lat: -22.9708, lng: -43.0487, practice: "Coleta resíduos orgânicos e conecta geradores a soluções de compostagem.", href: "/loja?aba=parceiros" },
  { id: "demo-cooperativa", name: "Cooperativa Rede Verde", type: "Cooperativa", neighborhood: "Centro", icon: "♻️", lat: -22.8954, lng: -43.1241, practice: "Recebe recicláveis secos e fortalece o trabalho e a renda da cadeia da reciclagem.", href: "/loja?aba=parceiros" },
];
let demoBusinesses = featuredDemoBusinesses;
let usingDemoFallback = true;

const state = { view: "home", selectedBusiness: null };
const mapState = { lat: -22.908, lng: -43.105, zoom: 12 };
let userLocation = null;
let activeMapFilter = "Todos";
let leafletMap = null;
let leafletBusinessLayer = null;
let leafletUserLayer = null;
let mapHasFitResults = false;
const leafletMarkers = new Map();
function allBusinesses() { return demoBusinesses; }
async function loadBusinesses() {
  try {
    const response = await fetch("/api/public/map", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("map data unavailable");
    const payload = await response.json();
    const liveBusinesses = Array.isArray(payload.businesses) ? payload.businesses : [];
    demoBusinesses = liveBusinesses.length ? liveBusinesses : featuredDemoBusinesses;
    usingDemoFallback = liveBusinesses.length === 0;
  } catch {
    demoBusinesses = featuredDemoBusinesses;
    usingDemoFallback = true;
  }
}
function track() {}
function go(view) { state.view = view; render(); window.scrollTo({top:0,behavior:"smooth"}); }
function clean(value, max = 240) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}

function safeAttribute(value) {
  return clean(value, 900).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function safeText(value, max = 900) {
  return clean(value, max).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function shell(content, active = state.view) {
  return `
    <div class="shell">
      <header class="topbar">
        <button class="brand" data-go="home" aria-label="Ir para o início">
          <img class="brand-logo" src="/abertura/logo-conexao-circular.png" alt="Conexão Circular" />
        </button>
        <div class="top-actions">
          <a class="pill" href="/login">Entrar</a><a class="pill pilot-link" href="/cadastro">Criar conta</a><a class="pill" href="/agente">Quero ser Agente</a>
        </div>
      </header>
      ${content}
      <nav class="bottom-nav" aria-label="Navegação principal">
        ${navButton("home", navIcons.map, "Mapa", active)}
        <a class="nav-btn" href="/inicio"><span>${navIcons.home}</span><span>Início</span></a>
        <a class="nav-btn" href="/loja"><span>${navIcons.store}</span><span>Loja</span></a>
      </nav>
      <footer class="site-footer-public">
        <div class="site-footer-public-main">
          <div class="site-footer-public-brand"><div class="site-footer-public-brand-lockup"><img class="site-footer-public-logo" src="/abertura/logo-conexao-circular.png" alt="Conexão Circular" /><span>Economia circular feita perto de você.</span></div><p>Conectamos pessoas, negócios e território para escolhas mais conscientes.</p></div>
          <div class="site-footer-public-links">
            <div><b>Explorar</b><a href="/">Mapa circular ↗</a><a href="/loja">Loja ↗</a><a href="/pontos">Pontos ↗</a><a href="/impacto">Impacto ↗</a></div>
            <div><b>Participar</b><a href="/cadastro">Criar conta ↗</a><a href="/agente">Quero ser Agente Circular ↗</a><a href="/login">Entrar ↗</a><a href="/coletas">Solicitar coleta ↗</a></div>
            <div><b>Confiança</b><a href="/privacidade">Privacidade</a><a href="/termos">Termos de uso</a><span>Dados públicos aparecem somente quando aprovados para a rede.</span></div>
          </div>
        </div>
        <div class="site-footer-public-bottom"><span>© ${new Date().getFullYear()} Conexão Circular</span><span>⌖ Niterói e território</span></div>
      </footer>
    </div>`;
}

const navIcons = {
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-4.4 6-10a6 6 0 1 0-12 0c0 5.6 6 10 6 10Z"/><circle cx="12" cy="11" r="2"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-6h6v6"/></svg>',
  store: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16l-1 12H5L4 8Z"/><path d="M3 8 5 3h14l2 5"/><path d="M9 12h6"/></svg>',
};

function navButton(view, icon, label, active) {
  return `<button class="nav-btn ${active === view ? "active" : ""}" data-go="${view}"><span>${icon}</span><span>${label}</span></button>`;
}

function explorerView(active = "home") {
  const businesses = allBusinesses();
  const categoryOrder = ["Alimentação", "Moda, arte e artesanato", "Saúde e bem-estar", "Cultura e eventos", "Turismo e hospedagem", "Reciclagem e sustentabilidade", "Serviços profissionais", "Produtos locais"];
  const types = [...new Set(businesses.map(b => b.type))].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA < 0 ? 99 : indexA) - (indexB < 0 ? 99 : indexB) || a.localeCompare(b, "pt-BR");
  });
  const kindFilters = [
    businesses.some(business => business.kind === "producer") ? { value: "kind:producer", label: "Produtores" } : null,
    businesses.some(business => business.kind === "service_provider") ? { value: "kind:service_provider", label: "Prestadores de serviço" } : null,
  ].filter(Boolean);
  const filters = [
    ...kindFilters,
    ...types.map(type => ({ value: type, label: type })),
  ];
  return shell(`<main class="map-stage view">
    <section class="map-heading">
      <div><span class="eyebrow">Mapa Circular de Niterói</span><h1>Encontre quem resolve sua necessidade circular.</h1><p class="map-agent-cta"><a class="text-button" href="/agente">Quem sou eu? · Quero ser Agente Circular ↗</a></p></div>
      <button class="btn location-btn" data-use-location>⌖ Usar minha localização</button>
    </section>
    <section class="search-panel" aria-label="Buscar iniciativas">
      <label class="map-search"><span>⌕</span><input id="map-search" type="search" placeholder="Busque por bairro, categoria ou iniciativa" autocomplete="off" /></label>
      <div class="map-filters" aria-label="Categorias">
        <button class="pill ${activeMapFilter === "Todos" ? "active" : ""}" data-map-filter="Todos">Todos</button>
        ${filters.map(filter => `<button class="pill ${activeMapFilter === filter.value ? "active" : ""}" data-map-filter="${safeAttribute(filter.value)}">${safeText(filter.label)}</button>`).join("")}
      </div>
    </section>
    <div id="geo-status" class="geo-status" role="status">Mapa centralizado em Niterói. Sua localização só será usada se você autorizar.</div>
    <section class="explore-layout">
      <div class="map-results">
        <div class="results-title"><div><strong id="results-count">${businesses.length} iniciativas para explorar</strong><span>${usingDemoFallback ? "Exemplos para explorar o mapa" : "Perfis verificados e publicados pela rede"}</span></div><a class="text-button" href="/loja">Loja</a></div>
        <div id="map-business-list" class="map-business-list">${businesses.map(mapBusinessRow).join("")}</div>
        <div id="map-empty" class="empty" hidden>Nenhuma iniciativa encontrada com este filtro.</div>
      </div>
      <div class="map-shell">
        <div id="geo-map" class="geo-map" role="application" aria-label="Mapa de iniciativas circulares em Niterói"></div>
        <div class="map-toolbar"><button type="button" data-map-fit>⌗ Ver todos os resultados</button></div>
        <div class="map-legend"><span><i class="legend-dot producer"></i>Produtor</span><span><i class="legend-dot service"></i>Serviço</span><span><i class="legend-dot partner"></i>Parceiro</span></div>
      </div>
    </section>
  </main>`, active);
}

function homeView() { return explorerView("home"); }

function mapBusinessRow(b) {
  const locate = Number.isFinite(b.lat) ? `<button class="map-locate" data-center-business="${safeAttribute(b.id)}" aria-label="Mostrar ${safeAttribute(b.name)} no mapa">⌖</button>` : "";
  const profileLabel = b.id.startsWith("demo-") ? " · Perfil demonstrativo" : b.isApprovedProfile ? " · Perfil verificado" : "";
  const kindLabel = b.kindLabel || (b.kind === "producer" ? "Produtor" : b.kind === "service_provider" ? "Prestador de serviço" : "Parceiro circular");
  const location = b.neighborhood || b.city || "território em revisão";
  const searchTerms = `${b.name} ${b.type} ${kindLabel} ${location} ${b.practice} ${b.searchTerms || ""}`;
  return `<article class="map-business-row" data-map-business="${safeAttribute(b.id)}" data-map-type="${safeAttribute(b.type)}" data-map-kind="${safeAttribute(b.kind || "partner")}" data-map-search="${safeAttribute(clean(searchTerms, 1100).toLowerCase())}"><button class="map-business-main" data-business="${safeAttribute(b.id)}"><span class="map-business-icon">${safeText(b.icon, 4)}</span><span><strong>${safeText(b.name)}</strong><small>${safeText(kindLabel)} · ${safeText(b.type)} • ${safeText(location)}${profileLabel}</small><em>${safeText(b.practice, 260)}</em></span></button>${locate}</article>`;
}

function businessDetailView() {
  const b = allBusinesses().find(item => item.id === state.selectedBusiness);
  if (!b) return homeView();
  return shell(`<main class="stage view">
    <header class="page-head"><span class="eyebrow">${safeText(b.kindLabel || b.type)} • ${safeText(b.neighborhood)}</span><h1>${safeText(b.icon, 4)} ${safeText(b.name)}</h1><p>${safeText(b.practice, 500)}</p></header>
    <div class="grid split-grid">
      <article class="card"><span class="tag">Perfil aprovado</span><h2 style="margin-top:18px">O que esta iniciativa oferece</h2><p>${safeText(b.practice, 500)}</p><a class="card-button" href="${safeAttribute(b.href || "/loja")}">Ver na Loja</a></article>
      <article class="card"><h3>Conexão Circular</h3><p>Esta iniciativa está conectada ao marketplace e aos recursos do PWA.</p><div class="notice">Consulte produtos, serviços e informações disponíveis na Loja.</div></article>
    </div>
  </main>`, "discover");
}
function businessMatchesFilters(business, query = "") {
  const kind = business.kind || "partner";
  const search = clean(`${business.name} ${business.type} ${business.kindLabel || ""} ${business.neighborhood || ""} ${business.practice || ""} ${business.searchTerms || ""}`, 1100).toLowerCase();
  const matchesSelectedFilter = activeMapFilter === "Todos" || (activeMapFilter.startsWith("kind:") ? kind === activeMapFilter.slice(5) : business.type === activeMapFilter);
  return matchesSelectedFilter && (!query || search.includes(query));
}

function filteredBusinesses() {
  const query = clean(document.querySelector("#map-search")?.value, 140).toLowerCase();
  return allBusinesses().filter(business => businessMatchesFilters(business, query));
}

function markerTheme(business) {
  if (business.kind === "producer") return "producer";
  if (business.kind === "service_provider") return "service";
  return "partner";
}

function createPopupContent(business) {
  const popup = document.createElement("article");
  popup.className = "map-popup";

  const eyebrow = document.createElement("span");
  eyebrow.className = "map-popup-type";
  eyebrow.textContent = `${business.kindLabel || "Parceiro circular"} · ${business.type}`;

  const title = document.createElement("strong");
  title.textContent = business.name;

  const location = document.createElement("span");
  location.className = "map-popup-location";
  location.textContent = `⌖ ${business.neighborhood || business.city || "Localização no mapa"}`;

  const action = document.createElement("button");
  action.type = "button";
  action.className = "map-popup-action";
  action.dataset.business = business.id;
  action.textContent = "Ver detalhes";

  popup.append(eyebrow, title, location, action);
  return popup;
}

function focusBusinessOnMap(business) {
  if (!leafletMap || !Number.isFinite(business?.lat) || !Number.isFinite(business?.lng)) return;
  leafletMap.flyTo([business.lat, business.lng], 15, { duration: 0.7 });
  leafletMarkers.get(business.id)?.openPopup();
  document.querySelectorAll("[data-map-business]").forEach(row => row.classList.toggle("is-map-active", row.dataset.mapBusiness === business.id));
}

function fitMapToBusinesses(businesses = filteredBusinesses()) {
  if (!leafletMap || !window.L) return;
  const points = businesses.filter(business => Number.isFinite(business.lat) && Number.isFinite(business.lng)).map(business => [business.lat, business.lng]);
  if (userLocation) points.push([userLocation.lat, userLocation.lng]);
  if (points.length === 0) return;
  if (points.length === 1) return leafletMap.flyTo(points[0], 14, { duration: 0.6 });
  leafletMap.fitBounds(window.L.latLngBounds(points), { padding: [44, 44], maxZoom: 14, animate: true, duration: 0.6 });
}

function renderGeoMap({ fitResults = false } = {}) {
  const mapElement = document.querySelector("#geo-map");
  if (!mapElement) return;
  if (!window.L) {
    mapElement.innerHTML = '<div class="map-unavailable">Não foi possível carregar o mapa interativo. A lista continua disponível.</div>';
    return;
  }

  if (leafletMap && leafletMap.getContainer() !== mapElement) {
    leafletMap.remove();
    leafletMap = null;
    leafletBusinessLayer = null;
    leafletUserLayer = null;
    leafletMarkers.clear();
    mapHasFitResults = false;
  }

  if (!leafletMap) {
    leafletMap = window.L.map(mapElement, {
      center: [mapState.lat, mapState.lng],
      zoom: mapState.zoom,
      zoomControl: true,
      scrollWheelZoom: true,
      touchZoom: true,
      keyboard: true,
      zoomSnap: 0.5,
    });
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(leafletMap);
    window.L.control.scale({ imperial: false, position: "bottomright" }).addTo(leafletMap);
    leafletBusinessLayer = window.L.layerGroup().addTo(leafletMap);
  } else {
    leafletMap.invalidateSize({ pan: false });
  }

  leafletBusinessLayer.clearLayers();
  leafletMarkers.clear();
  const visibleBusinesses = filteredBusinesses();
  visibleBusinesses.filter(business => Number.isFinite(business.lat) && Number.isFinite(business.lng)).forEach(business => {
    const theme = markerTheme(business);
    const icon = window.L.divIcon({
      className: "map-marker-icon",
      html: `<span class="map-marker ${theme}"><span>${safeText(business.icon, 4)}</span><strong>${safeText(business.name, 90)}</strong></span>`,
      iconSize: [44, 52],
      iconAnchor: [22, 48],
      popupAnchor: [0, -46],
    });
    const marker = window.L.marker([business.lat, business.lng], {
      icon,
      title: `${business.name} — ${business.neighborhood || "Localização no mapa"}`,
      keyboard: true,
      riseOnHover: true,
    }).bindPopup(createPopupContent(business), { closeButton: true, minWidth: 210, maxWidth: 280 });
    marker.on("click", () => {
      document.querySelectorAll("[data-map-business]").forEach(row => row.classList.toggle("is-map-active", row.dataset.mapBusiness === business.id));
      document.querySelector(`[data-map-business="${CSS.escape(business.id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    marker.addTo(leafletBusinessLayer);
    leafletMarkers.set(business.id, marker);
  });

  if (leafletUserLayer) leafletUserLayer.remove();
  leafletUserLayer = null;
  if (userLocation) {
    leafletUserLayer = window.L.layerGroup([
      window.L.circle([userLocation.lat, userLocation.lng], { radius: 280, color: "#287bc1", weight: 1, fillColor: "#287bc1", fillOpacity: 0.12 }),
      window.L.circleMarker([userLocation.lat, userLocation.lng], { radius: 9, color: "#ffffff", weight: 4, fillColor: "#287bc1", fillOpacity: 1 }).bindTooltip("Você está aqui", { permanent: false, direction: "top" }),
    ]).addTo(leafletMap);
  }

  if (fitResults || !mapHasFitResults) {
    fitMapToBusinesses(visibleBusinesses);
    mapHasFitResults = true;
  }
}

function distanceInKm(a, b) {
  const radius = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function refreshBusinessDistances() {
  const list = document.querySelector("#map-business-list");
  if (!list || !userLocation) return;
  const businesses = [...allBusinesses()].sort((a, b) => {
    const distanceA = Number.isFinite(a.lat) ? distanceInKm(userLocation, a) : Number.POSITIVE_INFINITY;
    const distanceB = Number.isFinite(b.lat) ? distanceInKm(userLocation, b) : Number.POSITIVE_INFINITY;
    return distanceA - distanceB;
  });
  list.innerHTML = businesses.map(business => {
    const distance = Number.isFinite(business.lat) ? `<b>${distanceInKm(userLocation, business).toFixed(1)} km</b>` : "";
    return mapBusinessRow(business).replace("</small>", ` ${distance}</small>`);
  }).join("");
  applyMapFilters({ fitMap: false });
}

function applyMapFilters({ fitMap = true } = {}) {
  const query = clean(document.querySelector("#map-search")?.value, 140).toLowerCase();
  let visible = 0;
  document.querySelectorAll("[data-map-business]").forEach(row => {
    const matchesSelectedFilter = activeMapFilter === "Todos" || (activeMapFilter.startsWith("kind:") ? row.dataset.mapKind === activeMapFilter.slice(5) : row.dataset.mapType === activeMapFilter);
    const matches = matchesSelectedFilter && (!query || row.dataset.mapSearch.includes(query));
    row.hidden = !matches;
    if (matches) visible += 1;
  });
  const count = document.querySelector("#results-count");
  if (count) count.textContent = `${visible} ${visible === 1 ? "iniciativa encontrada" : "iniciativas encontradas"}`;
  const empty = document.querySelector("#map-empty");
  if (empty) empty.hidden = visible > 0;
  if (leafletMap) renderGeoMap({ fitResults: fitMap });
}

function requestUserLocation() {
  const status = document.querySelector("#geo-status");
  if (!navigator.geolocation) {
    if (status) status.textContent = "Este aparelho não oferece localização. O mapa continua centralizado em Niterói.";
    return;
  }
  if (status) status.textContent = "Buscando sua localização…";
  navigator.geolocation.getCurrentPosition(position => {
    userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
    mapState.lat = userLocation.lat;
    mapState.lng = userLocation.lng;
    mapState.zoom = 14;
    if (status) status.textContent = "Localização usada somente nesta tela. As iniciativas foram ordenadas por proximidade.";
    track("location_authorized");
    renderGeoMap();
    leafletMap?.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.7 });
    refreshBusinessDistances();
  }, () => {
    if (status) status.textContent = "Localização não autorizada. Você ainda pode buscar por bairro ou categoria.";
    track("location_denied");
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
}

function render() { document.querySelector("#app").innerHTML = state.view === "businessDetail" ? businessDetailView() : homeView(); if (document.querySelector("#geo-map")) window.requestAnimationFrame(renderGeoMap); }
document.addEventListener("click", event => {
  const goEl = event.target.closest("[data-go]");
  if (goEl) {
    if (goEl.dataset.go === "business") track("business_started");
    if (goEl.dataset.go === "checkout") track("checkout_started", { businessId: state.pendingBusinessId });
    return go(goEl.dataset.go);
  }
  const business = event.target.closest("[data-business]");
  if (business) { state.selectedBusiness = business.dataset.business; track("business_opened", { businessId: state.selectedBusiness }); return go("businessDetail"); }
  const location = event.target.closest("[data-use-location]");
  if (location) return requestUserLocation();
  const mapFilter = event.target.closest("[data-map-filter]");
  if (mapFilter) {
    activeMapFilter = mapFilter.dataset.mapFilter;
    document.querySelectorAll("[data-map-filter]").forEach(el => el.classList.toggle("active", el === mapFilter));
    applyMapFilters();
    return;
  }
  const centerBusiness = event.target.closest("[data-center-business]");
  if (centerBusiness) {
    const item = allBusinesses().find(businessItem => businessItem.id === centerBusiness.dataset.centerBusiness);
    if (item && Number.isFinite(item.lat)) focusBusinessOnMap(item);
    return;
  }
  const fitMap = event.target.closest("[data-map-fit]");
  if (fitMap) { fitMapToBusinesses(); return; }
});
let filterTimer;
document.addEventListener("input", event => {
  if (event.target.matches("#map-search")) {
    window.clearTimeout(filterTimer);
    filterTimer = window.setTimeout(() => applyMapFilters({ fitMap: true }), 120);
  }
});

let resizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => leafletMap?.invalidateSize({ pan: false }), 120);
});


loadBusinesses().then(render);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", {scope:"/", updateViaCache:"none"}).catch(() => {});
