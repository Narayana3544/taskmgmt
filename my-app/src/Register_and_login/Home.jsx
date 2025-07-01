import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './Home.css';

const Home = () => {
  const [userStories, setUserStories] = useState({ todo: [], inprogress: [], done: [] });

  useEffect(() => {
    axios.get('http://localhost:8080/api/features/userstories') 
      .then((res) => {
        const grouped = {
          todo: [],
          inprogress: [],
          done: []
        };
        res.data.forEach(story => {
          const status = story.status?.toLowerCase().replace(/\s/g, '') || 'todo';
          if (status === 'todo') grouped.todo.push(story);
          else if (status === 'inprogress') grouped.inprogress.push(story);
          else grouped.done.push(story);
        });
        setUserStories(grouped);
      })
      .catch((err) => {
        console.error('Error fetching user stories:', err);
      });
  }, []);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    const sourceTasks = Array.from(userStories[sourceCol]);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    const destTasks = Array.from(userStories[destCol]);
    destTasks.splice(destination.index, 0, movedTask);

    setUserStories({
      ...userStories,
      [sourceCol]: sourceTasks,
      [destCol]: destTasks,
    });

    // OPTIONAL: update story status in the DB
    axios.patch(`http://localhost:8080/api/userstories/${movedTask.id}/status`, {
      status: destCol.replace(/^(todo)$/, 'To Do').replace(/inprogress/, 'In Progress').replace(/done/, 'Done')
    });
  };

  const statusCount = {
    todo: userStories.todo.length,
    inprogress: userStories.inprogress.length,
    done: userStories.done.length,
  };

  return (
    <div className="task-board">
      <h2 className="board-title">🗂️ User Story Board</h2>
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
                <div className="column" ref={provided.innerRef} {...provided.droppableProps}>
                  <h3>
                    {colKey === 'todo' && '📝 To Do'}
                    {colKey === 'inprogress' && '⏳ In Progress'}
                    {colKey === 'done' && '✅ Done'}
                  </h3>
                  {userStories[colKey].map((story, index) => (
                    <Draggable key={story.id.toString()} draggableId={story.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          className="task-card"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <strong>{story.description}</strong>
                          <p>Story Points: {story.storypoints}</p>
                          <p>Assigned to: {story.userstory?.preffered_name || 'Unassigned'}</p>
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
