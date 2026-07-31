"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import type { BlockNoteDocument, PastedBlockNoteImage } from "@/lib/blocknote-note";
import { cn } from "@/lib/utils";

interface BlockNoteNoteEditorProps {
  initialContent: BlockNoteDocument;
  editable?: boolean;
  className?: string;
  onChange?: (document: BlockNoteDocument) => void;
  onPasteImage?: (image: PastedBlockNoteImage) => void;
}

export default function BlockNoteNoteEditor({
  initialContent,
  editable = true,
  className,
  onChange,
  onPasteImage,
}: BlockNoteNoteEditorProps) {
  const { resolvedTheme } = useTheme();
  const t = useTranslations("dashboard.manualJournal");
  const editor = useCreateBlockNote(
    {
      initialContent,
      pasteHandler: ({ event, editor, defaultPasteHandler }) => {
        const images = Array.from(event.clipboardData?.files || []).filter((file) => file.type.startsWith("image/"));

        if (images.length === 0 || !onPasteImage) return defaultPasteHandler();

        const referenceBlock = editor.getTextCursorPosition().block;
        const pastedImages = images.map((file) => {
          const image = {
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
          };

          onPasteImage(image);
          return image;
        });

        editor.insertBlocks(
          pastedImages.map((image) => ({
            type: "image",
            props: {
              url: image.previewUrl,
              name: image.file.name || t("pastedImage"),
              caption: "",
            },
          })),
          referenceBlock,
          "after"
        );

        return true;
      },
    },
    []
  );

  return (
    <div
      className={cn(
        "blocknote-note-editor overflow-hidden rounded-[5px] border border-border bg-background text-foreground [&_.bn-editor]:min-h-[inherit] [&_.bn-editor]:px-4 [&_.bn-editor]:py-3 [&_.bn-root]:[--bn-colors-border:var(--border)] [&_.bn-root]:[--bn-colors-editor-background:var(--background)] [&_.bn-root]:[--bn-colors-editor-text:var(--foreground)] [&_.bn-root]:[--bn-colors-hovered-background:var(--muted)] [&_.bn-root]:[--bn-colors-hovered-text:var(--foreground)] [&_.bn-root]:[--bn-colors-menu-background:var(--popover)] [&_.bn-root]:[--bn-colors-menu-text:var(--popover-foreground)] [&_.bn-root]:[--bn-colors-selected-background:var(--accent)] [&_.bn-root]:[--bn-colors-selected-text:var(--accent-foreground)] [&_.bn-root]:[--bn-colors-side-menu:var(--muted-foreground)] [&_.bn-root]:[--bn-colors-tooltip-background:var(--popover)] [&_.bn-root]:[--bn-colors-tooltip-text:var(--popover-foreground)]",
        className
      )}
    >
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={() => onChange?.(editor.document as BlockNoteDocument)}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  );
}
