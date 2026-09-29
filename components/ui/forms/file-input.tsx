"use client";
import * as React from "react";
import { composeHandlers } from "../utils/compose";
import { Input, type InputProps } from "./input";
import { setInputFiles, validateFiles, type FileRejection } from "./file-utils";

export interface FileInputProps
  extends Omit<InputProps, "type" | "value" | "defaultValue" | "size"> {
  /** Called after validation. The input itself is trimmed to the accepted files. */
  onFilesChange?: (accepted: File[], rejected: FileRejection[]) => void;
  maxSize?: number;
  minSize?: number;
  maxFiles?: number;
}

/**
 * A native file input with validation. Style the button via `::file-selector-button`,
 * or hide it and drive it with a <label htmlFor>.
 */
export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(function FileInput(
  { onFilesChange, maxSize, minSize, maxFiles, accept, multiple, onChange, ...props },
  ref
) {
  return (
    <Input
      ref={ref}
      {...props}
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={composeHandlers(onChange, (e) => {
        const files = Array.from(e.target.files ?? []);
        const { accepted, rejected } = validateFiles(files, { accept, maxSize, minSize, maxFiles, multiple });
        if (rejected.length) setInputFiles(e.target, accepted);
        onFilesChange?.(accepted, rejected);
      })}
    />
  );
});
