import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function BehavioralPractice() {
  const { requestBehavioralFeedback } = useAuth();
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitAnswer = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await requestBehavioralFeedback(answer));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-3xl">
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
        Practice
      </p>
      <h2 className="mb-2 text-2xl font-semibold text-gray-900">
        Behavioral interview coach
      </h2>
      <p className="mb-6 text-gray-600">
        Answer a behavioral question. QuadCoach will retrieve relevant coaching
        notes and use them to give you specific feedback.
      </p>
      <form
        onSubmit={submitAnswer}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <label
          htmlFor="behavioral-answer"
          className="block text-sm font-medium text-gray-800"
        >
          Tell me about a time you faced a difficult technical challenge. What
          was your role, what did you do, and what happened?
        </label>
        <textarea
          id="behavioral-answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          maxLength={10000}
          rows={8}
          required
          placeholder="Write your answer here..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            {answer.length}/10,000 characters
          </span>
          <button
            type="submit"
            disabled={loading || !answer.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Reviewing..." : "Get coaching feedback"}
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-6 space-y-4">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Feedback
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {result.feedback}
            </p>
          </section>
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Coaching sources used
            </h3>
            {result.sources.length ? (
              <ul className="space-y-2">
                {result.sources.map((source) => (
                  <li
                    key={`${source.title}-${source.section}`}
                    className="text-sm text-gray-700"
                  >
                    {source.title} <span className="text-gray-500">— {source.section}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No coaching sources were retrieved.
              </p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
