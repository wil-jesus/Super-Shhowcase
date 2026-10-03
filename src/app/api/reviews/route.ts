import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookingId, rating, comment } = body;

    if (
      typeof bookingId !== "string" ||
      !bookingId ||
      typeof rating !== "number" ||
      !Number.isInteger(rating)
    ) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Nota deve estar entre 1 e 5" }, { status: 400 });
    }

    if (comment != null && (typeof comment !== "string" || comment.length > 1000)) {
      return NextResponse.json({ error: "Comentário muito longo" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, musician: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Contratação não encontrada" }, { status: 404 });
    }

    const isClient = booking.client.userId === session.user.id;
    const isMusician = booking.musician.userId === session.user.id;
    if (!isClient && !isMusician) {
      return NextResponse.json({ error: "Sem permissão para avaliar" }, { status: 403 });
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Avaliação só é permitida após o evento ser concluído" },
        { status: 400 }
      );
    }

    const type = isClient ? "CLIENT_TO_MUSICIAN" : "MUSICIAN_TO_CLIENT";
    const revieweeId = isClient ? booking.musician.userId : booking.client.userId;

    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: session.user.id,
        revieweeId,
        type,
        rating,
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Você já avaliou esta contratação" }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}