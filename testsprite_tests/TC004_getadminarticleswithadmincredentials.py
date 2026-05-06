import requests
from requests.auth import HTTPBasicAuth

def test_get_admin_articles_with_admin_credentials():
    base_url = "http://localhost:3000"
    endpoint = "/admin/articles"
    url = base_url + endpoint
    username = "wallykht1@gmail.com"
    password = "Wael@2026"
    timeout = 30

    try:
        response = requests.get(url, auth=HTTPBasicAuth(username, password), timeout=timeout)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert response.text.strip(), "Response body is empty, expected JSON list"
        articles = response.json()
        assert isinstance(articles, list), f"Expected response to be a list, got {type(articles)}"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"
    except ValueError as e:
        assert False, f"Failed to parse JSON: {e}"

test_get_admin_articles_with_admin_credentials()
