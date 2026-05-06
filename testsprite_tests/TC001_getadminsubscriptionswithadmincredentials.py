import requests
from requests.auth import HTTPBasicAuth

def test_getadminsubscriptionswithadmincredentials():
    base_url = "http://localhost:3000"
    endpoint = "/admin/subscriptions"
    url = base_url + endpoint

    username = "wallykht1@gmail.com"
    password = "Wael@2026"

    try:
        response = requests.get(url, auth=HTTPBasicAuth(username, password), timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert response.headers.get('Content-Type', '').startswith('application/json'), \
            f"Expected Content-Type application/json, got {response.headers.get('Content-Type')}"
        try:
            data = response.json()
        except ValueError:
            assert False, "Response body is not valid JSON"
        assert isinstance(data, list), f"Expected response body to be a list, got {type(data)}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_getadminsubscriptionswithadmincredentials()