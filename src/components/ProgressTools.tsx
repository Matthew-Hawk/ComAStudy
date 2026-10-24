import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useStudy } from "../storage";
import {
  exportProgress,
  importProgress,
  type Progress,
} from "../persistence/model";
export function downloadProgress(progress: Progress) {
  const blob = new Blob([exportProgress(progress, Date.now())], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "study-progress.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ProgressTools() {
  const { progress, replace } = useStudy();
  const [candidate, setCandidate] = useState<Progress | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  function download() {
    downloadProgress(progress);
    setMessage("Progress exported. Keep this file somewhere safe.");
  }
  async function read(file?: File) {
    if (!file) return;
    setMessage("");
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error(
          "This file is too large to be a progress export (maximum 5 MB).",
        );
      const parsed = importProgress(await file.text(), Date.now());
      setCandidate(parsed);
      dialog.current?.showModal();
    } catch (error) {
      setCandidate(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not read this file. No progress was changed.",
      );
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  function close() {
    if (busy) return;
    dialog.current?.close();
    setCandidate(null);
    input.current?.focus();
  }
  async function confirm() {
    if (!candidate || busy) return;
    setBusy(true);
    try {
      const ok = await replace(candidate);
      if (ok) {
        dialog.current?.close();
        setCandidate(null);
        setMessage("Your imported progress is ready.");
      } else
        setMessage(
          "The import could not be saved. Your current progress is unchanged.",
        );
    } catch {
      setMessage(
        "The import could not be saved. Your current progress is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="preference-card">
      <h2>Your progress</h2>
      <p className="helper">
        Export a backup or move your progress to another browser. Import
        replaces this device’s progress and preferences.
      </p>
      <div className="button-row">
        <button className="secondary" onClick={download}>
          <Download size={17} /> Export Progress
        </button>
        <label className="secondary import-button">
          <Upload size={17} /> Import Progress
          <input
            ref={input}
            type="file"
            accept="application/json,.json"
            aria-label="Import Progress"
            onChange={(e) => void read(e.target.files?.[0])}
          />
        </label>
      </div>
      <p role="status" className="helper">
        {message}
      </p>
      <dialog
        ref={dialog}
        aria-labelledby="import-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setCandidate(null);
        }}
        onClose={() => {
          if (!busy) setCandidate(null);
        }}
      >
        <h2 id="import-title">Replace this device’s progress?</h2>
        {candidate && (
          <>
            <p>
              The file contains {Object.keys(candidate.schedules).length}{" "}
              scheduled items, {Object.keys(candidate.objectives).length}{" "}
              section records, {candidate.xp} XP, a {candidate.streak.current}
              -day streak, {candidate.badges.length} badges,{" "}
              {candidate.examHistory.length} practice results, and{" "}
              {candidate.examSession ? "one saved exam" : "no saved exam"}.
            </p>
            <p>
              Your current {progress.xp} XP,{" "}
              {Object.keys(progress.schedules).length} scheduled items, saved
              positions, review session, practice exam and history, daily
              activity, and preferences will be replaced. Export a backup first
              if you want to keep them.
            </p>
          </>
        )}
        {candidate && <p role="status">{message}</p>}
        <div className="button-row">
          <button
            autoFocus
            className="secondary"
            onClick={close}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="primary"
            onClick={() => void confirm()}
            disabled={busy}
          >
            {busy ? "Saving…" : "Replace progress"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
