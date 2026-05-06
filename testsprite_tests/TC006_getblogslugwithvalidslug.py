import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wallykht1@gmail.com", "Wael@2026")
TIMEOUT = 30


def test_get_blog_slug_with_valid_slug():
    article_slug = None
    article_id = None
    # Step 1: Create new article with admin credentials to ensure a valid published slug exists
    # Article creation endpoint requires auth and returns 201 Created with article info including slug
    create_article_url = f"{BASE_URL}/api/articles"
    article_payload = {
        "title": "Test Article for Slug Retrieval",
        "content": "This is a test article content for verifying blog slug retrieval."
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(
            create_article_url, json=article_payload, auth=AUTH, headers=headers, timeout=TIMEOUT
        )
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        article_data = response.json()
        # The new article must contain a valid slug
        article_slug = article_data.get("slug")
        article_id = article_data.get("id")
        assert isinstance(article_slug, str) and len(article_slug) > 0, "Article slug is missing or invalid"

        # Step 2: Perform public GET on /blog/[slug] WITHOUT authentication (public access)
        blog_url = f"{BASE_URL}/blog/{article_slug}"
        get_response = requests.get(blog_url, timeout=TIMEOUT)
        assert get_response.status_code == 200, f"Expected 200 OK, got {get_response.status_code}"
        blog_content = get_response.json()
        # Validate presence of article content keys
        assert "title" in blog_content and blog_content["title"] == article_payload["title"]
        assert "content" in blog_content and blog_content["content"] == article_payload["content"]
        assert "slug" in blog_content and blog_content["slug"] == article_slug

    finally:
        # Cleanup: delete created article if created, using admin endpoint
        if article_id:
            delete_url = f"{BASE_URL}/api/articles/{article_id}"
            # Assuming DELETE /api/articles/{id} with admin Basic Auth deletes the article
            try:
                del_response = requests.delete(delete_url, auth=AUTH, timeout=TIMEOUT)
                assert del_response.status_code in (200, 204), f"Expected 200 or 204 on delete, got {del_response.status_code}"
            except Exception:
                pass


test_get_blog_slug_with_valid_slug()
