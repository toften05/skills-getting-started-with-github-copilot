import copy
import pytest
from fastapi.testclient import TestClient

from src import app as _app

client = TestClient(_app.app)

# Keep a pristine copy of the original activities data so tests can reset state
_original_activities = copy.deepcopy(_app.activities)


@pytest.fixture(autouse=True)
def restore_activities():
    """Reset the in-memory activity store before each test."""
    _app.activities = copy.deepcopy(_original_activities)


def test_root_redirects_to_index():
    # Arrange: nothing special

    # Act
    response = client.get("/", follow_redirects=False)

    # Assert
    assert response.status_code == 307  # should issue a redirect
    assert response.headers.get("location") == "/static/index.html"
    # follow the redirect manually to ensure the target exists
    follow = client.get(response.headers["location"])
    assert follow.status_code == 200


def test_get_activities_returns_full_list():
    # Arrange

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    returned = response.json()
    assert returned == _original_activities


def test_signup_success():
    # Arrange
    email = "newstudent@mergington.edu"
    activity = "Chess Club"

    # Act
    response = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "Signed up" in data["message"]
    assert email in _app.activities[activity]["participants"]


def test_signup_nonexistent_activity_returns_404():
    # Arrange
    email = "ghost@mergington.edu"

    # Act
    response = client.post("/activities/NoSuchActivity/signup", params={"email": email})

    # Assert
    assert response.status_code == 404


def test_signup_duplicate_returns_400():
    # Arrange
    activity = "Chess Club"
    email = "michael@mergington.edu"  # already in participants

    # Act
    response = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert
    assert response.status_code == 400


def test_remove_participant_success():
    # Arrange
    activity = "Programming Class"
    email = "emma@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity}/participants", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert email not in _app.activities[activity]["participants"]


def test_remove_nonexistent_activity_returns_404():
    # Arrange
    email = "nobody@mergington.edu"

    # Act
    response = client.delete("/activities/NoSuchActivity/participants", params={"email": email})

    # Assert
    assert response.status_code == 404


def test_remove_missing_participant_returns_404():
    # Arrange
    activity = "Chess Club"
    email = "notregistered@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity}/participants", params={"email": email})

    # Assert
    assert response.status_code == 404
