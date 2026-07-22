import { listRecords } from "@/lib/store";

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
        <h2 className="text-lg font-medium mb-2">Counts by category</h2>
        <ul className="flex gap-4">
          {Object.entries(countsByCategory).map(([category, count]) => (
            <li key={category} className="rounded border px-3 py-2">
              <span className="font-mono text-sm text-gray-500">{category}</span>
              <span className="ml-2 font-semibold">{count}</span>
            </li>
          ))}
          {records.length === 0 && <li className="text-gray-500">No feedback yet.</li>}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Records</h2>
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
                <td className="py-2 pr-4">{record.category}</td>
                <td className="py-2 pr-4">{record.sentiment}</td>
                <td className="py-2 pr-4">{record.severity}</td>
                <td className="py-2 pr-4">{record.summary}</td>
                <td className="py-2 pr-4">{record.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
