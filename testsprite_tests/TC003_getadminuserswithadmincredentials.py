import requests
from requests.auth import HTTPBasicAuth

def test_get_admin_users_with_admin_credentials():
    base_url = "http://localhost:3000"
    endpoint = "/admin/users"
    url = base_url + endpoint
    auth = HTTPBasicAuth("wallykht1@gmail.com", "Wael@2026")
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, auth=auth, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        users = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert isinstance(users, list), "Response JSON is not a list of users"

test_get_admin_users_with_admin_credentials()