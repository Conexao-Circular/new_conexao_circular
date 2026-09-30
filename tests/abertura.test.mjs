import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/abertura/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../public/abertura/index.html', import.meta.url), 'utf8');
const nextConfig = fs.readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');
const geo = source.slice(source.indexOf('function requestUserLocation()'), source.indexOf('function render()'));

function run(geolocation) {
  const status = { textContent: '' };
  const context = {
    navigator: geolocation ? { geolocation } : {},
    document: { querySelector: () => status },
    userLocation: null,
    leafletMap: null,
    mapState: { lat: -22.908, lng: -43.105, zoom: 12 },
    track() {},
    renderGeoMap() { context.rendered = true; },
    refreshBusinessDistances() { context.sorted = true; },
  };
  vm.runInNewContext(`${geo}\nrequestUserLocation();`, context);
  return { context, status };
}

test('localização autorizada centraliza o mapa e reordena por distância', () => {
  const { context, status } = run({ getCurrentPosition(success) {
    success({ coords: { latitude: -22.97, longitude: -43.04 } });
  } });
  assert.equal(context.mapState.lat, -22.97);
  assert.equal(context.mapState.lng, -43.04);
  assert.equal(context.mapState.zoom, 14);
  assert.equal(context.rendered, true);
  assert.equal(context.sorted, true);
  assert.match(status.textContent, /ordenadas por proximidade/);
});

test('localização negada mantém Niterói e a busca manual', () => {
  const { context, status } = run({ getCurrentPosition(_success, failure) { failure(); } });
  assert.equal(context.userLocation, null);
  assert.equal(context.mapState.lat, -22.908);
  assert.equal(context.mapState.zoom, 12);
  assert.match(status.textContent, /buscar por bairro ou categoria/);
});

test('aparelho sem localização mantém a abertura utilizável', () => {
  const { context, status } = run();
  assert.equal(context.userLocation, null);
  assert.match(status.textContent, /mapa continua centralizado em Niterói/);
});

test('links da abertura apontam somente para rotas já existentes do PWA e carregam dados públicos', () => {
  const links = [...source.matchAll(/href="(\/[^"$]*)"/g)].map(match => match[1]);
  const existing = new Set(['/', '/login', '/cadastro', '/agente', '/inicio', '/loja', '/coletas', '/pontos', '/impacto', '/privacidade', '/termos']);
  assert.ok(links.length > 0);
  for (const link of links) assert.ok(existing.has(link), `Rota inesperada: ${link}`);
  assert.match(source, /fetch\("\/api\/public\/map"/);
  assert.doesNotMatch(source, /localStorage/);
});

test('dados reais substituem os exemplos e o mapa oferece filtros úteis', () => {
  assert.match(source, /demoBusinesses = liveBusinesses\.length \? liveBusinesses : featuredDemoBusinesses/);
  assert.doesNotMatch(source, /\[\.\.\.featuredDemoBusinesses,\s*\.\.\./);
  assert.match(source, /kind:producer/);
  assert.match(source, /kind:service_provider/);
  assert.match(source, /id="results-count"/);
  assert.match(source, /window\.L\.map/);
  assert.match(source, /fitMapToBusinesses/);
  assert.match(source, /leafletMap\.flyTo/);
  assert.match(source, /touchZoom: true/);
});

test('mapa é servido na raiz e o endereço antigo redireciona para a URL canônica', () => {
  assert.match(nextConfig, /source: "\/",\s+destination: "\/abertura\/index\.html"/);
  assert.match(nextConfig, /source: "\/abertura\/index\.html",\s+destination: "\/"/);
  assert.match(html, /href="\/abertura\/vendor\/leaflet\/leaflet\.css\?v=1\.9\.4"/);
  assert.match(html, /src="\/abertura\/vendor\/leaflet\/leaflet\.js\?v=1\.9\.4"/);
  assert.match(html, /href="\/abertura\/styles\.css\?v=root-4"/);
  assert.match(html, /src="\/abertura\/app\.js\?v=root-4"/);
  assert.doesNotMatch(source, /href="\/abertura\/index\.html"/);
});
