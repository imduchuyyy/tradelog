import type { PartialBlock } from "@blocknote/core";

export type BlockNoteDocument = PartialBlock[];

export interface PastedBlockNoteImage {
  id: string;
  file: File;
  previewUrl: string;
}

export const emptyBlockNoteDocument: BlockNoteDocument = [
  {
    type: "paragraph",
    content: "",
  },
];

export function parseBlockNoteDocument(value: unknown): BlockNoteDocument {
  if (Array.isArray(value)) return value as BlockNoteDocument;

  if (typeof value !== "string") return emptyBlockNoteDocument;

  const trimmedValue = value.trim();

  if (!trimmedValue) return emptyBlockNoteDocument;

  try {
    const parsed = JSON.parse(trimmedValue);

    if (Array.isArray(parsed)) return parsed as BlockNoteDocument;
  } catch {
    return [
      {
        type: "paragraph",
        content: trimmedValue,
      },
    ];
  }

  return emptyBlockNoteDocument;
}

export function isEmptyBlockNoteDocument(document: BlockNoteDocument): boolean {
  if (document.length === 0) return true;

  return document.every((block) => {
    const content = block.content;
    const children = block.children || [];

    if (typeof content === "string" && content.trim()) return false;

    if (Array.isArray(content)) {
      const hasText = content.some((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "text" in item) {
          return String(item.text || "").trim();
        }

        return true;
      });

      if (hasText) return false;
    }

    if (block.type && block.type !== "paragraph") return false;

    return children.length === 0 || isEmptyBlockNoteDocument(children as BlockNoteDocument);
  });
}

export async function replacePastedImageUrls(
  document: BlockNoteDocument,
  images: PastedBlockNoteImage[],
  uploadImage: (file: File) => Promise<{ url: string }>
) {
  const urlMap = new Map<string, string>();
  const serializedDocument = JSON.stringify(document);
  const usedImages = images.filter((image) => serializedDocument.includes(image.previewUrl));

  for (const image of usedImages) {
    const uploadedImage = await uploadImage(image.file);
    urlMap.set(image.previewUrl, uploadedImage.url);
  }

  return replaceUrlsInBlocks(document, urlMap);
}

function replaceUrlsInBlocks(blocks: BlockNoteDocument, urlMap: Map<string, string>): BlockNoteDocument {
  return blocks.map((block) => {
    const props = block.props ? ({ ...block.props } as Record<string, unknown>) : undefined;

    if (props && typeof props.url === "string" && urlMap.has(props.url)) {
      props.url = urlMap.get(props.url);
    }

    return {
      ...block,
      props,
      children: block.children ? replaceUrlsInBlocks(block.children as BlockNoteDocument, urlMap) : block.children,
    } as PartialBlock;
  }) as BlockNoteDocument;
}
