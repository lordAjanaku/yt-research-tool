import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function BriefDialog({ isOpen, onClose, briefContent, onDownload }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Production Brief Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow overflow-y-auto border rounded p-4 bg-muted/20">
          <pre className="whitespace-pre-wrap text-[12px] font-mono break-words">
            {briefContent}
          </pre>
        </ScrollArea>
        <div className="flex justify-end gap-2 mt-4 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onDownload}>
            Download Markdown
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
