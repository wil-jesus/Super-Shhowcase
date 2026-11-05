import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UTApi } from "uploadthing/server";

type MediaType = "IMAGE" | "VIDEO" | "AUDIO";

const ALLOWED_TYPES: Record<MediaType, readonly string[]> = {
  IMAGE: ["image/jpeg", "image/png", "image/webp"],
  VIDEO: ["video/mp4", "video/webm"],
  AUDIO: ["audio/mpeg", "audio/wav"],
} as const;

const MAX_SIZE = {
  IMAGE: 5 * 1024 * 1024,
  VIDEO: 100 * 1024 * 1024,
  AUDIO: 20 * 1024 * 1024,
} as const;

function isMediaType(value: string): value is MediaType {
  return value === "IMAGE" || value === "VIDEO" || value === "AUDIO";
}

// O UploadThing identifica o arquivo pela key, que é o último segmento de https://.../f/<key>.
function fileKeyFromUrl(url: string): string | null {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    return segments.length > 0 ? decodeURIComponent(segments[segments.length - 1]) : null;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const media = await prisma.media.findMany({
    where: { musicianId: params.id },
    select: { id: true, type: true, url: true },
  });

  return NextResponse.json({ data: media });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  console.log(`[media][POST] entrada musicianId=${params.id} content-type=${req.headers.get("content-type")}`);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    console.warn("[media][POST] recusado: não autenticado");
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const musician = await prisma.musician.findUnique({ where: { id: params.id } });
  if (!musician) {
    console.warn(`[media][POST] recusado: músico ${params.id} não encontrado`);
    return NextResponse.json({ error: "Músico não encontrado" }, { status: 404 });
  }

  const isOwner = musician.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    console.warn(`[media][POST] recusado: usuário ${session.user.id} sem permissão`);
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const typeValue = formData.get("type");

    if (!(file instanceof File)) {
      console.warn("[media][POST] recusado: campo 'file' ausente ou inválido");
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }

    console.log(`[media][POST] recebido type=${String(typeValue)} nome=${file.name} mime=${file.type} tamanho=${file.size} bytes`);

    if (typeof typeValue !== "string" || !isMediaType(typeValue)) {
      console.warn("[media][POST] recusado: tipo de mídia inválido");
      return NextResponse.json({ error: "Tipo de mídia inválido" }, { status: 400 });
    }

    if (!ALLOWED_TYPES[typeValue].includes(file.type)) {
      console.warn(`[media][POST] recusado: mime ${file.type} não permitido para ${typeValue}`);
      return NextResponse.json({ error: "Formato de arquivo não permitido" }, { status: 400 });
    }

    if (file.size > MAX_SIZE[typeValue]) {
      console.warn(`[media][POST] recusado: ${file.size} bytes excede o máximo de ${MAX_SIZE[typeValue]}`);
      return NextResponse.json(
        { error: "Arquivo excede o tamanho máximo permitido" },
        { status: 400 }
      );
    }

    if (!process.env.UPLOADTHING_TOKEN) {
      console.error("[media][POST] UPLOADTHING_TOKEN ausente no ambiente: o UploadThing v7 não usa UPLOADTHING_SECRET/APP_ID");
      return NextResponse.json(
        { error: "Falha ao hospedar o arquivo. Verifique a variável UPLOADTHING_TOKEN." },
        { status: 500 }
      );
    }

    // Upload REAL: o arquivo é hospedado no UploadThing e a URL é permanente.
    // A asserção de tipo contorna a tipagem do pacote (que esconde o .data do compilador).
    console.log("[media][POST] enviando ao UploadThing...");
    const utapi = new UTApi();
    const result = (await utapi.uploadFiles(file)) as {
      data?: { url?: string } | null;
      error?: unknown;
    } | null;

    const uploadedUrl = result?.data?.url;

    if (!uploadedUrl) {
      console.error("[media][POST] UploadThing falhou:", result?.error ?? result);
      return NextResponse.json(
        { error: "Falha ao hospedar o arquivo. Verifique a variável UPLOADTHING_TOKEN." },
        { status: 500 }
      );
    }
    console.log(`[media][POST] UploadThing ok url=${uploadedUrl}`);

    const media = await prisma.media.create({
      data: {
        musicianId: params.id,
        type: typeValue,
        url: uploadedUrl,
      },
    });
    console.log(`[media][POST] gravado no banco id=${media.id} musicianId=${media.musicianId} type=${media.type}`);

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error("[media][POST] erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const musician = await prisma.musician.findUnique({ where: { id: params.id } });
  if (!musician) {
    return NextResponse.json({ error: "Músico não encontrado" }, { status: 404 });
  }

  const isOwner = musician.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const mediaId = body?.mediaId;

    if (typeof mediaId !== "string" || !mediaId.trim()) {
      return NextResponse.json({ error: "mediaId obrigatório" }, { status: 400 });
    }

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.musicianId !== params.id) {
      return NextResponse.json({ error: "Mídia não encontrada" }, { status: 404 });
    }

    await prisma.media.delete({ where: { id: media.id } });
    console.log(`[media][DELETE] removido do banco id=${media.id}`);

    // Remove também o arquivo hospedado (best-effort: falha aqui não bloqueia).
    // deleteFiles espera a key do arquivo, não a URL completa.
    const fileKey = fileKeyFromUrl(media.url);
    if (!fileKey) {
      console.warn(`[media][DELETE] não foi possível extrair a key de ${media.url}; arquivo permanece no armazenamento`);
    } else {
      try {
        const utapi = new UTApi();
        const deletion = await utapi.deleteFiles(fileKey);
        console.log(`[media][DELETE] armazenamento key=${fileKey} success=${deletion.success} deletedCount=${deletion.deletedCount}`);
      } catch (storageError) {
        console.warn("[media][DELETE] não foi possível remover o arquivo do armazenamento:", storageError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[media][DELETE] erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}