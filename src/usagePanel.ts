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

  public updateData(data: UsageData) {
    if (this._view) {
      this._view.webview.html = this.getDashboardHtml(data);
    }
  }

  private getDashboardHtml(data?: UsageData): string {
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

    .loading { text-align: center; padding: 20px; color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  ${data ? `
  <div class="container">
    <div class="header">
      <span class="header-title">Claude Usage</span>
      <span class="badge">${d.plan_display}</span>
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
        <div class="r-time">${d.reset_5h}</div>
      </div>
      <div class="reset-box">
        <div class="r-label">Reset Weekly</div>
        <div class="r-time">${d.reset_7d}</div>
      </div>
    </div>

    <div class="info-row">
      <div class="info-box">
        <div class="i-label">API Key</div>
        <div class="i-value">${d.email}</div>
      </div>
      <div class="info-box">
        <div class="i-label">Expires</div>
        <div class="i-value">${d.expires_at}</div>
      </div>
    </div>
  </div>
  ` : `<div class="loading">Memuat data...</div>`}
</body>
</html>`;
  }
}