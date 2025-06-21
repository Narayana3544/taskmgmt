import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './Home.css';
import { useNavigate } from 'react-router-dom';

const initialTasks = {
  todo: [
    { id: 'task-1', title: 'Set up project repo' },
    { id: 'task-2', title: 'Design login form' },
  ],
  inprogress: [{ id: 'task-3', title: 'Connect backend API' }],
  done: [{ id: 'task-4', title: 'Register page UI done' }],
};

const Home = () => {
  const [tasks, setTasks] = useState(initialTasks);

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
  };

  return (
    <>
      {/* <Sidebar onToggle={setSidebarCollapsed} /> */}
        <h2 className="board-title">🗂️ Project Task Board</h2>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="columns">
            {['todo', 'inprogress', 'done'].map((colKey) => (
              <Droppable key={colKey} droppableId={colKey}>
                {(provided) => (
                  <div className="column" ref={provided.innerRef} {...provided.droppableProps}>
                    <h3>
                      {colKey === 'todo' && '📝 To Do'}
                      {colKey === 'inprogress' && '⏳ In Progress'}
                      {colKey === 'done' && '✅ Done'}
                    </h3>
                    {tasks[colKey].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            className="task-card"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {task.title}
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
    </>
  );
};

export default Home;