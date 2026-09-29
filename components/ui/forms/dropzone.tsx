"use client";
import * as React from "react";
import { dataAttr } from "../utils/attrs";
import { composeRefs } from "../utils/compose";
import { useFieldControl } from "./form-field";
import { setInputFiles, validateFiles, type FileRejection } from "./file-utils";

export interface DropzoneState {
  isDragging: boolean;
  isDisabled: boolean;
}

export interface DropzoneProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrop" | "children"> {
  onDrop?: (accepted: File[], rejected: FileRejection[]) => void;
  accept?: string;
  /** Default: true. */
  multiple?: boolean;
  maxSize?: number;
  minSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  invalid?: boolean;
  /** Attach dropped files to the hidden input so native forms submit them. */
  name?: string;
  /** Disable click-to-browse. */
  noClick?: boolean;
  /** Disable Enter/Space-to-browse. */
  noKeyboard?: boolean;
  children?: React.ReactNode | ((state: DropzoneState) => React.ReactNode);
}

/**
 * Drag-and-drop + click-to-browse area. Style with [data-dragging] [data-disabled] [data-invalid].
 */
export const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(function Dropzone(props, forwardedRef) {
  const {
    onDrop,
    accept,
    multiple = true,
    maxSize,
    minSize,
    maxFiles,
    noClick = false,
    noKeyboard = false,
    children,
    onClick,
    onKeyDown,
    onDragEnter,
    onDragOver,
    onDragLeave,
    ...others
  } = props;
  const { rest, native, disabled, invalid } = useFieldControl(others);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const depth = React.useRef(0);
  const [isDragging, setDragging] = React.useState(false);

  const handleFiles = (files: File[]) => {
    const { accepted, rejected } = validateFiles(files, { accept, maxSize, minSize, maxFiles, multiple });
    setInputFiles(inputRef.current, accepted);
    onDrop?.(accepted, rejected);
  };

  const open = () => !disabled && inputRef.current?.click();

  return (
    <div
      ref={composeRefs(forwardedRef, rootRef)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-describedby={native["aria-describedby"]}
      data-dropzone=""
      data-dragging={dataAttr(isDragging)}
      data-invalid={dataAttr(invalid)}
      data-disabled={dataAttr(disabled)}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented && !noClick) open();
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || noKeyboard || e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      onDragEnter={(e) => {
        onDragEnter?.(e);
        e.preventDefault();
        if (disabled || !e.dataTransfer.types.includes("Files")) return;
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        onDragOver?.(e);
        e.preventDefault();
        if (!disabled) e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        onDragLeave?.(e);
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        if (!disabled) handleFiles(Array.from(e.dataTransfer.files));
      }}
    >
      {typeof children === "function" ? children({ isDragging, isDisabled: disabled }) : children}
      <input
        ref={inputRef}
        type="file"
        name={native.name}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        style={{ display: "none" }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          handleFiles(Array.from(e.target.files ?? []));
        }}
      />
    </div>
  );
});
