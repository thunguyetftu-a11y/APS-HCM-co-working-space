export async function GET() {
  return Response.json({
    status: "ok",
    app: "TeamFlow Planner",
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
}
