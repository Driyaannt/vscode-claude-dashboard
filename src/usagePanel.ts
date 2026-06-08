import * as vscode from "vscode";

export interface UsageData {
  base_req: number;
  base_weekly: number;
  boost_5h: number;
  boost_active: boolean;
  boost_expires: string;
  boost_weekly: number;
  cap_applied: boolean;
  current_req: number;
  email: string;
  expires_at: string;
  full_reset_5h: string;
  full_reset_7d: string;
  is_expired: boolean;
  lookup_mode: string;
  max_req: number;
  max_weekly: number;
  percent_5h: number;
  percent_weekly: number;
  plan: string;
  plan_display: string;
  reset_5h: string;
  reset_7d: string;
  timezone: string;
  weekly_usage: number;
}

export interface CodexUsageData {
  user_id: string;
  account_id: string;
  email: string;
  plan_type: string;
  rate_limit: {
    allowed: boolean;
    limit_reached: boolean;
    primary_window: {
      used_percent: number;
      limit_window_seconds: number;
      reset_after_seconds: number;
      reset_at: number;
    };
    secondary_window: {
      used_percent: number;
      limit_window_seconds: number;
      reset_after_seconds: number;
      reset_at: number;
    };
  };
  credits: {
    has_credits: boolean;
    unlimited: boolean;
    overage_limit_reached: boolean;
    balance: string;
    approx_local_messages?: [number, number];
    approx_cloud_messages?: [number, number];
  };
  spend_control?: {
    reached: boolean;
    individual_limit: number | null;
  } | null;
  rate_limit_reset_credits?: {
    available_count: number;
  };
}

export interface CodexUsageState {
  status: "available" | "not-configured" | "error";
  data?: CodexUsageData;
  message?: string;
}

