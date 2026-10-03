const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SKILLS = [
  { name: "Piano", slug: "piano", category: "INSTRUMENT", synonyms: ["pianista", "teclado", "piano acústico"] },
  { name: "Bateria", slug: "bateria", category: "INSTRUMENT", synonyms: ["baterista", "drum", "drums"] },
  { name: "Violão", slug: "violao", category: "INSTRUMENT", synonyms: ["violonista", "guitarra acústica"] },
  { name: "Guitarra", slug: "guitarra", category: "INSTRUMENT", synonyms: ["guitarrista", "guitar"] },
  { name: "Baixo", slug: "baixo", category: "INSTRUMENT", synonyms: ["baixista", "bass"] },
  { name: "Saxofone", slug: "saxofone", category: "INSTRUMENT", synonyms: ["saxofonista", "sax"] },
  { name: "Trompete", slug: "trompete", category: "INSTRUMENT", synonyms: ["trompetista", "trumpet"] },
  { name: "Violino", slug: "violino", category: "INSTRUMENT", synonyms: ["violinista", "violin"] },
  { name: "Percussão", slug: "percussao", category: "INSTRUMENT", synonyms: ["percussionista", "percussion"] },
  { name: "Voz", slug: "voz", category: "VOCAL", synonyms: ["cantor", "cantora", "vocalista", "singer"] },
  { name: "Backing Vocal", slug: "backing-vocal", category: "VOCAL", synonyms: ["backing", "coro", "vocal de apoio"] },
  { name: "DJ", slug: "dj", category: "FUNCTION", synonyms: ["disc jockey", "dj set"] },
];

const GENRES = ["MPB", "Sertanejo", "Pop", "Rock", "Jazz", "Samba", "Pagode", "Eletrônica", "Bossa Nova", "Gospel"];

