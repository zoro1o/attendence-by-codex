const apiUrl = "https://script.google.com/macros/s/AKfycbysvvCQEewSASefs43CbFmhq1X_kOdX3ploNnFlRvU66u4ILc2L57-GtUo8SlVMr4q4ww/exec";
const url = `${apiUrl}?mode=read&t=${Date.now()}`;


const tableBody = document.querySelector("#attendanceTable tbody");
const dashboardMessage = document.getElementById("dashboardMessage");
const totalRecordsEl = document.getElementById("totalRecords");
const presentStudentsEl = document.getElementById("presentStudents");
const averageAttendanceEl = document.getElementById("averageAttendance");

let attendanceChartInstance = null;

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
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from Apps Script.");
      }

      renderAttendance(data);
    })
    .catch((error) => {
      setMessage(error.message || "Unable to load attendance data.");
    });
}

function renderAttendance(data) {
  const students = {};
  const classSessions = new Set();

  tableBody.innerHTML = "";

  data.forEach((student) => {
    const name = (student.name || "").trim();
    const roll = (student.roll || "").trim();

    if (!name || !roll) {
      return;
    }

    const classId =
      student.classId ||
      student.date ||
      student.classDate ||
      student.day;

    if (!classId) {
      throw new Error("Each record must include classId or date from Apps Script.");
    }

    const key = `${name}__${roll}`;

    if (!students[key]) {
      students[key] = {
        name,
        roll,
        attendedClasses: new Set()
      };
    }

    students[key].attendedClasses.add(classId);
    classSessions.add(classId);
  });

  const totalClasses = classSessions.size;
  const names = [];
  const percentages = [];
  let totalPercentage = 0;

  Object.values(students).forEach((student) => {
    const attendedCount = student.attendedClasses.size;
    const percentage = totalClasses ? (attendedCount / totalClasses) * 100 : 0;

    names.push(student.name);
    percentages.push(percentage);
    totalPercentage += percentage;

    const row = tableBody.insertRow();
    row.insertCell(0).textContent = student.name;
    row.insertCell(1).textContent = student.roll;
    row.insertCell(2).textContent = `${percentage.toFixed(1)}%`;
  });

  updateStats(data.length, Object.keys(students).length, totalPercentage, totalClasses);

  if (names.length === 0) {
    setMessage("No attendance records found yet.");
    destroyChart();
    return;
  }

  createChart(names, percentages);
  setMessage(`Loaded ${data.length} attendance records across ${totalClasses} class sessions.`);
}

function updateStats(totalRecords, totalStudents, totalPercentage, totalClasses) {
  if (totalRecordsEl) {
    totalRecordsEl.textContent = totalRecords;
  }

  if (presentStudentsEl) {
    totalStudentsElText(totalStudents);
  }

  if (averageAttendanceEl) {
    const average = totalStudents ? totalPercentage / totalStudents : 0;
    averageAttendanceEl.textContent = `${average.toFixed(1)}%`;
  }
}

function totalStudentsElText(totalStudents) {
  presentStudentsEl.textContent = totalStudents;
}

function createChart(names, percentages) {
  const chartCanvas = document.getElementById("attendanceChart");

  if (!chartCanvas) {
    return;
  }

  destroyChart();

  attendanceChartInstance = new Chart(chartCanvas, {
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

function destroyChart() {
  if (attendanceChartInstance) {
    attendanceChartInstance.destroy();
    attendanceChartInstance = null;
  }
}

function setMessage(message) {
  if (dashboardMessage) {
    dashboardMessage.textContent = message;
  }
}
