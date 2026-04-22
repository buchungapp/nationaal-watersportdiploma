"use client";

import { useState } from "react";
import {
  AiChat,
  type AiChatInitialMessage,
  type AiChatSlashCommand,
  type AiChatStarter,
} from "~/app/_components/ai-chat";
import type { ProfielOption } from "../../portfolios/_components/upload/useUploadPortfolioForm";
import type { ChatScope } from "../_lib/chat-context";
import type { LeercoachRubric, LeercoachWerkproces } from "../_lib/rubric";
import { Artefact } from "./Artefact";
import { AttachmentMenu } from "./AttachmentMenu";
import {
  type ArtefactRow,
  useArtefactDropHandler,
  useArtefactPasteHandler,
  useArtefactSubmitBlock,
} from "./artefact-context";
import { ChangeScopeDialog } from "./ChangeScopeDialog";
import {
  buildCompactAndRetryRenderer,
  CompactWarnBanner,
} from "./CompactionControls";
import { Panes } from "./Panes";
import { PortfolioPane, type PortfolioVersionSummary } from "./PortfolioPane";
import { PortfolioUpload } from "./PortfolioUpload";
import { PromoteToPortfolioDialog } from "./PromoteToPortfolioDialog";
import { RefreshOnAssistantResponse } from "./RefreshOnAssistantResponse";
import { ScopeReference } from "./ScopeReference";
import { UnifiedToolbar } from "./UnifiedToolbar";

// Minimal shape the toolbar's scope-change dialog needs. We keep it
// tied to the component instead of threading through yet another
// shared type.
type ProfielMeta = {
  niveauRang: number;
  kerntaken: Array<{ id: string; titel: string; rang: number }>;
};

type Props = {
  handle: string;
  chatId: string;
  initialMessages: AiChatInitialMessage[];
  /** Full profiel list for the portfolio upload dialog's picker. */
  profielen: ProfielOption[];
  /**
   * All instructiegroepen. Fed to PromoteToPortfolioDialog so the user
   * can pick one when promoting a Q&A chat to a richting=instructeur
   * portfolio. Filter-by-richting happens client-side; the list is
   * small (~4 rows) so we ship it whole.
   */
  instructieGroepen: Array<{
    id: string;
    title: string;
    richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  }>;
  /**
   * Current chat's profielId — pre-selected in the portfolio upload
   * picker. Null for vraag-sessies; the upload dialog's picker falls
   * back to the first profiel in the list.
   */
  currentProfielId: string | null;
  /**
   * How many prior portfolios the kandidaat has already uploaded.
   * Drives the "I've already written one" starter chip: when > 0 we
   * prompt the leercoach to open the uploads directly (imperative); when
   * 0 we keep the hypothetical "what happens if I upload?" wording.
   */
  priorPortfolioCount: number;
  /** Existing artefacten for this chat (server-rendered). */
  initialArtefacten: ArtefactRow[];
  /**
   * Full rubric for the chat's profiel (server-loaded). Null when
   * resolution failed — the drawer is hidden in that case. Used as
   * metadata for the storyline overview (header title + richting).
   */
  rubric: LeercoachRubric | null;
  /**
   * Werkprocessen already filtered to the chat's scope, server-side.
   * Empty array is tolerated and renders an empty-state in the
   * drawer.
   */
  scopedWerkprocessen: LeercoachWerkproces[];
  /**
   * True when the chat row had a non-null `activeStreamId` at server
   * render time — i.e. there's a generation running in the background
   * that this mount should reconnect to. Drives useChat's `resume`
   * prop; false on fresh loads where we start idle.
   */
  initialResume: boolean;
  /** Pre-computed chat title shown in the toolbar. */
  title: string;
  /**
   * Current scope of the chat — feeds the ChangeScopeDialog. Null for
   * vraag-sessies; the scope-change dialog is hidden in that case
   * (scope change requires a profiel to scope against).
   */
  currentScope: ChatScope | null;
  /**
   * Metadata needed to render the ChangeScopeDialog. Null on N3
   * profielen (Q1 rule: N3 is always full_profiel and can't change) —
   * the toolbar's actions menu hides the scope entry when absent.
   */
  profielMeta: ProfielMeta | null;
  /**
   * Server-computed flag: true when the model-active (uncompacted)
   * portion of the chat is approaching the context limit. Drives the
   * amber "Nu comprimeren" banner above the message list. Refreshes
   * on every server render (which happens after each streamed turn
   * via RefreshOnAssistantResponse), so the banner appears naturally
   * the first turn it's warranted.
   */
  shouldWarnCompaction: boolean;
  /**
   * Portfolio attached to this chat. Null for legacy chats created
   * before the portfolio model landed; the doc pane hides in that
   * case. All new chats get a portfolio_id at creation time.
   */
  portfolio: {
    portfolioId: string;
    currentVersionId: string | null;
    currentContent: string;
    versions: PortfolioVersionSummary[];
  } | null;
  /**
   * Initial pane focus. "doc" starts the shell with the chat pane
   * collapsed and the document pane at full width — the landing mode
   * for users who clicked "Bewerk concept" on the portfolio detail
   * page. Defaults to undefined (normal chat-first layout).
   */
  initialFocus?: "doc";
};

