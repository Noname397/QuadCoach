from services.coaching_rag import retrieve_relevant_chunks


EVALUATION_CASES = [
    ("How do I structure a behavioral answer?", "STAR Method"),
    ("How do I make my personal contribution clear?", "STAR Method"),
    ("How should I explain why I chose one database over another?", "Project Tradeoffs"),
    ("How can I discuss alternatives and their costs?", "Project Tradeoffs"),
    ("How do I explain how I debugged a production issue?", "Technical Challenge"),
    ("How should I show that my bug fix actually worked?", "Technical Challenge"),
    ("How do I talk honestly about a mistake and what I learned?", "Handling Failure"),
    ("How can I make my answer clear to a non-expert?", "Interview Communication"),
]


def main():
    successes = 0
    for query, expected_source in EVALUATION_CASES:
        results = retrieve_relevant_chunks(query, top_k=3)
        found = any(result["source"] == expected_source for result in results)
        successes += int(found)
        print(f"\nQuery: {query}")
        for rank, result in enumerate(results, start=1):
            print(
                f"  {rank}. {result['source']} - {result['section']} "
                f"(score={result['score']:.4f}, chunk={result['chunk_id']})"
            )
        print(
            f"  Expected source: {expected_source}; "
            f"appeared in top 3: {'yes' if found else 'no'}"
        )
    recall = successes / len(EVALUATION_CASES)
    print(f"\nRecall@3: {successes}/{len(EVALUATION_CASES)} = {recall:.1%}")


if __name__ == "__main__":
    main()
