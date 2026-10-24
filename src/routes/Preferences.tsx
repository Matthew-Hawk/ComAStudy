import { useRef, useState } from "react";
import { useStudy, emptyProgress } from "../storage";
import { ProgressTools, downloadProgress } from "../components/ProgressTools";
import { APP_NAME } from "../config";
import { APP_VERSION } from "../persistence/model";
export default function Preferences() {
  const { progress, update, reset } = useStudy();
  const [word, setWord] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className="narrow-page">
      <div className="eyebrow">MAKE ROOM FOR FOCUS</div>
      <h1>Your preferences</h1>
      <p>Make this workspace comfortable for you.</p>
      <section className="preference-card settings-grid">
        <h2>Appearance and feedback</h2>
        <label>
          Theme
          <select
            value={progress.theme}
            onChange={(e) =>
              update((p) => ({ ...p, theme: e.target.value as typeof p.theme }))
            }
          >
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Animations
          <select
            value={progress.animationMode}
            onChange={(e) =>
              update((p) => ({
                ...p,
                animationMode: e.target.value as typeof p.animationMode,
                motion: e.target.value === "on",
              }))
            }
          >
            <option value="on">On</option>
            <option value="reduced">Reduced</option>
            <option value="off">Off</option>
          </select>
        </label>
        <p className="helper">
          Your system’s reduced-motion preference always takes priority. Reduced
          mode uses static illustrations and removes movement.
        </p>
        <label className="toggle-row">
          <span>Sound effects</span>
          <input
            type="checkbox"
            checked={progress.sound}
            onChange={(e) => update((p) => ({ ...p, sound: e.target.checked }))}
          />
        </label>
      </section>
      <section className="preference-card settings-grid">
        <h2>Study sessions</h2>
        <label>
          Daily review length
          <select
            value={progress.reviewLength}
            onChange={(e) =>
              update((p) => ({
                ...p,
                reviewLength: Number(e.target.value) as typeof p.reviewLength,
              }))
            }
          >
            {[8, 12, 16, 20].map((n) => (
              <option key={n} value={n}>
                {n} items
              </option>
            ))}
          </select>
        </label>
        <label className="toggle-row">
          <span>Show exam timer by default</span>
          <input
            type="checkbox"
            checked={progress.examTimerDefault}
            onChange={(e) =>
              update((p) => ({ ...p, examTimerDefault: e.target.checked }))
            }
          />
        </label>
        <p className="helper">
          Timers are optional, display elapsed time only, and never submit an
          exam.
        </p>
      </section>
      <ProgressTools />
      <section className="preference-card">
        <h2>Reset this device</h2>
        <p className="helper">
          Clear this app’s progress and preferences. Other websites’ data is
          unaffected.
        </p>
        <button
          ref={trigger}
          className="secondary"
          onClick={() => {
            setWord("");
            setMessage("");
            dialog.current?.showModal();
          }}
        >
          Reset progress
        </button>
        <dialog
          ref={dialog}
          aria-labelledby="reset-title"
          onCancel={(e) => {
            if (busy) e.preventDefault();
          }}
          onClose={() => trigger.current?.focus()}
        >
          <h2 id="reset-title">Reset this app’s progress?</h2>
          <p>
            This clears saved lessons, schedules, XP, streaks, badges, exams,
            daily history, and preferences on this device.
          </p>
          <button
            className="secondary"
            onClick={() => downloadProgress(progress)}
          >
            Export a backup first
          </button>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (word !== "RESET") {
                setMessage("Type RESET exactly to confirm.");
                return;
              }
              setBusy(true);
              const ok = await reset();
              setBusy(false);
              if (ok) {
                dialog.current?.close();
                setMessage(
                  "Progress reset. Your workspace is ready for a fresh start.",
                );
              } else
                setMessage(
                  "Progress could not be reset. Your saved progress has not changed.",
                );
            }}
          >
            <label>
              Type RESET to confirm
              <input
                autoFocus
                value={word}
                onChange={(e) => setWord(e.target.value)}
                aria-describedby="reset-message"
                autoComplete="off"
              />
            </label>
            <p id="reset-message" role="status">
              {message}
            </p>
            <div className="button-row">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => dialog.current?.close()}
              >
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Resetting…" : "Confirm reset"}
              </button>
            </div>
          </form>
        </dialog>
        <p role="status">{!dialog.current?.open ? message : ""}</p>
      </section>
      <section className="preference-card">
        <h2>About {APP_NAME}</h2>
        <p>Version {APP_VERSION}</p>
        <p className="helper">
          All lessons and activities use original wording. This independent app
          is not affiliated with or endorsed by CompTIA. Seed content does not
          cover every exam objective.
        </p>
      </section>
    </div>
  );
}
