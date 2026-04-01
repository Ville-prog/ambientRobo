from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_empty_prompt_returns_400():
    response = client.post("/generate", json={"prompt": ""})
    assert response.status_code == 400


def test_whitespace_only_prompt_returns_400():
    response = client.post("/generate", json={"prompt": "   "})
    assert response.status_code == 400


def _make_mock_response(content: str):
    mock_message = MagicMock()
    mock_message.content = content
    mock_choice = MagicMock()
    mock_choice.message = mock_message
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    return mock_response


def test_valid_prompt_returns_200():
    with patch("main.client.chat.completions.create") as mock_create:
        mock_create.return_value = _make_mock_response("stack(s('bd'))")
        response = client.post("/generate", json={"prompt": "make a beat"})
    assert response.status_code == 200


def test_valid_prompt_returns_result_key():
    with patch("main.client.chat.completions.create") as mock_create:
        mock_create.return_value = _make_mock_response("stack(s('bd'))")
        response = client.post("/generate", json={"prompt": "make a beat"})
    assert "result" in response.json()


def test_valid_prompt_result_matches_mock():
    with patch("main.client.chat.completions.create") as mock_create:
        mock_create.return_value = _make_mock_response("stack(s('bd'))")
        response = client.post("/generate", json={"prompt": "make a beat"})
    assert response.json()["result"] == "stack(s('bd'))"
