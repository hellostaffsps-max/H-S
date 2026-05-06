import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "wallykht1@gmail.com"
AUTH_PASSWORD = "Wael@2026"
TIMEOUT = 30

def test_post_api_articles_with_valid_admin_payload():
    url = f"{BASE_URL}/api/articles"
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)
    headers = {
        "Content-Type": "application/json"
    }
    # Example valid article payload
    payload = {
        "title": "Test Article Title",
        "content": "This is a test article content for validating creation via admin API.",
        "tags": ["test", "api", "article"],
        "published": True
    }
    created_article_id = None

    try:
        response = requests.post(url, auth=auth, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"
        data = response.json()
        # Validate response content contains the article created
        assert "id" in data, "Response JSON must contain 'id'"
        created_article_id = data["id"]
        assert data.get("title") == payload["title"], "Article title in response does not match payload"
        assert data.get("content") == payload["content"], "Article content in response does not match payload"
        assert isinstance(data.get("published"), bool), "'published' field must be a boolean"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    finally:
        # Cleanup: delete the created article if it was successfully created
        if created_article_id:
            try:
                delete_url = f"{BASE_URL}/api/articles/{created_article_id}"
                del_response = requests.delete(delete_url, auth=auth, timeout=TIMEOUT)
                # It's acceptable if deletion fails but log it/assert if needed
                assert del_response.status_code in [200, 204, 202], f"Failed to delete article {created_article_id}"
            except requests.RequestException:
                pass

test_post_api_articles_with_valid_admin_payload()