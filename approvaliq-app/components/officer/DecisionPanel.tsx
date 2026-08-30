"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/shared/Toaster";

interface DecisionPanelProps {
  applicationId: string;
  currentStatus: string;
  onDecisionSubmitted: () => void;
}

export function DecisionPanel({
  applicationId,
  currentStatus,
  onDecisionSubmitted,
}: DecisionPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const { addToast } = useToast();

  const isDecided = currentStatus === "approved" || currentStatus === "rejected";

  const handleAction = async (action: string) => {
    // For reject and override, show reason dialog
    if (action === "reject" || action === "override") {
      setPendingAction(action);
      setReason("");
      setDialogOpen(true);
      return;
    }

    // For approve and clarification_requested, submit directly
    await submitDecision(action, "");
  };

  const submitDecision = async (action: string, reasonValue: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/officer/${applicationId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "approve" ? "approve" : action === "clarification_requested" ? "request-clarification" : action,
          reason: reasonValue || undefined,
        }),
      });

      if (response.ok) {
        const label = action === "approve" ? "Approved" : action === "reject" ? "Rejected" : action === "override" ? "Overridden" : "Clarification requested";
        addToast(`${label} successfully`, "success");
        onDecisionSubmitted();
      } else {
        const data = await response.json();
        addToast(data.error || "Action failed", "error");
      }
    } catch {
      addToast("Network error — please try again", "error");
    } finally {
      setIsLoading(false);
      setDialogOpen(false);
      setPendingAction("");
      setReason("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground italic">
        Advisory recommendation
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          onClick={() => handleAction("approve")}
          disabled={isLoading || isDecided}
        >
          Approve
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAction("clarification_requested")}
          disabled={isLoading || isDecided}
        >
          Request Clarification
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleAction("reject")}
          disabled={isLoading || isDecided}
        >
          Reject
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleAction("override")}
          disabled={isLoading || isDecided}
        >
          Override
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "reject" ? "Reject Application" : "Override Recommendation"}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for this action. This will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Enter reason (minimum 10 characters)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={pendingAction === "reject" ? "destructive" : "default"}
              onClick={() => submitDecision(pendingAction, reason)}
              disabled={isLoading || reason.trim().length < 10}
            >
              {isLoading ? "Submitting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
