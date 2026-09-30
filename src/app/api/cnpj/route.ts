import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies BrasilAPI's public CNPJ lookup (Receita Federal data) so the
 * wizard can pre-fill razão social + address on blur without a browser-side
 * CORS request or exposing the upstream directly.
 */
export async function GET(request: NextRequest) {
  const cnpj = (request.nextUrl.searchParams.get("cnpj") ?? "").replace(/\D/g, "");
  if (cnpj.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido." }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      headers: { "User-Agent": "Conexao Circular (contato@conexaocircular.com.br)" },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar o CNPJ agora." }, { status: 502 });
  }

  if (!response.ok) {
    const status = response.status === 404 ? 404 : 502;
    return NextResponse.json(
      { error: status === 404 ? "CNPJ não encontrado na Receita Federal." : "Não foi possível consultar o CNPJ agora." },
      { status },
    );
  }

  const data = await response.json();

  return NextResponse.json({
    razaoSocial: typeof data.razao_social === "string" ? data.razao_social : null,
    cnaeDescricao: typeof data.cnae_fiscal_descricao === "string" ? data.cnae_fiscal_descricao : null,
    address: {
      zip: typeof data.cep === "string" ? data.cep : null,
      street: typeof data.logradouro === "string" ? data.logradouro : null,
      number: typeof data.numero === "string" ? data.numero : null,
      complement: typeof data.complemento === "string" ? data.complemento : null,
      neighborhood: typeof data.bairro === "string" ? data.bairro : null,
      city: typeof data.municipio === "string" ? data.municipio : null,
      state: typeof data.uf === "string" ? data.uf : null,
    },
  });
}
