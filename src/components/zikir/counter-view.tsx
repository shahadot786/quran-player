"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeftIcon, FlagIcon, RotateCcwIcon, SunIcon, Trash2Icon, Undo2Icon, VibrateIcon, VibrateOffIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { useWakeLock, wakeLockSupported } from "@/hooks/use-wake-lock";
import { localDateKey } from "@/lib/format";
import { Feedback } from "@/lib/zikir/feedback";
import { dayTotal } from "@/lib/zikir/stats";
import type { RunRef, ZikirView } from "@/lib/zikir/types";
import { counterState, type CounterStep } from "@/lib/zikir/view";
import { useHydrated } from "@/stores/hydration";
import { isBuiltInRemoved, runKey, useZikirStore } from "@/stores/zikir-store";
import { CounterStage } from "./counter-stage";
import { GoalLine } from "./goal-line";
import { useAnnouncement } from "./use-announcement";
import { useZikirText } from "./use-zikir-text";

export function CounterView({ id }: { id: string }) {
  const t = useTranslations("zikir.counter");
  const hydrated = useHydrated();
  const text = useZikirText();
  const removed = useZikirStore((s) => isBuiltInRemoved(s, id));
  const item = text.itemView(id);
  const group = item ? undefined : text.groupView(id);

  if (!hydrated) return <Skeleton role="status" aria-label={t("back")} className="mx-auto h-96 max-w-xl rounded-2xl" />;
  if ((!item && !group) || removed) {
    return (
      <EmptyState
        action={
          <Button asChild>
            <Link href="/zikir">{t("backToLibrary")}</Link>
          </Button>
        }
      >
        {t("notFound")}
      </EmptyState>
    );
  }

  const ref: RunRef = item ? { kind: "item", id: item.id } : { kind: "group", id: group!.id };
  const steps: CounterStep[] = item
    ? [{ itemId: item.id, name: item.name, target: item.target }]
    : group!.steps.map((step) => ({ itemId: step.itemId, name: step.name, target: step.target }));
  const shown = (item ?? group)!;
  return <Counter key={id} reference={ref} title={shown.name} description={item ? "" : group!.description} builtIn={shown.builtIn} dailyGoal={shown.dailyGoal} steps={steps} />;
}

const VIEWS: ZikirView[] = ["beads", "dial", "simple"];

type CounterProps = { reference: RunRef; title: string; description: string; builtIn: boolean; dailyGoal: number | null; steps: CounterStep[] };

