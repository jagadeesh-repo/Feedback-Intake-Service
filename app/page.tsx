import { listRecords } from "@/lib/store";
import { submitFeedbackAction } from "./actions";

// The stored/API values are lowercase snake_case (the contract per the brief,
// e.g. "feature_request", "extraction_failed"); this turns them into readable
// Title Case labels for display only — presentation stays out of the contract.
function toLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// This page has no dynamic data source Next.js recognizes automatically (no
// cookies()/headers()/searchParams, no uncached fetch), so the App Router
// treats it as eligible for static rendering / the Full Route Cache and
// would otherwise serve a cached render instead of re-executing
// listRecords() on every request — even in `next dev`. Force dynamic
// rendering so the dashboard always reflects the current in-memory store.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const records = listRecords();
  const countsByCategory = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.category] = (acc[record.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold mb-6">Feedback Intake Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-2">Submit feedback</h2>
        <form action={submitFeedbackAction} className="flex flex-col gap-3">
          <textarea
            name="text"
            required
            maxLength={5000}
            rows={3}
            placeholder="Describe your feedback in a sentence or two…"
            className="peer w-full rounded border p-3 text-sm"
          />
          <button
            type="submit"
            className="self-start rounded border bg-foreground px-4 py-2 text-sm font-medium text-background peer-placeholder-shown:pointer-events-none peer-placeholder-shown:opacity-50"
          >
            Submit
          </button>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-2">Counts by category</h2>
        <ul className="flex gap-4">
          {Object.entries(countsByCategory).map(([category, count]) => (
            <li key={category} className="rounded border px-3 py-2">
              <span className="text-sm text-gray-500">{toLabel(category)}</span>
              <span className="ml-2 font-semibold">{count}</span>
            </li>
          ))}
          {records.length === 0 && <li className="text-gray-500">No feedback yet.</li>}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4">Submitted</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Sentiment</th>
                <th className="py-2 pr-4">Severity</th>
                <th className="py-2 pr-4">Summary</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b">
                  <td className="py-2 pr-4">{new Date(record.submittedAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">{toLabel(record.category)}</td>
                  <td className="py-2 pr-4">{toLabel(record.sentiment)}</td>
                  <td className="py-2 pr-4">{toLabel(record.severity)}</td>
                  <td className="py-2 pr-4">{record.summary}</td>
                  <td className="py-2 pr-4">{toLabel(record.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
