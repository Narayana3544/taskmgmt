import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './Home.css';

const initialTasks = {
  todo: [
    { id: '1', title: 'Setup project structure' },
    { id: '2', title: 'Design login page' }
  ],
  inprogress: [
    { id: '3', title: 'Create REST API for tasks' }
  ],
  done: [
    { id: '4', title: 'User registration' }
  ]
};

const Home = () => {
  const [tasks, setTasks] = useState(initialTasks);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    const sourceItems = Array.from(tasks[sourceCol]);
    const [movedItem] = sourceItems.splice(source.index, 1);

    const destItems = Array.from(tasks[destCol]);
    destItems.splice(destination.index, 0, movedItem);

    setTasks({
      ...tasks,
      [sourceCol]: sourceItems,
      [destCol]: destItems
    });
  };

  return (
    <div className="home-board">
      <h2 className="board-title">🗂️ Task Board</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="columns">
          {['todo', 'inprogress', 'done'].map((col) => (
            <Droppable key={col} droppableId={col}>
              {(provided) => (
                <div className="column" ref={provided.innerRef} {...provided.droppableProps}>
                  <h3 className="column-title">
                    {col === 'todo' && '📝 To Do'}
                    {col === 'inprogress' && '⏳ In Progress'}
                    {col === 'done' && '✅ Done'}
                  </h3>
                  {tasks[col].map((task, index) => (
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
    </div>
  );
};

export default Home;