function Counter({ reference, title, description, builtIn, dailyGoal, steps }: CounterProps) {
  const t = useTranslations("zikir.counter");
  const tZikir = useTranslations("zikir");
  const tEditor = useTranslations("zikir.editor");
  const router = useRouter();
  const n = useLocalizedNumber();
  const text = useZikirText();
  const feedback = useRef(new Feedback());
  const run = useZikirStore((s) => s.runs[runKey(reference)]);
  const settings = useZikirStore((s) => s.settings);
  const today = useZikirStore((s) => dayTotal(s.counts, localDateKey()));
  const [completed, setCompleted] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useWakeLock(settings.keepAwake);
  const state = counterState(run, steps);
  const current = text.itemView(state.step.itemId);
  const isGroup = reference.kind === "group";
  const limited = state.step.target !== null;

  const announcement = useAnnouncement(
    completed ? t("completed") : limited ? t("announce", { done: n(state.count), total: n(state.step.target!) }) : t("countedUnlimited", { done: n(state.count) }),
  );

  const count = () => {
    setCompleted(false);
    const result = useZikirStore.getState().tap(reference);
    if (!result) return;
    feedback.current.play(result.roundDone ? "round" : result.stepDone ? "step" : "count", settings);
    if (result.roundDone) setCompleted(true);
  };

  const store = useZikirStore.getState();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/zikir">
            <ArrowLeftIcon />
            {t("back")}
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground tabular-nums">{t("today", { count: n(today) })}</p>
      </div>

      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {isGroup && (
          <p className="text-sm text-muted-foreground">
            {t("step", { current: n(state.stepIndex + 1), total: n(steps.length) })} · {state.step.name}
          </p>
        )}
        {description && !isGroup && <p className="text-sm text-muted-foreground">{description}</p>}
      </header>

      {dailyGoal !== null && (
        <div className="w-full max-w-xs">
          <GoalLine kind={reference.kind} id={reference.id} goal={dailyGoal} />
        </div>
      )}

      <div className="flex flex-col items-center gap-2 text-center">
        {current?.arabic && (
          <p className="font-arabic text-4xl leading-loose sm:text-5xl" lang="ar" dir="rtl">
            {current.arabic}
          </p>
        )}
        {current?.transliteration && <p className="text-sm text-muted-foreground">{current.transliteration}</p>}
        {current?.meaning && <p className="max-w-prose text-sm text-balance">{current.meaning}</p>}
      </div>

      <div role="group" aria-label={t("view")} className="flex gap-1 rounded-lg bg-muted p-1">
        {VIEWS.map((choice) => (
          <Button key={choice} size="sm" variant={settings.view === choice ? "default" : "ghost"} aria-pressed={settings.view === choice} onClick={() => store.setSettings({ view: choice })}>
            {t(`views.${choice}`)}
          </Button>
        ))}
      </div>

      <CounterStage
        view={settings.view}
        label={t("countButton", { name: state.step.name })}
        count={state.count}
        target={state.step.target}
        ratio={state.ratio}
        complete={completed}
        onCount={count}
      />

      <div className="flex min-h-12 flex-col items-center gap-1 text-center">
        {completed ? (
          <>
            <p className="font-semibold text-primary">{t("completed")}</p>
            <p className="text-sm text-muted-foreground">{t("completedHint")}</p>
          </>
        ) : (
          isGroup && state.nextStep && <p className="text-sm text-muted-foreground">{t("next", { name: state.nextStep.name })}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" disabled={!state.canUndo || completed} onClick={() => store.undo(reference)}>
          <Undo2Icon />
          {t("undo")}
        </Button>
        <Button variant="outline" disabled={!run} onClick={() => setConfirmReset(true)}>
          <RotateCcwIcon />
          {t("reset")}
        </Button>
        <Button
          variant="outline"
          disabled={!run || state.done === 0}
          onClick={() => {
            if (store.finishRun(reference)) toast(t("finished"));
          }}
        >
          <FlagIcon />
          {t("finish")}
        </Button>
        <Button variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}>
          <Trash2Icon />
          {t("delete")}
        </Button>
        <Button variant="ghost" size="icon" aria-pressed={settings.sound} aria-label={t("sound")} onClick={() => store.setSettings({ sound: !settings.sound })}>
          {settings.sound ? <Volume2Icon /> : <VolumeXIcon />}
        </Button>
        {wakeLockSupported() && (
          <Button variant="ghost" size="icon" aria-pressed={settings.keepAwake} aria-label={t("keepAwake")} onClick={() => store.setSettings({ keepAwake: !settings.keepAwake })}>
            <SunIcon />
          </Button>
        )}
        <Button variant="ghost" size="icon" aria-pressed={settings.haptics} aria-label={t("vibration")} onClick={() => store.setSettings({ haptics: !settings.haptics })}>
          {settings.haptics ? <VibrateIcon /> : <VibrateOffIcon />}
        </Button>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={tZikir(reference.kind === "item" ? "delete.itemTitle" : "delete.groupTitle", { name: title })}
        description={builtIn ? `${tZikir("delete.description")} ${tZikir("delete.builtInHint")}` : tZikir("delete.description")}
        confirmLabel={tZikir("delete.confirm")}
        cancelLabel={tEditor("cancel")}
        destructive
        onConfirm={() => {
          if (reference.kind === "group") store.deleteGroup(reference.id);
          else {
            const result = store.deleteItem(reference.id);
            if (!result.ok) {
              toast.error(tZikir("delete.inUse", { name: title, groups: result.groups.join(", ") }));
              return;
            }
          }
          toast(t("deleteDone"));
          router.push("/zikir");
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t("resetTitle")}
        description={t("resetDescription")}
        confirmLabel={t("resetConfirm")}
        cancelLabel={tEditor("cancel")}
        onConfirm={() => {
          store.resetRun(reference);
          setCompleted(false);
        }}
      />
    </div>
  );
}
