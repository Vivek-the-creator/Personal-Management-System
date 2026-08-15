import { useEffect, useRef } from "react";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  RemoveFormatting,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your thoughts, reflections, or diary entry...",
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function execCommand(command: string, value: string | undefined = undefined) {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }

  function handleAddLink() {
    const url = prompt("Enter URL:", "https://");
    if (url) {
      execCommand("createLink", url);
    }
  }

  return (
    <div className={cn("flex flex-col rounded-xl border border-border/60 bg-background overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/30 p-1.5 shrink-0">
        <ToolbarButton label="Bold" icon={Bold} onClick={() => execCommand("bold")} />
        <ToolbarButton label="Italic" icon={Italic} onClick={() => execCommand("italic")} />
        <ToolbarButton label="Underline" icon={UnderlineIcon} onClick={() => execCommand("underline")} />

        <div className="h-4 w-px bg-border my-auto mx-0.5" />

        <ToolbarButton label="Heading 1" icon={Heading1} onClick={() => execCommand("formatBlock", "<h1>")} />
        <ToolbarButton label="Heading 2" icon={Heading2} onClick={() => execCommand("formatBlock", "<h2>")} />

        <div className="h-4 w-px bg-border my-auto mx-0.5" />

        <ToolbarButton label="Bullet List" icon={List} onClick={() => execCommand("insertUnorderedList")} />
        <ToolbarButton label="Numbered List" icon={ListOrdered} onClick={() => execCommand("insertOrderedList")} />
        <ToolbarButton label="Quote" icon={Quote} onClick={() => execCommand("formatBlock", "<blockquote>")} />

        <div className="h-4 w-px bg-border my-auto mx-0.5" />

        <ToolbarButton label="Insert Link" icon={LinkIcon} onClick={handleAddLink} />
        <ToolbarButton label="Clear Formatting" icon={RemoveFormatting} onClick={() => execCommand("removeFormat")} />

        <div className="h-4 w-px bg-border my-auto mx-0.5" />

        <ToolbarButton label="Undo" icon={Undo} onClick={() => execCommand("undo")} />
        <ToolbarButton label="Redo" icon={Redo} onClick={() => execCommand("redo")} />
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="prose dark:prose-invert prose-sm min-h-[160px] max-h-[360px] flex-1 overflow-y-auto p-3.5 outline-none focus:outline-none"
        data-placeholder={placeholder}
      />
    </div>
  );
}

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Bold;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
      aria-label={label}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
