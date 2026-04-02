from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_manifest_returns_200():
    response = client.get("/samples-manifest")
    assert response.status_code == 200


def test_manifest_is_dict():
    response = client.get("/samples-manifest")
    assert isinstance(response.json(), dict)


def test_manifest_values_are_lists_of_strings():
    data = client.get("/samples-manifest").json()
    for key, value in data.items():
        assert isinstance(value, list), f"{key} value is not a list"
        for item in value:
            assert isinstance(item, str), f"{key} contains non-string item: {item!r}"


def test_manifest_urls_contain_samples_path():
    data = client.get("/samples-manifest").json()
    for key, urls in data.items():
        for url in urls:
            assert "/samples/" in url, (
                f"URL for {key} does not contain '/samples/': {url!r}"
            )


def test_manifest_known_banks_present():
    data = client.get("/samples-manifest").json()
    for bank in ("bd", "sd", "hh", "moog", "vocal"):
        assert bank in data, f"Expected bank '{bank}' not found in manifest"


def test_manifest_credits_txt_not_a_key():
    data = client.get("/samples-manifest").json()
    assert "credits.txt" not in data, "credits.txt should not appear as a manifest key"
