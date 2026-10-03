import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const musician = await prisma.musician.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          reviewsReceived: {
            include: { reviewer: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      skills: { include: { skill: true } },
      genres: { include: { genre: true } },
      media: true,
      availability: true,
    },
  });

  if (!musician) {
    return NextResponse.json({ error: "Músico não encontrado" }, { status: 404 });
  }

  // Privacidade (ADR-006): nunca expõe latitude/longitude exatas nem a conta Stripe
  const { latitude, longitude, stripeAccountId: _stripeAccountId, user, ...publicProfile } = musician;

  return NextResponse.json({
    musician: {
      ...publicProfile,
      user: { name: user.name },
      reviews: user.reviewsReceived,
    },
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const musician = await prisma.musician.findUnique({ where: { id: params.id } });
    if (!musician) {
      return NextResponse.json({ error: "Músico não encontrado" }, { status: 404 });
    }

    const isOwner = musician.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Sem permissão para editar este perfil" }, { status: 403 });
    }

    const body = await req.json();
    const {
      stageName,
      bio,
      photoUrl,
      priceMin,
      priceMax,
      serviceRadiusKm,
      latitude,
      longitude,
      stripeAccountId,
    } = body;

    if (priceMin != null && priceMax != null && priceMin > priceMax) {
      return NextResponse.json({ error: "priceMin não pode ser maior que priceMax" }, { status: 400 });
    }
    if (priceMin != null && priceMin < 0) {
      return NextResponse.json({ error: "Preço mínimo inválido" }, { status: 400 });
    }
    if (serviceRadiusKm != null && (serviceRadiusKm < 1 || serviceRadiusKm > 500)) {
      return NextResponse.json(
        { error: "Raio de atendimento deve estar entre 1 e 500 km" },
        { status: 400 }
      );
    }

    if (stripeAccountId != null && (typeof stripeAccountId !== "string" || !stripeAccountId.startsWith("acct_"))) {
      return NextResponse.json(
        { error: "stripeAccountId deve ser uma conta Stripe Connect (acct_...)" },
        { status: 400 }
      );
    }

    const updated = await prisma.musician.update({
      where: { id: params.id },
      data: {
        stageName,
        bio,
        photoUrl,
        priceMin,
        priceMax,
        serviceRadiusKm,
        latitude,
        longitude,
        ...(typeof stripeAccountId === "string" ? { stripeAccountId } : {}),
      },
    });

    const { latitude: _lat, longitude: _lng, ...safeMusician } = updated;
    return NextResponse.json({ musician: safeMusician });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}