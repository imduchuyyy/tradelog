"use client";

import dynamic from "next/dynamic";

export const DynamicBlockNoteNoteEditor = dynamic(() => import("./blocknote-note-editor"), {
  ssr: false,
});
