# Abertura visual do PWA

A abertura pública apresenta a proposta da Conexão Circular, o mapa de
iniciativas e caminhos de entrada para as jornadas do produto. O mapa utiliza
OpenStreetMap/Leaflet, filtros, busca, zoom, centralização e geolocalização
opcional. As coordenadas da localização do visitante ficam somente na memória
da página.

Os links da abertura usam as rotas existentes `/login`, `/cadastro`, `/loja`,
`/coletas`, `/pontos`, `/impacto`, `/privacidade` e `/termos`. Usuários já
autenticados continuam seguindo de `/` para `/inicio`.

Os dados exibidos no mapa devem ser registros explicitamente publicados. A
abertura não deve expor perfis internos, documentos, credenciais ou dados de
contato que não tenham autorização de publicação.

Catálogo, produtos, carrinho, checkout, pedidos, envios, pagamentos, pontos,
controles de acesso e banco pertencem às jornadas protegidas do produto. O
manifest e o service worker do PWA são mantidos no mesmo aplicativo.

A única correção no CSS da origem faz o atributo `hidden` prevalecer sobre
`display: grid/flex`, para os filtros realmente ocultarem linhas e marcadores.
