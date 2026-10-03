import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
    const formData = await req.formData();
    const file = formData.get("file");
    const typeValue = formData.get("type");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }

    if (typeof typeValue !== "string" || !isMediaType(typeValue)) {
      return NextResponse.json({ error: "Tipo de mídia inválido" }, { status: 400 });
    }

    if (!ALLOWED_TYPES[typeValue].includes(file.type)) {
      return NextResponse.json({ error: "Formato de arquivo não permitido" }, { status: 400 });
    }

    if (file.size > MAX_SIZE[typeValue]) {
      return NextResponse.json(
        { error: "Arquivo excede o tamanho máximo permitido" },
        { status: 400 }
      );
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const media = await prisma.media.create({
      data: {
        musicianId: params.id,
        type: typeValue,
        url: `/uploads/${params.id}/${Date.now()}-${safeFileName}`,
      },
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}