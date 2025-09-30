INSERT INTO status_code(
	id, description)
	VALUES (1, 'Task'),
		   (2,'Project'),
		   (3,'Feature'),
		   (4,'Sprint');


INSERT INTO status(
	id, decription, sequence, status_code)
	VALUES (1, 'In Progress', 1, 1),
			(2,'Done',2,1),
			(3,'To Do',3,1),
			(4,'Proposed',1,2),
			(5,'Open',2,2),
			(6,'Closed',3,2),
			(7,'In Progress',1,3),
			(8,'Completed',2,3),
			(9,'Planned',1,4),
			(10,'Active',2,4),
			(11,'Completed',3,4);

INSERT INTO role(
	id, description)
	VALUES (1, 'Developer'),
	        (2,'Admin'),
	        (3,'Project Manager'),
	        (4,'Scrum Master'),
	        (5,'Product Owner'),
	        (6,'Tester');

INSERT INTO work_type VALUES (1,'Work'),
				(2,'Official'),
				(3,'Time Off');