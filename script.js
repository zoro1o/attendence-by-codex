const url = "https://docs.google.com/spreadsheets/d/15sFmA_5fqoiD-pEX6FXCquwbw3n-hUERgWKs-Yis95Q/edit";
const totalClasses = 20;

const tableBody = document.querySelector("#attendanceTable tbody");
const dashboardMessage = document.getElementById("dashboardMessage");
const totalRecordsEl = document.getElementById("totalRecords");
const presentStudentsEl = document.getElementById("presentStudents");
const averageAttendanceEl = document.getElementById("averageAttendance");

if (tableBody) {
  loadAttendance();
}

function loadAttendance() {
  setMessage("Loading attendance data...");

  fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch attendance data.");
      }
      return res.json();
    })
    .then((data) => {
      renderAttendance(data);
    })
    .catch((error) => {
      setMessage(error.message || "Unable to load attendance data.");
    });
}

function renderAttendance(data) {
  const count = {};

  data.forEach((student) => {
    const key = `${student.name}_${student.roll}`;

    if (!count[key]) {
      count[key] = 0;
    }

    count[key]++;
  });

  const names = [];
  const percentages = [];
  let totalPercentage = 0;

  tableBody.innerHTML = "";

  Object.keys(count).forEach((key) => {
    const parts = key.split("_");
    const name = parts[0];
    const roll = parts[1];
    const percent = (count[key] / totalClasses) * 100;

    names.push(name);
    percentages.push(percent);
    totalPercentage += percent;

    const row = tableBody.insertRow();
    row.insertCell(0).textContent = name;
    row.insertCell(1).textContent = roll;
    row.insertCell(2).textContent = `${percent.toFixed(1)}%`;
  });

  updateStats(data.length, names.length, totalPercentage, names.length);
  createChart(names, percentages);

  if (names.length === 0) {
    setMessage("No attendance records found yet.");
    return;
  }

  setMessage(`Loaded ${data.length} attendance records successfully.`);
}

function updateStats(totalRecords, totalStudents, totalPercentage, studentCount) {
  if (totalRecordsEl) {
    totalRecordsEl.textContent = totalRecords;
  }

  if (presentStudentsEl) {
    presentStudentsEl.textContent = totalStudents;
  }

  if (averageAttendanceEl) {
    const average = studentCount ? totalPercentage / studentCount : 0;
    averageAttendanceEl.textContent = `${average.toFixed(1)}%`;
  }
}

function createChart(names, percentages) {
  const chartCanvas = document.getElementById("attendanceChart");

  if (!chartCanvas) {
    return;
  }

  new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: names,
      datasets: [
        {
          label: "Attendance %",
          data: percentages,
          backgroundColor: "#2563eb",
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function setMessage(message) {
  if (dashboardMessage) {
    dashboardMessage.textContent = message;
  }
}
