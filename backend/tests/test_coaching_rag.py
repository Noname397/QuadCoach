import tempfile
import unittest
from pathlib import Path

from services.coaching_rag import (
    CoachingIndexError,
    ingest_knowledge,
    retrieve_relevant_chunks,
)


class FakeEmbedder:
    def embed(self, texts):
        for text in texts:
            lowered = text.lower()
            yield [
                float(any(word in lowered for word in group))
                for group in (
                    ("situation", "task", "action", "result", "behavioral"),
                    ("tradeoff", "alternative", "decision", "database"),
                    ("failure", "mistake", "setback", "learned"),
                    ("clear", "listener", "explain", "communication"),
                )
            ]


class CoachingRagTests(unittest.TestCase):
    def test_ingestion_and_retrieval_keep_source_metadata_and_rank_relevant_chunk(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            knowledge = root / "knowledge"
            knowledge.mkdir()
            (knowledge / "star.md").write_text(
                "# STAR Method\n\n## Action\n"
                "Describe the action you took and the result.\n\n"
                "## Situation\n"
                "Give brief context for the behavioral answer.",
                encoding="utf-8",
            )
            (knowledge / "tradeoffs.md").write_text(
                "# Project Tradeoffs\n\n## Decision\n"
                "Compare alternatives and explain the tradeoff.",
                encoding="utf-8",
            )
            index = root / "index.json"

            count = ingest_knowledge(knowledge, index, FakeEmbedder())
            results = retrieve_relevant_chunks(
                "How do I compare alternatives and explain a tradeoff?",
                top_k=2,
                index_path=index,
                embedder=FakeEmbedder(),
            )

            self.assertEqual(count, 3)
            self.assertEqual(results[0]["source"], "Project Tradeoffs")
            self.assertEqual(results[0]["section"], "Decision")
            self.assertEqual(results[0]["filename"], "tradeoffs.md")
            self.assertGreaterEqual(results[0]["score"], results[1]["score"])

    def test_missing_index_reports_ingestion_step(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(CoachingIndexError, "Run the ingestion"):
                retrieve_relevant_chunks(
                    "How should I answer?",
                    index_path=Path(directory) / "missing.json",
                    embedder=FakeEmbedder(),
                )

    def test_rejects_empty_query_and_invalid_top_k(self):
        with self.assertRaises(ValueError):
            retrieve_relevant_chunks(" ")
        with self.assertRaises(ValueError):
            retrieve_relevant_chunks("answer", top_k=0)


if __name__ == "__main__":
    unittest.main()
