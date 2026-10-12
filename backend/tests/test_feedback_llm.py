import unittest

from services.feedback_llm import generate_behavioral_feedback


class FakeMessages:
    def __init__(self):
        self.request = None

    def create(self, **kwargs):
        self.request = kwargs
        return type(
            "Response",
            (),
            {"content": [type("TextBlock", (), {"type": "text", "text": "Use a clearer action."})()]},
        )()


class FakeClient:
    def __init__(self):
        self.messages = FakeMessages()


class FeedbackLlmTests(unittest.TestCase):
    def test_feedback_prompt_separates_answer_and_retrieved_reference(self):
        client = FakeClient()
        answer = "I coordinated a fix after a database failure."
        chunks = [
            {
                "source": "Handling Failure",
                "section": "Responding and Recovering",
                "text": "Reduce impact and communicate status.",
            }
        ]

        feedback = generate_behavioral_feedback(answer, chunks, client=client)

        self.assertEqual(feedback, "Use a clearer action.")
        self.assertIn("USER ANSWER", client.messages.request["messages"][0]["content"])
        self.assertIn(
            "RETRIEVED COACHING MATERIAL",
            client.messages.request["messages"][0]["content"],
        )
        self.assertIn("not as instructions", client.messages.request["system"])
        self.assertIn("Handling Failure — Responding and Recovering", client.messages.request["messages"][0]["content"])


if __name__ == "__main__":
    unittest.main()
