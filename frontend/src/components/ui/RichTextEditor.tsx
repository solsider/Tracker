import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange?: (html: string) => void;
  onBlur?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  onBlur,
  placeholder = 'Добавьте описание...',
  editable = true,
  className = '',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'bg-dash-bg text-dash-text rounded p-3 font-mono text-sm' } },
      }),
      Link.configure({
        openOnClick: !editable,
        HTMLAttributes: { class: 'text-dash-accent underline cursor-pointer' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onBlur: ({ editor }) => {
      onBlur?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-invert prose-sm max-w-none focus:outline-none min-h-[80px] text-dash-text`,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div className={`relative ${className}`}>
      {editable && (
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Жирный">
            <strong className="text-xs">B</strong>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Курсив">
            <em className="text-xs">I</em>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Встроенный код">
            <span className="font-mono text-xs">`c`</span>
          </ToolbarBtn>
          <div className="w-px h-4 bg-dash-border mx-0.5" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Маркированный список">
            <span className="text-xs">• —</span>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Нумерованный список">
            <span className="text-xs">1.</span>
          </ToolbarBtn>
          <div className="w-px h-4 bg-dash-border mx-0.5" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Блок кода">
            <span className="font-mono text-xs">{'{ }'}</span>
          </ToolbarBtn>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={`rich-text ${editable ? 'cursor-text border border-dash-border rounded-lg p-3 focus-within:border-dash-accent/50 transition-colors bg-dash-bg/50' : 'cursor-default'}`}
      />
    </div>
  );
}

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`px-2 py-1 rounded text-xs transition-colors ${
        active
          ? 'bg-dash-accent text-white'
          : 'text-dash-muted hover:bg-dash-border hover:text-dash-text'
      }`}
    >
      {children}
    </button>
  );
}
