import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";

const imageExtensions: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return Response.json({ error: "Image file is required" }, { status: 400 });
  }

  const extension = imageExtensions[image.type];

  if (!extension) {
    return Response.json({ error: "Unsupported image type" }, { status: 400 });
  }

  if (image.size > 5 * 1024 * 1024) {
    return Response.json({ error: "Image must be smaller than 5MB" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "trade-notes");
  const fileName = `${randomUUID()}.${extension}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await image.arrayBuffer()));

  return Response.json({ url: `/uploads/trade-notes/${fileName}` });
}