// Thin leercoach-specific wrapper around AiChatWindow. Renders three
// nested providers: Artefact (chat-scoped uploads), PortfolioUpload
// (user-scoped prior portfolios), and AiChat (the chat itself). A
// unified ChatToolbar sits above the message list; the composer
// integrates artefact + portfolio uploads via a single "+" menu.
export function ChatShell({
  handle,
  chatId,
  initialMessages,
  profielen,
  instructieGroepen,
  currentProfielId,
  priorPortfolioCount,
  initialArtefacten,
  rubric,
  scopedWerkprocessen,
  initialResume,
  title,
  currentScope,
  profielMeta,
  shouldWarnCompaction,
  portfolio,
  initialFocus,
}: Props) {
  // The storyline drawer is only available when we could resolve the
  // rubric — if resolution failed, the rest of the chat still works,
  // the drawer just isn't rendered. A nullable Provider keeps the
  // compound tree simple; consumers of useScopeReferenceContext()
  // only render inside the guard below.
  const inner = (
    <>
      <ChatInner
        handle={handle}
        chatId={chatId}
        initialMessages={initialMessages}
        priorPortfolioCount={priorPortfolioCount}
        hasRubric={rubric !== null}
        initialResume={initialResume}
        title={title}
        currentScope={currentScope}
        profielMeta={profielMeta}
        shouldWarnCompaction={shouldWarnCompaction}
        portfolio={portfolio}
        profielen={profielen}
        instructieGroepen={instructieGroepen}
        initialFocus={initialFocus}
      />
      <Artefact.UploadDialog />
    </>
  );

  return (
    <Artefact.Provider
      handle={handle}
      chatId={chatId}
      initialArtefacten={initialArtefacten}
    >
      <PortfolioUpload.Provider
        handle={handle}
        profielen={profielen}
        currentProfielId={currentProfielId}
      >
        {rubric ? (
          <ScopeReference.Provider
            rubric={rubric}
            scopedWerkprocessen={scopedWerkprocessen}
            chatId={chatId}
          >
            {inner}
          </ScopeReference.Provider>
        ) : (
          inner
        )}
      </PortfolioUpload.Provider>
    </Artefact.Provider>
  );
}

