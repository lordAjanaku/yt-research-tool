import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TranscriptDialog({ isOpen, onClose, entry, onSave }) {
  const [localTranscript, setLocalTranscript] = useState(entry?.transcript || "");

  // Sync state when entry changes
  useEffect(() => {
    setLocalTranscript(entry?.transcript || "");
  }, [entry]);

  const renderArc = () => {
    if (!entry?.arc) return <p className="text-muted-foreground">—</p>;
    const steps = Array.isArray(entry.arc) ? entry.arc : [entry.arc];
    return (
      <ul className="list-disc pl-4 space-y-1">
        {steps.map((step, i) => <li key={i}>{step}</li>)}
      </ul>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Video Analysis: {entry?.title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="transcript">
          <TabsList>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="analysis">AI Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="transcript">
            <Textarea
              value={localTranscript}
              onChange={(e) => setLocalTranscript(e.target.value)}
              placeholder="Paste video transcript here..."
              className="min-h-[300px] text-[12px]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => { onSave(localTranscript); onClose(); }}>Save</Button>
            </div>
          </TabsContent>
          <TabsContent value="analysis" className="min-h-[300px] border p-4 text-[12px] space-y-4">
            <div>
              <p className="font-bold text-primary">Hook Quote</p>
              <p className="italic text-muted-foreground">{entry?.hook_quote || "No transcript analysis available."}</p>
            </div>
            <div>
              <p className="font-bold text-primary">Pacing Signal</p>
              <p>{entry?.pacing_signal || "—"}</p>
            </div>
            <div>
              <p className="font-bold text-primary">Narrative Arc</p>
              {renderArc()}
            </div>
            <div>
              <p className="font-bold text-primary">Outlier Insight</p>
              <p>{entry?.insight || "—"}</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
