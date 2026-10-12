import json
import math
import re
from functools import lru_cache
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = ROOT_DIR / "knowledge"
INDEX_PATH = ROOT_DIR / "backend" / "data" / "coaching_index.json"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
MAX_CHUNK_CHARS = 1200


class CoachingIndexError(RuntimeError):
    pass

# Library library for embedding text and retrieving relevant chunks from a coaching knowledge base.
def _get_embedder():
    try:
        from fastembed import TextEmbedding
    except ImportError as exc:
        raise CoachingIndexError(
            "FastEmbed is missing. Install backend requirements before using RAG."
        ) from exc

    return TextEmbedding(model_name=EMBEDDING_MODEL)


# Use LRU cache to store the embedder instance for reuse, avoiding repeated initialization.
@lru_cache(maxsize=1)
def _cached_embedder():
    return _get_embedder()

# Embed a list of texts using the provided embedder or the cached embedder.
def _embed_texts(texts, embedder=None):
    model = embedder or _cached_embedder()
    return [
        vector.tolist() if hasattr(vector, "tolist") else list(vector)
        for vector in model.embed(texts)
    ]

# Convert a string to a URL-friendly slug by replacing non-alphanumeric characters with hyphens and converting to lowercase.
def _slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")

# Split a section of text into smaller chunks based on paragraphs and a maximum character limit, ensuring that each chunk does not exceed the specified limit.
def _split_section(text, max_chars=MAX_CHUNK_CHARS):
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    chunks = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) + 2 > max_chars:
            chunks.append(current)
            current = ""
        if len(paragraph) > max_chars:
            if current:
                chunks.append(current)
                current = ""
            chunks.extend(
                paragraph[index : index + max_chars]
                for index in range(0, len(paragraph), max_chars)
            )
        else:
            current = f"{current}\n\n{paragraph}".strip()
    if current:
        chunks.append(current)
    return chunks

# Read Markdown documents from the specified knowledge directory, extracting titles, sections, and text chunks for indexing. Raises errors if documents are improperly formatted or if no documents are found.
def _read_markdown_documents(knowledge_dir=KNOWLEDGE_DIR):
    documents = []
    for path in sorted(Path(knowledge_dir).glob("*.md")):
        content = path.read_text(encoding="utf-8")
        title_match = re.search(r"^#\s+(.+?)\s*$", content, re.MULTILINE)
        if not title_match:
            raise CoachingIndexError(f"{path.name} needs a level-one title.")
        title = title_match.group(1)
        sections = list(
            re.finditer(r"^##\s+(.+?)\s*$", content, re.MULTILINE)
        )
        if not sections:
            raise CoachingIndexError(f"{path.name} needs at least one level-two section.")
        for section_index, section_match in enumerate(sections):
            start = section_match.end()
            end = (
                sections[section_index + 1].start()
                if section_index + 1 < len(sections)
                else len(content)
            )
            section = section_match.group(1)
            for chunk_index, text in enumerate(
                _split_section(content[start:end]), start=1
            ):
                documents.append(
                    {
                        "chunk_id": (
                            f"{path.stem}-{_slug(section)}-{chunk_index}"
                        ),
                        "source": title,
                        "filename": path.name,
                        "section": section,
                        "text": text,
                    }
                )
    if not documents:
        raise CoachingIndexError(
            f"No Markdown coaching documents found in {knowledge_dir}."
        )
    return documents

# Ingest knowledge from Markdown documents in the specified directory, embedding the text chunks and saving the resulting index to a JSON file. Raises errors if the embedding process fails or if the number of vectors does not match the number of chunks.
def ingest_knowledge(
    knowledge_dir=KNOWLEDGE_DIR,
    index_path=INDEX_PATH,
    embedder=None,
):
    chunks = _read_markdown_documents(knowledge_dir)
    vectors = _embed_texts([chunk["text"] for chunk in chunks], embedder)
    if len(vectors) != len(chunks):
        raise CoachingIndexError("Embedding model returned an unexpected vector count.")
    for chunk, vector in zip(chunks, vectors):
        chunk["embedding"] = vector

    index = {
        "embedding_model": EMBEDDING_MODEL,
        "chunks": chunks,
    }
    target = Path(index_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(index), encoding="utf-8")
    return len(chunks)


def _cosine_similarity(left, right):
    if len(left) != len(right):
        raise CoachingIndexError("Stored and query embedding dimensions do not match.")
    dot_product = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if not left_norm or not right_norm:
        return 0.0
    return dot_product / (left_norm * right_norm)


def retrieve_relevant_chunks(
    query,
    top_k=3,
    index_path=INDEX_PATH,
    embedder=None,
):
    if not isinstance(query, str) or not query.strip():
        raise ValueError("A non-empty query is required.")
    if not isinstance(top_k, int) or top_k < 1:
        raise ValueError("top_k must be a positive integer.")

    path = Path(index_path)
    if not path.is_file():
        raise CoachingIndexError(
            f"Coaching index not found at {path}. Run the ingestion script first."
        )
    index = json.loads(path.read_text(encoding="utf-8"))
    chunks = index.get("chunks")
    if not chunks:
        raise CoachingIndexError("The coaching index contains no chunks.")

    query_vector = _embed_texts([query.strip()], embedder)[0]
    scored = []
    for chunk in chunks:
        score = _cosine_similarity(query_vector, chunk["embedding"])
        scored.append(
            {
                "chunk_id": chunk["chunk_id"],
                "text": chunk["text"],
                "source": chunk["source"],
                "filename": chunk["filename"],
                "section": chunk["section"],
                "score": round(score, 4),
            }
        )
    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:top_k]