function ChatInner({
  handle,
  chatId,
  initialMessages,
  priorPortfolioCount,
  hasRubric,
  initialResume,
  title,
  currentScope,
  profielMeta,
  shouldWarnCompaction,
  portfolio,
  profielen,
  instructieGroepen,
  initialFocus,
}: {
  handle: string;
  chatId: string;
  initialMessages: AiChatInitialMessage[];
  priorPortfolioCount: number;
  hasRubric: boolean;
  initialResume: boolean;
  title: string;
  currentScope: ChatScope | null;
  profielMeta: ProfielMeta | null;
  shouldWarnCompaction: boolean;
  portfolio: Props["portfolio"];
  profielen: ProfielOption[];
  instructieGroepen: Props["instructieGroepen"];
  initialFocus?: Props["initialFocus"];
}) {
  const handlePaste = useArtefactPasteHandler();
  const handleDrop = useArtefactDropHandler();
  const submitBlock = useArtefactSubmitBlock();
  // Q&A-sessie = no scope means no profiel. Toggles everything from
  // starters to toolbar affordances that only make sense with a
  // portfolio bound to the chat.
  const isQA = currentScope === null;
  const starters = buildStarters({ priorPortfolioCount, isQA });

  // Scope dialog open state lives here so the dialog can be rendered
  // OUTSIDE the actions menu — Headless UI would otherwise unmount
  // the dialog when the menu closes, losing its transient form state.
  const [scopeOpen, setScopeOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const canChangeScope = profielMeta !== null && profielMeta.niveauRang >= 4;
  // "Koppel aan portfolio" is available exactly for vraag-sessies.
  // Once promoted the chat is a portfolio-sessie and this option
  // disappears.
  const canPromoteToPortfolio = isQA;

  // Chat body uses the AiChat compound pieces directly (Frame /
  // MessageList / ErrorBanner / Starters / InputForm) instead of the
  // <AiChatWindow> wrapper. Reason: AiChatWindow provides its own
  // AiChat.Provider internally, but we need the provider to wrap the
  // WHOLE shell (toolbar, Rubriek pane, Document pane) so any
  // descendant can read the AiChat context. Lifting the provider up
  // here keeps toolbar + all three panes on the same context.
  //
  // Rendered once as `chatBody`; Panes.Layout decides whether to show
  // it. Keeping a single instance means pane toggles don't remount
  // useChat (which would drop in-flight streams).
  const chatBody = (
    <AiChat.Frame>
      <Artefact.ErrorBanner />
      {shouldWarnCompaction ? <CompactWarnBanner chatId={chatId} /> : null}
      <AiChat.MessageList />
      <AiChat.ErrorBanner
        renderRetryAction={buildCompactAndRetryRenderer(chatId)}
      />
      <AiChat.Starters />
      {/* Renderless bridges, each reading the AiChat context. */}
      <Artefact.CommitOnSend />
      <RefreshOnAssistantResponse />
      <PortfolioUpload.AutoSendBridge />
      <AiChat.InputForm
        topChildren={<Artefact.ChipStrip />}
        leftActions={<AttachmentMenu />}
        slashCommands={LEERCOACH_SLASH_COMMANDS}
      />
    </AiChat.Frame>
  );

  // Doc pane content. The stone-50 tonal background is applied INSIDE
  // the node so the tone travels with the content regardless of
  // whether Panes.Layout renders it solo (full-width) or inside the
  // resizable Group.
  const docBody = portfolio ? (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-stone-50">
      <PortfolioPane
        portfolioId={portfolio.portfolioId}
        currentVersionId={portfolio.currentVersionId}
        currentContent={portfolio.currentContent}
        versions={portfolio.versions}
        handle={handle}
        chatId={chatId}
      />
    </div>
  ) : null;

  return (
    <AiChat.Provider
      chatId={chatId}
      initialMessages={initialMessages}
      apiEndpoint="/api/leercoach/chat"
      starters={starters}
      handlePaste={handlePaste}
      handleDrop={handleDrop}
      submitBlock={submitBlock}
      resume={initialResume}
      cancelEndpoint={(id) => `/api/leercoach/chat/${id}/stream`}
    >
      {/* Panes.Provider lifts the three pane visibility states so the
          toolbar toggles and the layout all read from the same source
          of truth — no pane booleans thread through UnifiedToolbar,
          and the "at least one pane visible" guard is expressed in
          one place (see panes-context.ts + Panes.tsx). */}
      <Panes.Provider
        hasRubriek={hasRubric}
        hasDoc={portfolio !== null}
        chatId={chatId}
        initialDocOpen={portfolio !== null}
        // Doc-focused entry (from the portfolio detail page's "Bewerk
        // concept" action): start with the chat pane collapsed so the
        // editor gets full width. The stream still runs; the user is
        // one toggle away from the conversation. Only makes sense
        // when there IS a doc — otherwise we'd render an empty shell.
        initialChatOpen={!(initialFocus === "doc" && portfolio !== null)}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <UnifiedToolbar
            backHref={`/profiel/${handle}/leercoach`}
            backLabel="Alle sessies"
            title={title}
            canChangeScope={canChangeScope}
            onOpenScopeDialog={() => setScopeOpen(true)}
            canPromoteToPortfolio={canPromoteToPortfolio}
            onOpenPromoteDialog={() => setPromoteOpen(true)}
            chatId={chatId}
          />
          <div className="flex flex-1 overflow-hidden">
            <Panes.Layout
              rubriek={<ScopeReference.Pane />}
              chat={chatBody}
              doc={docBody}
            />
          </div>
        </div>
      </Panes.Provider>
      {canChangeScope && profielMeta && currentScope !== null ? (
        <ChangeScopeDialog
          open={scopeOpen}
          onClose={() => setScopeOpen(false)}
          handle={handle}
          chatId={chatId}
          niveauRang={profielMeta.niveauRang}
          kerntaken={profielMeta.kerntaken}
          currentScope={currentScope}
        />
      ) : null}
      {canPromoteToPortfolio ? (
        <PromoteToPortfolioDialog
          open={promoteOpen}
          onClose={() => setPromoteOpen(false)}
          handle={handle}
          chatId={chatId}
          profielen={profielen}
          instructieGroepen={instructieGroepen}
        />
      ) : null}
    </AiChat.Provider>
  );
}

// Four starter chips matching the archetypes in the opening message.
// Each chip sends a full first-person prompt so the leercoach knows
// exactly where the kandidaat is and can respond without another round
// of "waar begin je?".
//
// Key distinction: "eerdere portfolio's voor lager niveau" is a
// different starting point than "materiaal voor dit portfolio" —
// collapsing them confused N4/N5 kandidaten with N3 portfolios in the
// drawer.
function buildStarters({
  priorPortfolioCount,
  isQA,
}: {
  priorPortfolioCount: number;
  /**
   * True for vraag-sessies (no profielId / no portfolio). The four
   * portfolio-archetype chips don't fit — we show Q&A-oriented entry
   * points instead.
   */
  isQA: boolean;
}): AiChatStarter[] {
  if (isQA) {
    return [
      {
        label: "Wat is het verschil tussen instructeur 3 en 4?",
        prompt:
          "Wat verandert er tussen instructeur niveau 3 en niveau 4 in de KSS? Noem de belangrijkste verschillen in taken, verantwoordelijkheden en wat een PvB-beoordelaar op niveau 4 extra zoekt.",
      },
      {
        label: "Wat hoort er in een PvB-portfolio?",
        prompt:
          "Kun je me globaal uitleggen hoe een PvB-portfolio eruitziet? Welke onderdelen, wat verwacht een beoordelaar, en hoe verhouden werkprocessen en criteria zich tot elkaar?",
      },
      {
        label: "Ik wil mijn portfolio gaan schrijven",
        prompt:
          "Ik wil nu serieus aan mijn portfolio beginnen. Welke stappen zet ik om een portfolio-sessie op te zetten, en wat heb ik daarvoor bij de hand nodig?",
      },
    ];
  }

  const hasPriorPortfolios = priorPortfolioCount > 0;
  return [
    {
      label: "Leg me uit wat dit portfolio moet zijn",
      prompt:
        "Kun je me eerst uitleggen wat dit portfolio moet zijn? Hoe is het opgebouwd, wat zoekt een beoordelaar, en waar werk ik uiteindelijk naartoe? Ik wil overzicht voor we aan de slag gaan.",
    },
    hasPriorPortfolios
      ? {
          // Imperative: the kandidaat has uploaded — ask the leercoach
          // to pick it up directly. Phrasing is deliberately
          // unambiguous ("mijn eerder werk staat al geüpload") so the
          // model calls searchPriorPortfolio on the first turn instead
          // of explaining a hypothetical workflow.
          label: "Pak mijn geüploade portfolio erbij",
          prompt:
            "Mijn eerdere PvB-portfolio staat al geüpload. Kijk er eens naar, vat in je eigen woorden samen wat je ziet, en stel me een paar vragen zodat we kunnen zien waar ik nu sta en waar de groei naartoe moet voor dit niveau.",
        }
      : {
          // No uploads yet: keep the hypothetical wording so the
          // leercoach can explain the workflow + point at the 📎.
          label: "Ik heb eerdere PvB-portfolio's geschreven",
          prompt:
            "Ik heb voor een lager niveau al een PvB-portfolio geschreven, maar nog niet geüpload. Hoe gaat dat in z'n werk, en hoe gaan we er daarna mee werken?",
        },
    {
      label: "Ik heb aantekeningen voor dit portfolio",
      prompt:
        "Ik heb al aantekeningen of wat tekst voor dit specifieke portfolio liggen. Kun je me helpen om dat materiaal bij elkaar te brengen? Ik kan het zo delen zodra je klaar bent.",
    },
    {
      label: "Ik begin helemaal blanco",
      prompt:
        "Ik begin helemaal blanco. Geen eerdere portfolio's, geen aantekeningen, we starten vanaf nul. Waar zullen we starten? Stel gerust eerst een paar vragen om erachter te komen wat ik al heb meegemaakt in mijn praktijk.",
    },
  ];
}

// Slash commands surfaced in the composer when the kandidaat types
// `/`. Intentionally small + high-value — each one is a phrasing
// kandidaten repeatedly produce naturally, now shortened into a
// keyboard-first shortcut. Add more only as usage patterns emerge.
//
// Trigger matching is case-insensitive substring against trigger OR
// label, so `/con` finds `concept` and `/op` finds `opnieuw`.
const LEERCOACH_SLASH_COMMANDS: AiChatSlashCommand[] = [
  {
    kind: "template",
    trigger: "concept",
    label: "Concept schrijven",
    description:
      "Vraag een eerste bewijs-paragraaf voor een werkproces. Typ daarna de code (bv. 5.3.2).",
    // Trailing space invites the kandidaat to type the werkproces
    // code without adding another keystroke.
    template: "Schrijf een eerste concept voor werkproces ",
  },
  {
    kind: "template",
    trigger: "voorbeeld",
    label: "Voorbeeld ophalen",
    description:
      "Laat een geanonimiseerd voorbeeld zien voor een specifiek criterium. Typ werkproces.criterium (bv. 5.3.2.1).",
    template: "Kun je een voorbeeld ophalen voor werkproces ",
  },
  {
    kind: "template",
    trigger: "gaten",
    label: "Gaten in bewijs",
    description:
      "Audit welke criteria in scope nog niet voldoende gedekt zijn.",
    template:
      "Welke criteria in scope hebben we nog niet voldoende gedekt? Noem per werkproces wat nog mist en wat voor soort moment we nog nodig hebben.",
  },
  {
    kind: "template",
    trigger: "samenvat",
    label: "Sessie samenvatten",
    description:
      "Korte samenvatting van wat we tot nu toe besproken hebben per werkproces.",
    template:
      "Vat samen wat we in deze sessie tot nu toe hebben besproken per werkproces — wat ligt er, wat zijn de rode draden.",
  },
  {
    kind: "action",
    trigger: "opnieuw",
    label: "Opnieuw proberen",
    description:
      "Regenereer de laatste reactie (sneltoets voor de inline button onder de laatste bubbel).",
    actionId: "regenerate",
  },
];
