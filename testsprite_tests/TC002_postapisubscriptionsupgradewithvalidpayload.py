import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "wallykht1@gmail.com"
AUTH_PASSWORD = "Wael@2026"
TIMEOUT = 30

def test_post_api_subscriptions_upgrade_with_valid_payload():
    # Step 1: Retrieve a list of users from /admin/users to get a valid target user id
    users_url = f"{BASE_URL}/admin/users"
    try:
        users_response = requests.get(users_url, auth=HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD), timeout=TIMEOUT)
        assert users_response.status_code == 200, f"Expected 200 from /admin/users but got {users_response.status_code}"
        users_data = users_response.json()
        assert isinstance(users_data, list) and len(users_data) > 0, "User list is empty or not a list"
    except Exception as e:
        raise AssertionError(f"Failed to get users for upgrade target: {e}")

    # Select the first user different from admin to upgrade (assuming admin user is the test user)
    target_user = None
    for user in users_data:
        # Basic check: avoid upgrading self (admin)
        if user.get("email") != AUTH_USERNAME and user.get("id"):
            target_user = user
            break
    if not target_user:
        raise AssertionError("No valid target user found for subscription upgrade")

    # Prepare the valid payload for upgrade
    upgrade_url = f"{BASE_URL}/api/subscriptions/upgrade"
    payload = {
        "userId": target_user["id"],
        "plan": "premium"  # Assuming 'plan' is a valid field; adjust if schema differs
    }

    headers = {
        "Content-Type": "application/json"
    }

    # Step 2: Make the POST request to upgrade subscription
    try:
        response = requests.post(
            upgrade_url,
            auth=HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD),
            json=payload,
            headers=headers,
            timeout=TIMEOUT
        )
    except Exception as e:
        raise AssertionError(f"Request to upgrade subscription failed: {e}")

    # Step 3: Validate response status code is 200 or 201
    assert response.status_code in (200, 201), f"Expected 200 or 201 but got {response.status_code}"

    # Step 4: Validate response body contains updated subscription info
    try:
        resp_json = response.json()
    except Exception as e:
        raise AssertionError(f"Response is not valid JSON: {e}")

    # Basic validation: response should include userId and plan keys with correct values
    assert resp_json.get("userId") == target_user["id"], "Response userId does not match target userId"
    assert resp_json.get("plan") == payload["plan"], "Response plan does not match requested upgrade plan"

test_post_api_subscriptions_upgrade_with_valid_payload()