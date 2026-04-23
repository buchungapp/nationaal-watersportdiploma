"use client";

import { ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NodeType = "instructeur" | "leercoach" | "beoordelaar" | "consument";

interface FlowNode {
  id: string;
  type: NodeType;
  level: string;
  title: string;
  description: string;
  age?: string;
  requirements?: string[];
  permissions?: string[];
  href: string;
}

const flowNodes: FlowNode[] = [
  {
    id: "consument",
    type: "consument",
    level: "",
    title: "Consumentendiploma's",
    description: "NWD 1 t/m NWD 4",
    href: "/diplomalijn/consument",
  },
  {
    id: "i1",
    type: "instructeur",
    level: "I1",
    title: "Wal/Waterhulp",
    description: "Assisteert bij lessen",
    age: "12+",
    requirements: ["Geen vooropleiding vereist"],
    permissions: ["Assisteren bij lessen onder supervisie"],
    href: "/diplomalijn/instructeur/niveau-1",
  },
  {
    id: "i2",
    type: "instructeur",
    level: "I2",
    title: "Instructeur 2",
    description: "Lesgeven onder supervisie",
    age: "16+",
    requirements: ["NWD A"],
    permissions: ["Lesgeven onder supervisie van I3+"],
    href: "/diplomalijn/instructeur/niveau-2",
  },
  {
    id: "i3",
    type: "instructeur",
    level: "I3",
    title: "Instructeur 3",
    description: "Zelfstandig lesgeven & toetsen",
    age: "17+",
    requirements: ["Instructeur 2 (I2)", "NWD B"],
    permissions: ["Zelfstandig lesgeven", "Toetsen afnemen tot NWD-4"],
    href: "/diplomalijn/instructeur/niveau-3",
  },
  {
    id: "i4",
    type: "instructeur",
    level: "I4",
    title: "Instructeur 4",
    description: "Opleider van instructeurs",
    age: "18+",
    requirements: ["Instructeur 3 (I3)", "NWD C", "KVB-I"],
    permissions: ["Lesgeven tot NWD-B", "Afnemen NWD examens"],
    href: "/diplomalijn/instructeur/niveau-4",
  },
  {
    id: "i5",
    type: "instructeur",
    level: "I5",
    title: "Instructeur 5",
    description: "Hoogste niveau",
    age: "18+",
    requirements: ["Instructeur 4 (I4)"],
    permissions: ["Lesgeven tot NWD-C"],
    href: "/diplomalijn/instructeur/niveau-5",
  },
  {
    id: "l4",
    type: "leercoach",
    level: "L4",
    title: "Leercoach 4",
    description: "Begeleidt instructeurs t/m I3",
    age: "18+",
    requirements: ["Instructeur 3 (I3)"],
    permissions: ["Opleiden t/m I3"],
    href: "/diplomalijn/instructeur/leercoach/niveau-4",
  },
  {
    id: "l5",
    type: "leercoach",
    level: "L5",
    title: "Leercoach 5",
    description: "Hoogste leercoach niveau",
    age: "18+",
    requirements: ["Leercoach 4 (L4)", "PvB-beoordelaar 4 (B4)"],
    permissions: ["Opleiden t/m Niveau 4"],
    href: "/diplomalijn/instructeur/leercoach/niveau-5",
  },
  {
    id: "b4",
    type: "beoordelaar",
    level: "B4",
    title: "PvB-beoordelaar 4",
    description: "Neemt PvB's af voor I1-I3",
    age: "18+",
    requirements: ["Leercoach 4 (L4)"],
    permissions: ["PvB's afnemen I1-I3"],
    href: "/diplomalijn/instructeur/pvb-beoordelaar/niveau-4",
  },
  {
    id: "b5",
    type: "beoordelaar",
    level: "B5",
    title: "PvB-beoordelaar 5",
    description: "Hoogste beoordelaarsniveau",
    age: "18+",
    requirements: ["Leercoach 5 (L5)"],
    permissions: ["PvB's afnemen I4"],
    href: "/diplomalijn/instructeur/pvb-beoordelaar/niveau-5",
  },
];

const colorSchemes: Record<
  NodeType,
  {
    border: string;
    borderActive: string;
    badge: string;
    legend: string;
  }
> = {
  consument: {
    border: "border-slate-200",
    borderActive: "border-slate-400",
    badge: "bg-slate-100 text-slate-600",
    legend: "border-slate-300",
  },
  instructeur: {
    border: "border-branding-light/40",
    borderActive: "border-branding-light",
    badge: "bg-branding-light/10 text-branding-dark",
    legend: "border-branding-light/60",
  },
  leercoach: {
    border: "border-branding-orange/40",
    borderActive: "border-branding-orange",
    badge: "bg-branding-orange/10 text-branding-orange",
    legend: "border-branding-orange/60",
  },
  beoordelaar: {
    border: "border-branding-dark/40",
    borderActive: "border-branding-dark",
    badge: "bg-branding-dark/10 text-branding-dark",
    legend: "border-branding-dark/60",
  },
};

function FlowCard({
  node,
  isVisible,
  delay = 0,
}: {
  node: FlowNode;
  isVisible: boolean;
  delay?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = colorSchemes[node.type];

  return (
    <div
      className={clsx(
        "w-full transition-all duration-500",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className={clsx(
          "w-full rounded-xl border-2 bg-white text-left transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-branding-light/40",
          isExpanded ? colors.borderActive : colors.border,
        )}
      >
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800">
              {node.level ? `${node.title} (${node.level})` : node.title}
            </span>
            <div className="flex items-center gap-2">
              {node.age && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {node.age}
                </span>
              )}
              <ChevronDownIcon
                className={clsx(
                  "size-4 text-slate-400 transition-transform duration-200",
                  isExpanded && "rotate-180",
                )}
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">{node.description}</p>

          {isExpanded && (
            <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
              {node.requirements && node.requirements.length > 0 && (
                <p className="text-[11px] text-slate-600">
                  <span className="font-semibold">Instapeisen:</span>{" "}
                  {node.requirements.join(", ")}
                </p>
              )}
              {node.permissions && node.permissions.length > 0 && (
                <p className="text-[11px] text-slate-600">
                  <span className="font-semibold">Bevoegdheden:</span>{" "}
                  {node.permissions[0]}
                </p>
              )}
              <Link
                href={node.href}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-branding-light transition-colors hover:text-branding-dark"
              >
                Meer info
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

function VerticalConnector() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center">
        <div className="h-4 w-0.5 bg-slate-300" />
        <div className="-mt-1 size-2 rotate-45 border-b-2 border-r-2 border-slate-300" />
      </div>
    </div>
  );
}

function HorizontalConnector() {
  return (
    <div className="flex items-center px-2">
      <div className="h-0.5 w-4 bg-slate-300" />
      <ArrowRightIcon className="-ml-0.5 size-3 text-slate-300" />
    </div>
  );
}

export function DoorstroomSchema() {
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const nodeId = entry.target.getAttribute("data-node-id");
            if (nodeId) {
              setVisibleNodes((prev) => {
                const next = new Set(prev);
                next.add(nodeId);
                return next;
              });
            }
          }
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
    );

    const nodeElements =
      containerRef.current?.querySelectorAll("[data-node-id]");
    nodeElements?.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const getNode = (id: string) => {
    const node = flowNodes.find((n) => n.id === id);
    if (!node) throw new Error(`Unknown flow node id: ${id}`);
    return node;
  };

  return (
    <div ref={containerRef} className="not-prose">
      {/* Legend */}
      <div className="mb-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded border-2 border-branding-light/60 bg-white" />
          <span className="text-slate-600">Instructeur</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded border-2 border-branding-orange/60 bg-white" />
          <span className="text-slate-600">Leercoach</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded border-2 border-branding-dark/60 bg-white" />
          <span className="text-slate-600">PvB-beoordelaar</span>
        </div>
      </div>

      {/* Desktop tree */}
      <div className="hidden rounded-xl border border-slate-200 bg-slate-50/50 p-6 lg:block">
        <div className="flex flex-col items-start">
          <div className="flex items-start">
            <div data-node-id="consument" className="w-52">
              <FlowCard
                node={getNode("consument")}
                isVisible={visibleNodes.has("consument")}
                delay={0}
              />
            </div>
            <div className="ml-8 w-52" />
            <div data-node-id="i1" className="w-52">
              <FlowCard
                node={getNode("i1")}
                isVisible={visibleNodes.has("i1")}
                delay={100}
              />
            </div>
          </div>

          <div className="ml-10">
            <VerticalConnector />
          </div>

          <div data-node-id="i2" className="w-52">
            <FlowCard
              node={getNode("i2")}
              isVisible={visibleNodes.has("i2")}
              delay={200}
            />
          </div>

          <div className="ml-10">
            <VerticalConnector />
          </div>

          <div className="flex items-start">
            <div data-node-id="i3" className="min-h-[72px] w-52">
              <FlowCard
                node={getNode("i3")}
                isVisible={visibleNodes.has("i3")}
                delay={300}
              />
            </div>
            <div className="flex items-start">
              <div className="mt-5">
                <HorizontalConnector />
              </div>
              <div data-node-id="l4" className="min-h-[72px] w-52">
                <FlowCard
                  node={getNode("l4")}
                  isVisible={visibleNodes.has("l4")}
                  delay={400}
                />
              </div>
              <div className="mt-5">
                <HorizontalConnector />
              </div>
              <div data-node-id="b4" className="min-h-[72px] w-52">
                <FlowCard
                  node={getNode("b4")}
                  isVisible={visibleNodes.has("b4")}
                  delay={500}
                />
              </div>
            </div>
          </div>

          <div className="ml-10">
            <VerticalConnector />
          </div>

          <div className="flex items-start">
            <div data-node-id="i4" className="min-h-[72px] w-52">
              <FlowCard
                node={getNode("i4")}
                isVisible={visibleNodes.has("i4")}
                delay={500}
              />
            </div>
            <div className="flex items-start">
              <div className="mt-5">
                <HorizontalConnector />
              </div>
              <div data-node-id="l5" className="min-h-[72px] w-52">
                <FlowCard
                  node={getNode("l5")}
                  isVisible={visibleNodes.has("l5")}
                  delay={600}
                />
              </div>
              <div className="mt-5">
                <HorizontalConnector />
              </div>
              <div data-node-id="b5" className="min-h-[72px] w-52">
                <FlowCard
                  node={getNode("b5")}
                  isVisible={visibleNodes.has("b5")}
                  delay={700}
                />
              </div>
            </div>
          </div>

          <div className="ml-10">
            <VerticalConnector />
          </div>

          <div data-node-id="i5" className="w-52">
            <FlowCard
              node={getNode("i5")}
              isVisible={visibleNodes.has("i5")}
              delay={600}
            />
          </div>
        </div>
      </div>

      {/* Mobile list */}
      <div className="space-y-6 lg:hidden">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Instapniveaus (zonder doorstroom)
          </h3>
          <div className="space-y-2">
            {["consument", "i1"].map((id) => (
              <div key={id} data-node-id={id}>
                <FlowCard node={getNode(id)} isVisible={visibleNodes.has(id)} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <div className="size-3 rounded border-2 border-branding-light/60 bg-white" />
            Instructeur
          </h3>
          <div className="space-y-2 border-l-2 border-branding-light/30 pl-2">
            {["i2", "i3", "i4", "i5"].map((id) => (
              <div key={id} data-node-id={id} className="pl-3">
                <FlowCard node={getNode(id)} isVisible={visibleNodes.has(id)} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <div className="size-3 rounded border-2 border-branding-orange/60 bg-white" />
            Leercoach
          </h3>
          <div className="space-y-2 border-l-2 border-branding-orange/30 pl-2">
            {["l4", "l5"].map((id) => (
              <div key={id} data-node-id={id} className="pl-3">
                <FlowCard node={getNode(id)} isVisible={visibleNodes.has(id)} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <div className="size-3 rounded border-2 border-branding-dark/60 bg-white" />
            PvB-beoordelaar
          </h3>
          <div className="space-y-2 border-l-2 border-branding-dark/30 pl-2">
            {["b4", "b5"].map((id) => (
              <div key={id} data-node-id={id} className="pl-3">
                <FlowCard node={getNode(id)} isVisible={visibleNodes.has(id)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
