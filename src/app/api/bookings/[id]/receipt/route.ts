import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { UTApi } from "uploadthing/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      client: { select: { userId: true } },
      musician: { select: { id: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: "Contratação não encontrada" }, { status: 404 });
  if (booking.client.userId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  if (!["ACCEPTED", "CONFIRMED", "PENDING_PAYMENT"].includes(booking.status)) {
    return NextResponse.json({ error: "Esta contratação não está aguardando pagamento" }, { status: 409 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Envie um comprovante em imagem ou PDF" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "O comprovante deve ter no máximo 5 MB" }, { status: 400 });
    }
    if (!process.env.UPLOADTHING_TOKEN) {
      console.error("[booking-receipt] UPLOADTHING_TOKEN ausente");
      return NextResponse.json({ error: "Serviço de upload indisponível" }, { status: 500 });
    }

    const result = (await new UTApi().uploadFiles(file)) as {
      data?: { url?: string } | null;
      error?: unknown;
    } | null;
    const url = result?.data?.url;
    if (!url) {
      console.error("[booking-receipt] UploadThing falhou:", result?.error ?? result);
      return NextResponse.json({ error: "Não foi possível enviar o comprovante" }, { status: 502 });
    }

    const receipt = await prisma.media.create({
      data: {
        musicianId: booking.musician.id,
        type: `PAYMENT_RECEIPT:${booking.id}`,
        url,
      },
      select: { id: true, url: true, createdAt: true },
    });

    return NextResponse.json({ receipt }, { status: 201 });
  } catch (error) {
    console.error("[booking-receipt] Falha ao salvar comprovante:", error);
    return NextResponse.json({ error: "Erro ao enviar o comprovante" }, { status: 500 });
  }
}
