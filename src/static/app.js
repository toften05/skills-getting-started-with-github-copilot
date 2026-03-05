document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML with delete icons
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = `<div class="participants-section">
            <strong>Participants:</strong>
            <ul class="participants-list">
              ${details.participants.map(p =>
                `<li data-activity="${name}" data-email="${p}">
                   ${p} <span class="remove-participant" title="Remove participant">&#x2715;</span>
                 </li>`
              ).join("")}
            </ul>
          </div>`;
        } else {
          participantsHtml = `<p class="no-participants"><strong>Participants:</strong> None yet</p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities to show updated participant list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Listen for clicks on remove icons using event delegation
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.matches(".remove-participant")) {
      const li = event.target.closest("li");
      const activity = li.dataset.activity;
      const email = li.dataset.email;

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );

        const result = await response.json();
        if (response.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = "info";
          fetchActivities();
        } else {
          messageDiv.textContent = result.detail || "Could not remove participant";
          messageDiv.className = "error";
        }
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      } catch (err) {
        console.error("Error removing participant:", err);
        messageDiv.textContent = "Failed to remove participant. Try again.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    }
  });

  // Initialize app
  fetchActivities();
});
