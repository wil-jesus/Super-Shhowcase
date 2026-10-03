import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const upload = createUploadthing();

export const ourFileRouter = {
  musicianMedia: upload({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || (session.user.role !== "MUSICIAN" && session.user.role !== "ADMIN")) {
        throw new Error("Não autorizado");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const musician = await prisma.musician.findUnique({
        where: { userId: metadata.userId },
        select: { id: true },
      });

      if (!musician) throw new Error("Perfil de músico não encontrado");

      const media = await prisma.media.create({
        data: {
          musicianId: musician.id,
          type: "IMAGE",
          url: file.url,
        },
      });

      await prisma.musician.update({
        where: { id: musician.id },
        data: { photoUrl: file.url },
      });

      return { mediaId: media.id, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
