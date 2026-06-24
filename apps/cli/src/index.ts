#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

type Config = {
  serverUrl: string;
  apiToken: string;
};

type Draft = {
  date: string;
  today: string;
  tomorrow: string;
  notes: string | null;
  vibe: string | null;
  mood: string | null;
  tags: string[];
};

type UploadResult = {
  date: string;
};

const appDir = join(homedir(), ".my-days");
const draftsDir = join(appDir, "drafts");
const configPath = join(appDir, "config.json");
const moods = new Set(["good", "normal", "tired", "sad", "excited"]);
// mood 支持短输入，降低每天记录时的打字成本。
const moodAliases = new Map([
  ["g", "good"],
  ["n", "normal"],
  ["t", "tired"],
  ["s", "sad"],
  ["e", "excited"]
]);

function todayYmd(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function draftPath(date = todayYmd()): string {
  return join(draftsDir, `${date}.json`);
}

async function ensureAppDirs() {
  await mkdir(draftsDir, { recursive: true });
}

function createPrompt() {
  return createInterface({ input, output });
}

async function ask(question: string): Promise<string> {
  const rl = createPrompt();
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function isYes(value: string): boolean {
  return ["y", "yes"].includes(value.trim().toLowerCase());
}

function isNo(value: string): boolean {
  return ["n", "no"].includes(value.trim().toLowerCase());
}

async function readConfig(): Promise<Config> {
  if (!existsSync(configPath)) {
    throw new Error("Missing config. Run `daylog init` first.");
  }

  return JSON.parse(await readFile(configPath, "utf8")) as Config;
}

async function readDraft(date = todayYmd()): Promise<Draft> {
  const path = draftPath(date);
  if (!existsSync(path)) {
    throw new Error(`No draft found for ${date}. Run \`daylog add\` first.`);
  }

  return JSON.parse(await readFile(path, "utf8")) as Draft;
}

async function initCommand() {
  await ensureAppDirs();
  const serverUrl = (await ask("serverUrl (example: https://mydomain.com): ")).replace(/\/+$/, "");
  const apiToken = await ask("apiToken: ");

  if (!serverUrl || !apiToken) {
    throw new Error("serverUrl and apiToken are required.");
  }

  await writeFile(configPath, JSON.stringify({ serverUrl, apiToken }, null, 2), "utf8");
  console.log(`Saved config to ${configPath}`);
}

function normalizeMood(value: string): string {
  const normalized = moodAliases.get(value.toLowerCase()) ?? value.toLowerCase();

  if (!normalized) return "normal";
  return moods.has(normalized) ? normalized : "normal";
}

async function createDraft(includeVibe: boolean): Promise<Draft | null> {
  await ensureAppDirs();
  const date = todayYmd();
  const path = draftPath(date);

  // draft 是本地缓存，上传失败也不会丢记录。
  if (existsSync(path)) {
    const overwrite = await ask(`Draft for ${date} already exists. Overwrite? (y/N): `);
    if (!isYes(overwrite)) {
      console.log("Keeping existing draft.");
      return null;
    }
  }

  const today = await ask("今天做了什么？\n> ");
  const tomorrow = await ask("明天要做什么？\n> ");
  const notesInput = await ask("额外想记录的内容？可留空\n> ");
  const vibeInput = includeVibe ? await ask("今日 vibe？可留空\n> ") : "";
  const moodInput = await ask("mood? [good/normal/tired/sad/excited] default normal: ");
  const tagsInput = await ask("tags? comma separated, optional: ");
  const tags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const draft: Draft = {
    date,
    today,
    tomorrow,
    notes: notesInput || null,
    vibe: vibeInput || null,
    mood: normalizeMood(moodInput),
    tags
  };

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(draft, null, 2), "utf8");
  console.log(`Saved draft to ${path}`);
  return draft;
}

async function uploadDraft(draft: Draft, config: Config): Promise<UploadResult> {
  const url = `${config.serverUrl.replace(/\/+$/, "")}/api/logs`;

  // 服务器端只接受带 API Token 的写入请求。
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiToken}`
    },
    body: JSON.stringify(draft)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed (${response.status}). Draft kept. ${text}`);
  }

  return (await response.json()) as UploadResult;
}

async function pushDraft(draft?: Draft): Promise<UploadResult> {
  const config = await readConfig();
  const draftToUpload = draft ?? (await readDraft());
  const result = await uploadDraft(draftToUpload, config);
  console.log(`Uploaded ${result.date} successfully. Draft kept at ${draftPath(result.date)}`);
  console.log(`View: ${config.serverUrl.replace(/\/+$/, "")}/days/${result.date}`);
  return result;
}

async function addCommand() {
  const draft = await createDraft(hasFlag("--vibe"));
  if (!draft) return;

  const uploadAnswer = await ask("Upload now? (Y/n): ");
  if (isNo(uploadAnswer)) {
    console.log("Draft saved locally. Run `daylog push` when you are ready.");
    return;
  }

  await pushDraft(draft);
}

async function doneCommand() {
  const draft = await createDraft(hasFlag("--vibe"));
  if (!draft) return;

  await pushDraft(draft);
}

async function todayCommand() {
  const draft = await readDraft();
  console.log(JSON.stringify(draft, null, 2));
}

function parseYmd(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function ymdFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateStats(dates: string[]) {
  const set = new Set(dates);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let currentStreak = 0;
  let cursor = new Date(year, month, now.getDate());

  while (set.has(ymdFromDate(cursor))) {
    currentStreak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return {
    totalDays: set.size,
    currentStreak,
    monthDays: dates.filter((date) => {
      const parsed = parseYmd(date);
      return parsed.getFullYear() === year && parsed.getMonth() === month;
    }).length,
    yearDays: dates.filter((date) => parseYmd(date).getFullYear() === year).length
  };
}

async function statsCommand() {
  const config = await readConfig();
  const response = await fetch(`${config.serverUrl.replace(/\/+$/, "")}/api/logs`);

  if (!response.ok) {
    throw new Error(`Failed to load logs (${response.status}).`);
  }

  const logs = (await response.json()) as Array<{ date: string }>;
  const stats = calculateStats(logs.map((log) => log.date));

  console.log(`Total days: ${stats.totalDays}`);
  console.log(`Current streak: ${stats.currentStreak}`);
  console.log(`This month: ${stats.monthDays}`);
  console.log(`This year: ${stats.yearDays}`);
}

function printHelp() {
  console.log(`daylog commands:
  init          Create ~/.my-days/config.json
  add           Create today's draft, then ask whether to upload
  add --vibe    Create today's draft with vibe, then ask whether to upload
  done          Create today's draft and upload immediately
  done --vibe   Create today's draft with vibe and upload immediately
  push          Upload today's draft
  today         Show today's local draft
  stats         Show remote stats
`);
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "init":
      await initCommand();
      break;
    case "add":
      await addCommand();
      break;
    case "done":
      await doneCommand();
      break;
    case "push":
      await pushDraft();
      break;
    case "today":
      await todayCommand();
      break;
    case "stats":
      await statsCommand();
      break;
    case undefined:
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
