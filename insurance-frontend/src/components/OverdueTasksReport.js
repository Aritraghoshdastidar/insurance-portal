import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Warning as WarningIcon
} from '@mui/icons-material';

function OverdueTasksReport() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverdueTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const response = await fetch("http://localhost:3001/api/reports/overdue-tasks", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch overdue tasks`);
        }

        const data = await response.json();
        setTasks(Array.isArray(data.overdue_tasks) ? data.overdue_tasks : []);
      } catch (err) {
        console.error('Error fetching overdue tasks:', err);
        // Check if it's a table not found error
        if (err.message.includes('ER_NO_SUCH_TABLE') || err.message.includes('doesn\'t exist')) {
          setError('Workflow tracking is not yet configured. The workflow_steps table needs to be created.');
        } else {
          setError(err.message || "Failed to fetch overdue tasks.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueTasks();
  }, []);

  const getSeverityColor = (hoursOverdue) => {
    if (hoursOverdue > 48) return 'error';
    if (hoursOverdue > 24) return 'warning';
    return 'info';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Overdue Workflow Tasks (SLA Breach)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Tasks that have exceeded their due date and require immediate attention.
      </Typography>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : tasks.length === 0 ? (
            <Alert severity="success">All tasks are within SLA. No overdue tasks found.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Step ID</strong></TableCell>
                    <TableCell><strong>Workflow ID</strong></TableCell>
                    <TableCell><strong>Step Name</strong></TableCell>
                    <TableCell><strong>Assigned Role</strong></TableCell>
                    <TableCell><strong>Due Date</strong></TableCell>
                    <TableCell><strong>Hours Overdue</strong></TableCell>
                    <TableCell><strong>Severity</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.step_id} hover>
                      <TableCell>{task.step_id}</TableCell>
                      <TableCell>{task.workflow_id}</TableCell>
                      <TableCell>{task.step_name}</TableCell>
                      <TableCell>
                        <Chip label={task.assigned_role} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {task.due_date ? new Date(task.due_date).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${task.hours_overdue} hours`}
                          color={getSeverityColor(task.hours_overdue)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            task.hours_overdue > 48 ? 'Critical' : 
                            task.hours_overdue > 24 ? 'High' : 
                            'Medium'
                          }
                          color={getSeverityColor(task.hours_overdue)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default OverdueTasksReport;
