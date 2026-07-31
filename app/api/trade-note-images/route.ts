import { auth } from "@/lib/auth";

const imageExtensions: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const maxImageSizeMb = 25;
const maxImageSizeBytes = maxImageSizeMb * 1024 * 1024;

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

  if (image.size > maxImageSizeBytes) {
    return Response.json({ error: `Image must be smaller than ${maxImageSizeMb}MB` }, { status: 400 });
  }

  const data = Buffer.from(await image.arrayBuffer()).toString("base64");

  return Response.json({ url: `data:${image.type};base64,${data}` });
}
