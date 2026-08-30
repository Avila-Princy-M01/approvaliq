"use client";

import type { AuditEvent } from "@/types";

interface AuditTimelineProps {
  events: AuditEvent[];
}

const ACTION_LABELS: Record<string, string> = {
  evaluation: "Rules evaluated",
  risk_assessment: "Risk assessment computed",
  dry_run: "Document dry-run executed",
  citation_missing: "Citation missing",
  viewed: "Application viewed",
  approved: "Approved by officer",
  rejected: "Rejected by officer",
  clarification_requested: "Clarification requested",
  overridden: "Recommendation overridden",
};

const ACTOR_TYPE_LABELS: Record<string, string> = {
  system: "System",
  officer: "Officer",
};

export function AuditTimeline({ events }: AuditTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No audit events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const isOfficer = event.actor !== "system";
        const actionLabel = ACTION_LABELS[event.action] || event.action;
        const actorLabel = isOfficer ? event.actor : ACTOR_TYPE_LABELS[event.actor] || event.actor;

        return (
          <div
            key={index}
            className={`border-l-2 pl-4 py-2 ${
              isOfficer ? "border-blue-500" : "border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      isOfficer
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {actorLabel}
                  </span>
                  <span className="text-sm font-medium">{actionLabel}</span>
                </div>
                {event.reason && (
                  <p className="text-sm text-muted-foreground">{event.reason}</p>
                )}
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(event.timestamp).toLocaleString()}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}
