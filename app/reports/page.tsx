import { AppShell } from "@/components/AppShell";

const reportData = [
  { label: "Mon", value: 60 },
  { label: "Tue", value: 68 },
  { label: "Wed", value: 72 },
  { label: "Thu", value: 70 },
  { label: "Fri", value: 84 },
];

export default function ReportsPage() {
  return (
    <AppShell title="Reports" subtitle="Performance and team health">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#eaf4ff" }}>◔</div>
          <div>
            <p>Delivery rate</p>
            <h3>87%</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#edf8f2" }}>↗</div>
          <div>
            <p>Velocity</p>
            <h3>+18%</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fff3d9" }}>◎</div>
          <div>
            <p>Focus score</p>
            <h3>91</h3>
          </div>
        </div>
      </div>

      <div className="panel-box full-width">
        <div className="section-header">
          <h3>Weekly progress</h3>
          <span>Updated daily</span>
        </div>
        <div className="chart-bars">
          {reportData.map((item) => (
            <div className="chart-column" key={item.label}>
              <div className="chart-bar" style={{ height: `${item.value}%` }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
