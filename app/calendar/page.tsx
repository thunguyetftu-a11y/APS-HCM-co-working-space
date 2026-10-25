import { AppShell } from "@/components/AppShell";

const days = [
  { label: "Mon", date: "14", items: ["Sprint review", "Launch sync"] },
  { label: "Tue", date: "15", items: ["Design QA"] },
  { label: "Wed", date: "16", items: ["Stakeholder call"] },
  { label: "Thu", date: "17", items: ["Project sync"] },
  { label: "Fri", date: "18", items: ["Team retro"] },
  { label: "Sat", date: "19", items: [] },
  { label: "Sun", date: "20", items: [] },
];

export default function CalendarPage() {
  return (
    <AppShell title="Calendar" subtitle="Shared team schedule">
      <div className="panel-box full-width">
        <div className="section-header">
          <h3>Weekly schedule</h3>
          <span>Updated 2 mins ago</span>
        </div>

        <div className="calendar-week-grid">
          {days.map((day) => (
            <div className="calendar-day" key={day.label}>
              <div className="calendar-day-header">
                <span>{day.label}</span>
                <strong>{day.date}</strong>
              </div>
              <div className="calendar-events">
                {day.items.length === 0 ? (
                  <span className="no-events">No events</span>
                ) : (
                  day.items.map((item) => (
                    <div className="mini-event" key={`${day.label}-${item}`}>{item}</div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
