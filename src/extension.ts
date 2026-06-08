import * as vscode from "vscode";
import { setInterval } from "timers";
import { ClaudeUsageViewProvider, UsageData, CodexUsageData, CodexUsageState } from "./usagePanel";

let myStatusBarItem: vscode.StatusBarItem;
let provider: ClaudeUsageViewProvider; // Tambahkan variabel provider
let secretStorage: vscode.SecretStorage | undefined;
const DEFAULT_CODEX_USAGE_ENDPOINT = "https://chatgpt.com/backend-api/wham/usage";
const CODEX_AUTH_SECRET_KEY = "claudeUsage.codexAuth";

interface CodexAuthSecret {
  type: "bearer" | "cookie";
  value: string;
}

export function activate(context: vscode.ExtensionContext) {
  secretStorage = context.secrets;

  // 1. Inisialisasi Provider untuk Sidebar Explorer
  provider = new ClaudeUsageViewProvider(context.extensionUri);

  // 2. Daftarkan Provider ke view 'claudeUsageView' (PENTING: Pastikan ID ini ada di package.json)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ClaudeUsageViewProvider.viewType, provider)
  );

  const refreshCommand = "claude-usage.refreshData";
  context.subscriptions.push(
    vscode.commands.registerCommand(refreshCommand, () => {
      fetchUsageData();
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("claude-usage.setCodexAuth", async () => {
      await setCodexAuth();
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("claude-usage.clearCodexAuth", async () => {
      await clearCodexAuth();
    }),
  );

  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  myStatusBarItem.command = refreshCommand; // Ubah klik status bar agar merefresh data
  myStatusBarItem.tooltip = "Klik untuk me-refresh data Claude Usage";
  context.subscriptions.push(myStatusBarItem);

  // Initial fetch
  fetchUsageData();

  // Auto refresh setiap 5 menit
  setInterval(() => fetchUsageData(), 300000);
}

async function fetchUsageData() {
  myStatusBarItem.text = `$(sync~spin) Memuat...`;
  myStatusBarItem.show();

  try {
    // Fetch Claude usage
    const response = await fetch("https://ai.bluepack.my.id/api/check-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: vscode.workspace.getConfiguration("claudeUsage").get("identifier") || "driya_" }),
    });

    if (!response.ok) {
      throw new Error("Gagal koneksi ke server");
    }

    const data = await response.json() as UsageData;

    // Update Text Status Bar
    myStatusBarItem.text = `$(cloud) Claude: ${data.current_req}/${data.max_req}`;
    myStatusBarItem.tooltip = `Hourly: ${data.current_req}/${data.max_req} (${data.percent_5h}%)\nWeekly: ${data.weekly_usage}/${data.max_weekly} (${data.percent_weekly}%)`;

    const codexState = await fetchCodexUsageData();
    if (codexState.status === "available") {
      const primary = codexState.data?.rate_limit?.primary_window?.used_percent ?? 0;
      const secondary = codexState.data?.rate_limit?.secondary_window?.used_percent ?? 0;
      myStatusBarItem.tooltip += `\n\nCodex: ${primary}% primary, ${secondary}% secondary`;
    } else {
      myStatusBarItem.tooltip += `\n\nCodex: ${codexState.message}`;
    }

    // 3. Kirim data ke Sidebar UI untuk diperbarui
    provider.updateData(data, codexState);

  } catch (error) {
    myStatusBarItem.text = `$(error) Error`;
    myStatusBarItem.tooltip = "Gagal mengambil data dari API.";
  }
}

async function fetchCodexUsageData(): Promise<CodexUsageState> {
  const config = vscode.workspace.getConfiguration("claudeUsage");
  const codexEndpoint = config.get<string>("codexEndpoint", DEFAULT_CODEX_USAGE_ENDPOINT).trim() || DEFAULT_CODEX_USAGE_ENDPOINT;
  const auth = await getCodexAuth(config);

  if (!auth && codexEndpoint === DEFAULT_CODEX_USAGE_ENDPOINT) {
    return {
      status: "not-configured",
      message: "Jalankan command Set Codex Auth, lalu paste Bearer token atau Cookie dari session ChatGPT.",
    };
  }

  try {
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };

    if (auth?.type === "bearer") {
      headers.Authorization = `Bearer ${auth.value}`;
    } else if (auth?.type === "cookie") {
      headers.Cookie = auth.value;
    }

    const codexResponse = await fetch(codexEndpoint, { headers });

    if (!codexResponse.ok) {
      const needsAuth = codexResponse.status === 401 || codexResponse.status === 403;
      const message = needsAuth && !auth
        ? "Endpoint Codex perlu login/session. Jalankan Set Codex Auth atau pakai endpoint proxy yang sudah authenticated."
        : needsAuth
          ? "Auth Codex ditolak atau sudah expired. Jalankan Set Codex Auth lagi."
          : `Gagal mengambil Codex usage: HTTP ${codexResponse.status}.`;

      return {
        status: "error",
        message,
      };
    }

    const codexData = await codexResponse.json() as CodexUsageData;
    return {
      status: "available",
      data: codexData,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      status: "error",
      message: `Gagal mengambil Codex usage: ${message}.`,
    };
  }
}

async function setCodexAuth() {
  if (!secretStorage) {
    vscode.window.showErrorMessage("SecretStorage VS Code belum tersedia.");
    return;
  }

  const input = await vscode.window.showInputBox({
    prompt: "Paste Bearer token atau Cookie header untuk chatgpt.com/backend-api/wham/usage",
    placeHolder: "Bearer ey... atau Cookie: __Secure-...",
    password: true,
    ignoreFocusOut: true,
  });

  if (!input?.trim()) {
    return;
  }

  const auth = parseCodexAuthInput(input);
  await secretStorage.store(CODEX_AUTH_SECRET_KEY, JSON.stringify(auth));
  vscode.window.showInformationMessage("Codex auth tersimpan. Refreshing usage...");
  fetchUsageData();
}

async function clearCodexAuth() {
  if (!secretStorage) {
    vscode.window.showErrorMessage("SecretStorage VS Code belum tersedia.");
    return;
  }

  await secretStorage.delete(CODEX_AUTH_SECRET_KEY);
  vscode.window.showInformationMessage("Codex auth dihapus.");
  fetchUsageData();
}

async function getCodexAuth(config: vscode.WorkspaceConfiguration): Promise<CodexAuthSecret | undefined> {
  const secret = await secretStorage?.get(CODEX_AUTH_SECRET_KEY);

  if (secret) {
    try {
      return JSON.parse(secret) as CodexAuthSecret;
    } catch {
      await secretStorage?.delete(CODEX_AUTH_SECRET_KEY);
    }
  }

  const legacyToken = config.get<string>("codexBearerToken", "").trim();
  if (legacyToken) {
    return {
      type: "bearer",
      value: stripBearerPrefix(legacyToken),
    };
  }

  return undefined;
}

function parseCodexAuthInput(input: string): CodexAuthSecret {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith("authorization:")) {
    return {
      type: "bearer",
      value: stripBearerPrefix(trimmed.slice("authorization:".length).trim()),
    };
  }

  if (lower.startsWith("bearer ")) {
    return {
      type: "bearer",
      value: stripBearerPrefix(trimmed),
    };
  }

  if (lower.startsWith("cookie:")) {
    return {
      type: "cookie",
      value: trimmed.slice("cookie:".length).trim(),
    };
  }

  if (trimmed.includes("=") && (trimmed.includes(";") || lower.includes("session"))) {
    return {
      type: "cookie",
      value: trimmed,
    };
  }

  return {
    type: "bearer",
    value: trimmed,
  };
}

function stripBearerPrefix(value: string): string {
  return value.toLowerCase().startsWith("bearer ") ? value.slice("bearer ".length).trim() : value.trim();
}

export function deactivate() {}
