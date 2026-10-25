import { AppShell } from "@/components/AppShell";

const settings = [
  { label: "Workspace title", value: "TeamFlow Workspace" },
  { label: "Default timezone", value: "UTC-5" },
  { label: "Team visibility", value: "Public to workspace" },
  { label: "Notifications", value: "Enabled" },
];

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Workspace preferences">
      <div className="panel-box full-width">
        <div className="section-header">
          <h3>General settings</h3>
          <span>Managed centrally</span>
        </div>

        <div className="settings-list">
          {settings.map((setting) => (
            <div className="settings-row" key={setting.label}>
              <span>{setting.label}</span>
              <strong>{setting.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
