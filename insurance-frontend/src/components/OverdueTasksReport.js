// src/components/OverdueTasksReport.js 31
import React, { useEffect, useState } from "react";
import axios from "axios";

function OverdueTasksReport() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/reports/overdue-tasks")
      .then((res) => setTasks(res.data.overdue_tasks || []))
      .catch(() => setError("Failed to fetch overdue tasks."));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card-container">
      <h2>Overdue Workflow Tasks (SLA Breach)</h2>
      {tasks.length === 0 ? (
        <p>All tasks are within SLA.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Step ID</th>
              <th>Workflow ID</th>
              <th>Step Name</th>
              <th>Role</th>
              <th>Hours Overdue</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.step_id}>
                <td>{t.step_id}</td>
                <td>{t.workflow_id}</td>
                <td>{t.step_name}</td>
                <td>{t.assigned_role}</td>
                <td>{t.hours_overdue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OverdueTasksReport;
