from services.coaching_rag import INDEX_PATH, KNOWLEDGE_DIR, ingest_knowledge


if __name__ == "__main__":
    count = ingest_knowledge()
    print(f"Indexed {count} coaching chunks from {KNOWLEDGE_DIR} into {INDEX_PATH}.")