export class ClaudeUsageViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'claudeUsageView';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this.getDashboardHtml();
  }

  public updateData(data: UsageData, codexState?: CodexUsageState) {
    if (this._view) {
      this._view.webview.html = this.getDashboardHtml(data, codexState);
    }
  }

  private getDashboardHtml(data?: UsageData, codexState?: CodexUsageState): string {
    const defaultData: UsageData = {
      base_req: 250, base_weekly: 2500, boost_5h: 0, boost_active: false, boost_expires: "", boost_weekly: 0, cap_applied: false,
      current_req: 0, email: "driya_", expires_at: "", full_reset_5h: "", full_reset_7d: "", is_expired: false, lookup_mode: "username",
      max_req: 250, max_weekly: 2500, percent_5h: 0, percent_weekly: 0, plan: "pro", plan_display: "PRO", reset_5h: "", reset_7d: "",
      timezone: "WIB", weekly_usage: 0,
    };

    const d = data || defaultData;

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: transparent; padding: 8px; color: var(--vscode-foreground); font-size: 12px; }

    .container { display: flex; flex-direction: column; gap: 8px; }

    /* Header */
    .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }
    .header-title { color: white; font-size: 13px; font-weight: 600; }
    .badge { background: #F59E0B; color: #78350F; padding: 1px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }

    /* Usage Stats - Inline compact */
    .usage-row { display: flex; gap: 6px; }
    .usage-box { flex: 1; background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); border-radius: 6px; padding: 8px; text-align: center; }
    .usage-box .label { font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .usage-box .value { font-size: 14px; font-weight: 700; color: var(--vscode-foreground); }
    .usage-box .percent { font-size: 9px; color: #3B82F6; }
    .progress-bar { height: 4px; background: var(--vscode-editorWidget-background); border-radius: 2px; margin-top: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: #3B82F6; border-radius: 2px; transition: width 0.3s; }

    /* Reset Info */
    .reset-row { display: flex; gap: 6px; }
    .reset-box { flex: 1; background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); border-radius: 6px; padding: 6px 8px; }
    .reset-box .r-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
    .reset-box .r-time { font-size: 11px; font-weight: 500; color: var(--vscode-foreground); margin-top: 2px; }

    /* Info Grid */
    .info-row { display: flex; gap: 6px; }
    .info-box { flex: 1; background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); border-radius: 6px; padding: 6px 8px; }
    .info-box .i-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
    .info-box .i-value { font-size: 11px; font-weight: 600; color: var(--vscode-foreground); margin-top: 2px; }

    /* Codex Section */
    .codex-header { background: linear-gradient(135deg, #10B981, #059669); border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .codex-title { color: white; font-size: 13px; font-weight: 600; }
    .codex-badge { background: #6EE7B7; color: #064E3B; padding: 1px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
    .codex-badge.warn { background: #FDE68A; color: #78350F; }
    .codex-badge.error { background: #FCA5A5; color: #7F1D1D; }
    .codex-message { background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); border-radius: 6px; padding: 8px; color: var(--vscode-descriptionForeground); font-size: 11px; line-height: 1.4; }

    .loading { text-align: center; padding: 20px; color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  ${data ? `
  <div class="container">
    <div class="header">
      <span class="header-title">Claude Usage</span>
      <span class="badge">${this.escapeHtml(d.plan_display)}</span>
    </div>

    <div class="usage-row">
      <div class="usage-box">
        <div class="label">Hourly</div>
        <div class="value">${d.current_req}/${d.max_req}</div>
        <div class="percent">${d.percent_5h}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${d.percent_5h}%"></div></div>
      </div>
      <div class="usage-box">
        <div class="label">Weekly</div>
        <div class="value">${d.weekly_usage}/${d.max_weekly}</div>
        <div class="percent">${d.percent_weekly}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${d.percent_weekly}%"></div></div>
      </div>
    </div>

    <div class="reset-row">
      <div class="reset-box">
        <div class="r-label">Reset Hourly</div>
        <div class="r-time">${this.escapeHtml(d.reset_5h)}</div>
      </div>
      <div class="reset-box">
        <div class="r-label">Reset Weekly</div>
        <div class="r-time">${this.escapeHtml(d.reset_7d)}</div>
      </div>
    </div>

    <div class="info-row">
      <div class="info-box">
        <div class="i-label">API Key</div>
        <div class="i-value">${this.escapeHtml(d.email)}</div>
      </div>
      <div class="info-box">
        <div class="i-label">Expires</div>
        <div class="i-value">${this.escapeHtml(d.expires_at)}</div>
      </div>
    </div>

    ${this.renderCodexSection(codexState)}
  </div>
  ` : `<div class="loading">Memuat data...</div>`}
</body>
</html>`;
  }

  private renderCodexSection(codexState?: CodexUsageState): string {
    const state = codexState ?? {
      status: "not-configured" as const,
      message: "Token Codex belum diset di claudeUsage.codexBearerToken.",
    };
    const cd = state.data;
    const primaryPercent = this.formatPercent(cd?.rate_limit?.primary_window?.used_percent);
    const secondaryPercent = this.formatPercent(cd?.rate_limit?.secondary_window?.used_percent);
    const planDisplay = cd?.plan_type ? cd.plan_type.toUpperCase() : state.status === "error" ? "ERROR" : "SETUP";
    const primaryLabel = this.formatWindowLabel(cd?.rate_limit?.primary_window?.limit_window_seconds, "Primary");
    const secondaryLabel = this.formatWindowLabel(cd?.rate_limit?.secondary_window?.limit_window_seconds, "Secondary");
    const badgeClass = state.status === "error" ? " error" : state.status === "not-configured" ? " warn" : "";
    const statusLabel = state.status === "available"
      ? cd?.rate_limit?.allowed ? "Allowed" : "Limited"
      : state.status === "error" ? "Butuh auth" : "Belum siap";

    return `
    <div class="codex-header">
      <span class="codex-title">Codex Usage</span>
      <span class="codex-badge${badgeClass}">${this.escapeHtml(planDisplay)}</span>
    </div>

    ${cd ? `
    <div class="usage-row">
      <div class="usage-box">
        <div class="label">${this.escapeHtml(primaryLabel)}</div>
        <div class="value">${primaryPercent}%</div>
        <div class="percent">Used</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${primaryPercent}%; background: #10B981"></div></div>
      </div>
      <div class="usage-box">
        <div class="label">${this.escapeHtml(secondaryLabel)}</div>
        <div class="value">${secondaryPercent}%</div>
        <div class="percent">Used</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${secondaryPercent}%; background: #10B981"></div></div>
      </div>
    </div>

    <div class="reset-row">
      <div class="reset-box">
        <div class="r-label">Reset Primary</div>
        <div class="r-time">${this.formatResetAt(cd.rate_limit?.primary_window?.reset_at, cd.rate_limit?.primary_window?.reset_after_seconds)}</div>
      </div>
      <div class="reset-box">
        <div class="r-label">Reset Secondary</div>
        <div class="r-time">${this.formatResetAt(cd.rate_limit?.secondary_window?.reset_at, cd.rate_limit?.secondary_window?.reset_after_seconds)}</div>
      </div>
    </div>

    <div class="info-row">
      <div class="info-box">
        <div class="i-label">Email</div>
        <div class="i-value">${this.escapeHtml(cd.email || "N/A")}</div>
      </div>
      <div class="info-box">
        <div class="i-label">Status</div>
        <div class="i-value">${this.escapeHtml(statusLabel)}</div>
      </div>
    </div>
    <div class="info-row">
      <div class="info-box">
        <div class="i-label">Credits</div>
        <div class="i-value">${this.escapeHtml(this.formatCredits(cd))}</div>
      </div>
      <div class="info-box">
        <div class="i-label">Spend</div>
        <div class="i-value">${this.escapeHtml(cd.spend_control?.reached ? "Reached" : "OK")}</div>
      </div>
    </div>
    ` : `
    <div class="info-row">
      <div class="info-box">
        <div class="i-label">Status</div>
        <div class="i-value">${this.escapeHtml(statusLabel)}</div>
      </div>
      <div class="info-box">
        <div class="i-label">Data</div>
        <div class="i-value">Belum tersedia</div>
      </div>
    </div>
    <div class="codex-message">${this.escapeHtml(state.message || "Data Codex belum tersedia.")}</div>
    `}
    `;
  }

  private formatPercent(percent: number | undefined): number {
    if (typeof percent !== "number" || Number.isNaN(percent)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(percent)));
  }

  private formatSeconds(seconds: number | undefined): string {
    if (!seconds) {
      return 'N/A';
    }
    if (seconds < 60) {
      return `${seconds}s`;
    }
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    }
    if (seconds >= 86400) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      return `${days}d ${hours}h`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }

  private formatResetAt(resetAtSeconds: number | undefined, resetAfterSeconds: number | undefined): string {
    if (typeof resetAtSeconds !== "number" || Number.isNaN(resetAtSeconds) || resetAtSeconds <= 0) {
      return `Resets ${this.formatSeconds(resetAfterSeconds)}`;
    }

    const resetDate = new Date(resetAtSeconds * 1000);
    if (Number.isNaN(resetDate.getTime())) {
      return `Resets ${this.formatSeconds(resetAfterSeconds)}`;
    }

    if (this.isSameLocalDay(resetDate, new Date())) {
      return `Resets ${this.formatTime(resetDate)}`;
    }

    return `Resets ${this.formatDateTime(resetDate)}`;
  }

  private isSameLocalDay(first: Date, second: Date): boolean {
    return first.getFullYear() === second.getFullYear()
      && first.getMonth() === second.getMonth()
      && first.getDate() === second.getDate();
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date).replace(/, (?=\d{1,2}:)/, " ");
  }

  private formatWindowLabel(seconds: number | undefined, fallback: string): string {
    if (!seconds) {
      return fallback;
    }
    if (seconds % 86400 === 0) {
      return `${seconds / 86400}D Window`;
    }
    if (seconds % 3600 === 0) {
      return `${seconds / 3600}H Window`;
    }
    return `${fallback} Window`;
  }

  private formatCredits(data: CodexUsageData): string {
    if (data.credits.unlimited) {
      return "Unlimited";
    }
    const resets = data.rate_limit_reset_credits?.available_count ?? 0;
    return `${data.credits.balance || "0"} / reset ${resets}`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
