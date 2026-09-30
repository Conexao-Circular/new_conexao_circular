import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Conexão Circular",
    short_name: "Conexão Circular",
    description:
      "Conecte-se à economia circular: agende coletas, acumule pontos e compre no marketplace consciente.",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf7f2",
    theme_color: "#364437",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["lifestyle", "shopping", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Nova coleta",
        short_name: "Coleta",
        description: "Agendar uma nova coleta de resíduos",
        url: "/coletas/nova",
      },
      {
        name: "Loja",
        short_name: "Loja",
        description: "Explorar o marketplace consciente",
        url: "/loja",
      },
      {
        name: "Meus pontos",
        short_name: "Pontos",
        description: "Ver saldo e histórico de pontos",
        url: "/pontos",
      },
    ],
  };
}