const MUSICIANS = [
  {
    email: "ana.silva@showcase.local",
    name: "Ana Silva",
    stageName: "Ana Voz",
    bio: "Cantora com 10 anos de experiência em casamentos e eventos corporativos.",
    photoUrl: "https://i.pravatar.cc/400?img=1",
    priceMin: 800,
    priceMax: 2500,
    skills: ["voz", "backing-vocal"],
    genres: ["MPB", "Bossa Nova", "Pop"],
  },
  {
    email: "bruno.costa@showcase.local",
    name: "Bruno Costa",
    stageName: "Bruno Beats",
    bio: "DJ especializado em festas e formaturas, repertório eclético.",
    photoUrl: "https://i.pravatar.cc/400?img=12",
    priceMin: 600,
    priceMax: 1800,
    skills: ["dj"],
    genres: ["Eletrônica", "Pop", "Sertanejo"],
  },
  {
    email: "carla.mendes@showcase.local",
    name: "Carla Mendes",
    stageName: "Carla Piano",
    bio: "Pianista clássica e popular, ideal para cerimônias e jantares.",
    photoUrl: "https://i.pravatar.cc/400?img=5",
    priceMin: 900,
    priceMax: 3000,
    skills: ["piano"],
    genres: ["MPB", "Jazz", "Bossa Nova"],
  },
  {
    email: "diego.ramos@showcase.local",
    name: "Diego Ramos",
    stageName: "Diego Guitar",
    bio: "Guitarrista de rock e pop, já tocou em bandas de destaque na cena local.",
    photoUrl: "https://i.pravatar.cc/400?img=15",
    priceMin: 500,
    priceMax: 2000,
    skills: ["guitarra", "violao"],
    genres: ["Rock", "Pop"],
  },
  {
    email: "elaine.souza@showcase.local",
    name: "Elaine Souza",
    stageName: "Elaine Sax",
    bio: "Saxofonista profissional, repertório de jazz e MPB para eventos sofisticados.",
    photoUrl: "https://i.pravatar.cc/400?img=9",
    priceMin: 700,
    priceMax: 2200,
    skills: ["saxofone"],
    genres: ["Jazz", "MPB"],
  },
  {
    email: "felipe.torres@showcase.local",
    name: "Felipe Torres",
    stageName: "Felipe Bateras",
    bio: "Baterista com passagem por bandas de samba e pagode, animação garantida.",
    photoUrl: "https://i.pravatar.cc/400?img=33",
    priceMin: 600,
    priceMax: 1900,
    skills: ["bateria", "percussao"],
    genres: ["Samba", "Pagode"],
  },
  {
    email: "giovana.lima@showcase.local",
    name: "Giovana Lima",
    stageName: "Giovana Violin",
    bio: "Violinista para cerimônias, entrada e saída de noivos, repertório personalizado.",
    photoUrl: "https://i.pravatar.cc/400?img=20",
    priceMin: 1000,
    priceMax: 3500,
    skills: ["violino"],
    genres: ["MPB", "Pop", "Bossa Nova"],
  },
  {
    email: "hugo.pereira@showcase.local",
    name: "Hugo Pereira",
    stageName: "Hugo Gospel",
    bio: "Vocalista e multi-instrumentista especializado em eventos religiosos.",
    photoUrl: "https://i.pravatar.cc/400?img=52",
    priceMin: 500,
    priceMax: 1600,
    skills: ["voz", "violao"],
    genres: ["Gospel", "MPB"],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@showcase.local" },
    update: { name: "Admin Showcase", role: "ADMIN", status: "ACTIVE", passwordHash },
    create: {
      email: "admin@showcase.local",
      name: "Admin Showcase",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "cliente@showcase.local" },
    update: { name: "Cliente Teste", role: "CLIENT", status: "ACTIVE", passwordHash },
    create: {
      email: "cliente@showcase.local",
      name: "Cliente Teste",
      role: "CLIENT",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
    },
  });

  await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: { userId: clientUser.id },
  });

  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {},
      create: skill,
    });
  }

  for (const genreName of GENRES) {
    await prisma.genre.upsert({
      where: { name: genreName },
      update: {},
      create: { name: genreName },
    });
  }

  for (const musicianData of MUSICIANS) {
    const user = await prisma.user.upsert({
      where: { email: musicianData.email },
      update: { name: musicianData.name, role: "MUSICIAN", status: "ACTIVE", passwordHash },
      create: {
        email: musicianData.email,
        name: musicianData.name,
        role: "MUSICIAN",
        status: "ACTIVE",
        emailVerified: new Date(),
        passwordHash,
      },
    });

    const musician = await prisma.musician.upsert({
      where: { userId: user.id },
      update: {
        stageName: musicianData.stageName,
        bio: musicianData.bio,
        photoUrl: musicianData.photoUrl,
        verified: true,
        priceMin: musicianData.priceMin,
        priceMax: musicianData.priceMax,
      },
      create: {
        userId: user.id,
        stageName: musicianData.stageName,
        bio: musicianData.bio,
        photoUrl: musicianData.photoUrl,
        verified: true,
        priceMin: musicianData.priceMin,
        priceMax: musicianData.priceMax,
      },
    });

    for (const skillSlug of musicianData.skills) {
      const skill = await prisma.skill.findUnique({ where: { slug: skillSlug } });
      if (!skill) continue;
      await prisma.musicianSkill.upsert({
        where: { musicianId_skillId: { musicianId: musician.id, skillId: skill.id } },
        update: {},
        create: { musicianId: musician.id, skillId: skill.id, level: "profissional" },
      });
    }

    for (const genreName of musicianData.genres) {
      const genre = await prisma.genre.findUnique({ where: { name: genreName } });
      if (!genre) continue;
      await prisma.musicianGenre.upsert({
        where: { musicianId_genreId: { musicianId: musician.id, genreId: genre.id } },
        update: {},
        create: { musicianId: musician.id, genreId: genre.id },
      });
    }
  }

  console.log(`Seed concluído: ${admin.email}, ${clientUser.email} e ${MUSICIANS.length} músicos.`);
  console.log("Senha de teste para todas as contas: password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

