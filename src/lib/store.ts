import fs from "node:fs/promises";
import path from "node:path";
import type { ExperimentRun } from "./core";

const directory = path.join(
  process.cwd(),
  "data",
  "runtime"
);

const filename = path.join(directory, "runs.json");

let queue: Promise<void> = Promise.resolve();

export async function listRuns(): Promise<ExperimentRun[]> {
  try {
    const raw = await fs.readFile(filename, "utf8");
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data)
      ? data as ExperimentRun[]
      : [];
  } catch {
    return [];
  }
}

export async function getRun(
  id: string
): Promise<ExperimentRun | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const all = await listRuns();
  return all.find(run => run.id === id);
}

export async function saveRun(run: ExperimentRun) {
  const task = queue.catch(() => {}).then(async () => {
    await fs.mkdir(directory, { recursive: true });

    const current = await listRuns();
    const next = [
      run,
      ...current.filter(item => item.id !== run.id)
    ].slice(0, 150);

    const temporary = filename + ".tmp";
    await fs.writeFile(
      temporary,
      JSON.stringify(next, null, 2),
      "utf8"
    );
    await fs.rename(temporary, filename);
  });

  queue = task.catch(() => {});
  await task;
}
