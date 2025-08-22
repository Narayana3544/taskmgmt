import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './Home.css';

const Home = () => {
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });

  // Fetch tasks for logged-in user
  useEffect(() => {
    axios
      .get('http://localhost:8080/api/user/tasks/', { withCredentials: true })
      .then((res) => {
        const grouped = { todo: [], inprogress: [], done: [] };

        res.data.forEach((task) => {
          const status = task.status?.toLowerCase().replace(/\s/g, '') || 'todo';
          if (status === 'todo') grouped.todo.push(task);
          else if (status === 'inprogress') grouped.inprogress.push(task);
          else grouped.done.push(task);
        });

        setTasks(grouped);
      })
      .catch((err) => {
        console.error('Error fetching tasks:', err);
      });
  }, []);

  // Handle drag and drop
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    const sourceTasks = Array.from(tasks[sourceCol]);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    const destTasks = Array.from(tasks[destCol]);
    destTasks.splice(destination.index, 0, movedTask);

    setTasks({
      ...tasks,
      [sourceCol]: sourceTasks,
      [destCol]: destTasks,
    });

    // Update task status in backend
    axios.patch(`http://localhost:8080/api/tasks/${movedTask.id}/status`, {
      status: destCol
        .replace(/^(todo)$/, 'To Do')
        .replace(/inprogress/, 'In Progress')
        .replace(/done/, 'Done'),
    });
  };

  const statusCount = {
    todo: tasks.todo.length,
    inprogress: tasks.inprogress.length,
    done: tasks.done.length,
  };

  return (
    <div className="task-board">
      <h2 className="board-title">🗂️ Task Board</h2>

      <div className="status-summary">
        <span>To Do: {statusCount.todo}</span>
        <span>In Progress: {statusCount.inprogress}</span>
        <span>Done: {statusCount.done}</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="columns">
          {['todo', 'inprogress', 'done'].map((colKey) => (
            <Droppable key={colKey} droppableId={colKey}>
              {(provided) => (
                <div
                  className="column"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h3>
                    {colKey === 'todo' && '📝 To Do'}
                    {colKey === 'inprogress' && '⏳ In Progress'}
                    {colKey === 'done' && '✅ Done'}
                  </h3>

                  {tasks[colKey].map((task, index) => (
                    <Draggable
                      key={task.id.toString()}
                      draggableId={task.id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          className="task-card"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <strong>{task.title}</strong>
                          <p>{task.description}</p>
                          <p>Assigned to: {task.user?.preffered_name || 'Unassigned'}</p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Home;
