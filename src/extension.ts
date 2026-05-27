import * as vscode from "vscode";
import { setInterval } from "timers";
import { ClaudeUsageViewProvider, UsageData } from "./usagePanel";

let myStatusBarItem: vscode.StatusBarItem;
let provider: ClaudeUsageViewProvider; // Tambahkan variabel provider

export function activate(context: vscode.ExtensionContext) {
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
    const response = await fetch("https://ai.bluepack.my.id/api/check-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: vscode.workspace.getConfiguration("claudeUsage").get("identifier") || "driya_" }),
    });

    if (!response.ok) throw new Error("Gagal koneksi ke server");

    const data = await response.json() as UsageData;

    // Update Text Status Bar
    myStatusBarItem.text = `$(cloud) Claude: ${data.current_req}/${data.max_req}`;
    myStatusBarItem.tooltip = `Hourly: ${data.current_req}/${data.max_req} (${data.percent_5h}%)\nWeekly: ${data.weekly_usage}/${data.max_weekly} (${data.percent_weekly}%)`;

    // 3. Kirim data ke Sidebar UI untuk diperbarui
    provider.updateData(data);

  } catch (error) {
    myStatusBarItem.text = `$(error) Error`;
    myStatusBarItem.tooltip = "Gagal mengambil data dari API.";
  }
}

export function deactivate() {}