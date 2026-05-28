import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, CircleDashed, Clock3 } from "lucide-react";

import type {
  RoadmapFlowNodeData,
  RoadmapFlowNodeModel,
} from "@/entities/roadmap/lib/roadmap-flow";
import { cn } from "@/shared/lib/utils";

function getStatusBadge(status: RoadmapFlowNodeData["status"]) {
  if (status === "done") {
    return {
      icon: Check,
      cls: "bg-emerald-400/90 text-white shadow-[0_2px_10px_rgba(52,211,153,0.55)]",
    };
  }
  if (status === "in_progress") {
    return {
      icon: Clock3,
      cls: "bg-white/30 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.18)]",
    };
  }
  return { icon: CircleDashed, cls: "bg-white/10 text-white/38" };
}

export function RoadmapFlowNode({ data, selected }: NodeProps<RoadmapFlowNodeModel>) {
  const { icon: StatusIcon, cls: badgeCls } = getStatusBadge(data.status);
  const isDone     = data.status === "done";
  const isActive   = data.status === "in_progress";
  const isNotStarted     = data.status === "not_started";

  return (
    <div
      data-status={data.status}
      data-optional={data.is_optional ? "true" : undefined}
      className={cn(
        "roadmap-flow-node relative flex min-w-[200px] max-w-[200px] cursor-pointer items-center gap-2.5 rounded-2xl border px-3.5 py-3 backdrop-blur-xl transition-all duration-200",

        // ── done: emerald, обе разновидности ──────────────────────────────
        isDone && [
          "border-emerald-400/30 text-emerald-100/80",
          "bg-[linear-gradient(135deg,rgba(52,211,153,0.12)_0%,rgba(16,185,129,0.07)_100%)]",
          "shadow-[0_6px_16px_rgba(52,211,153,0.1),inset_0_1px_0_rgba(255,255,255,0.12)]",
        ],

        // ── in_progress обязательный: яркий фиолетовый ───────────────────
        isActive && !data.is_optional && [
          "border-violet-400/55 text-white",
          "bg-[linear-gradient(135deg,rgba(167,139,250,0.84)_0%,rgba(109,40,217,0.96)_100%)]",
          "shadow-[0_18px_44px_rgba(109,40,217,0.55),inset_0_1px_0_rgba(255,255,255,0.32)]",
        ],

        // ── in_progress опциональный: полупрозрачный фиолетовый ──────────
        isActive && data.is_optional && [
          "border-violet-400/42 text-white",
          "bg-[linear-gradient(135deg,rgba(167,139,250,0.55)_0%,rgba(109,40,217,0.66)_100%)]",
          "shadow-[0_14px_32px_rgba(109,40,217,0.38),inset_0_1px_0_rgba(255,255,255,0.24)]",
        ],

        // ── idle обязательный: dim-violet, чётко «не начат» ─────────────
        isNotStarted && !data.is_optional && [
          "border-violet-500/26 text-violet-200/72",
          "bg-[linear-gradient(135deg,rgba(109,40,217,0.18)_0%,rgba(76,29,149,0.24)_100%)]",
          "shadow-[0_6px_18px_rgba(109,40,217,0.1),inset_0_1px_0_rgba(255,255,255,0.09)]",
        ],

        // ── idle опциональный: почти прозрачное стекло ───────────────────
        isNotStarted && data.is_optional && [
          "border-violet-300/16 text-violet-200/52",
          "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(139,92,246,0.08)_100%)]",
          "shadow-[0_4px_12px_rgba(109,40,217,0.07),inset_0_1px_0_rgba(255,255,255,0.09)]",
        ],

        // ── выбранная нода ────────────────────────────────────────────────
        selected || data.is_user_selected
          ? "ring-2 ring-violet-300/70 ring-offset-1 ring-offset-transparent shadow-[0_0_0_4px_rgba(167,139,250,0.16),0_16px_40px_rgba(109,40,217,0.46),inset_0_1px_0_rgba(255,255,255,0.32)]"
          : !isDone && "hover:-translate-y-0.5",

        data.is_current_step && "roadmap-flow-node-current",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={!!data.can_connect}
        className={data.can_connect
          ? "!h-3.5 !w-3.5 !rounded-full !border-2 !border-violet-400/80 !bg-violet-900/70"
          : "!h-px !w-px !border-0 !bg-transparent !opacity-0 !pointer-events-none"}
      />

      <span className={cn("roadmap-status-badge flex h-6 w-6 shrink-0 items-center justify-center rounded-full", badgeCls)}>
        <StatusIcon className="h-3.5 w-3.5 stroke-[2.2]" />
      </span>

      <span className="line-clamp-2 flex-1 text-sm font-semibold leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]">
        {data.title}
      </span>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={!!data.can_connect}
        className={data.can_connect
          ? "!h-3.5 !w-3.5 !rounded-full !border-2 !border-violet-400/80 !bg-violet-900/70"
          : "!h-px !w-px !border-0 !bg-transparent !opacity-0 !pointer-events-none"}
      />
    </div>
  );
}
