package com.telusko.demo.workitem.specification;

import com.telusko.demo.sprint.entity.SprintWorkItem;
import com.telusko.demo.workitem.entity.WorkItem;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class WorkItemSpecification {

    public static Specification<WorkItem> filter(
            Long projectId,
            Long statusId,
            String statusCode,
            Long priorityId,
            Long typeId,
            Long sprintId,
            Long assigneeId,
            Boolean allocated,
            Long ownerId,
            Long myUserId,
            String search) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Active items only
            predicates.add(cb.isTrue(root.get("active")));

            if (projectId != null) {
                predicates.add(cb.equal(root.get("project").get("id"), projectId));
            }

            if (statusId != null) {
                predicates.add(cb.equal(root.get("status").get("id"), statusId));
            }

            if (statusCode != null && !statusCode.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("status").get("code")), statusCode.trim().toUpperCase()));
            }

            if (priorityId != null) {
                predicates.add(cb.equal(root.get("priority").get("id"), priorityId));
            }

            if (typeId != null) {
                predicates.add(cb.equal(root.get("type").get("id"), typeId));
            }

            if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assignee").get("id"), assigneeId));
            }

            if (allocated != null) {
                if (allocated) {
                    predicates.add(cb.isNotNull(root.get("assignee")));
                } else {
                    predicates.add(cb.isNull(root.get("assignee")));
                }
            }

            if (ownerId != null) {
                predicates.add(cb.equal(root.get("owner").get("id"), ownerId));
            }

            if (myUserId != null) {
                predicates.add(cb.or(
                        cb.equal(root.get("owner").get("id"), myUserId),
                        cb.equal(root.get("assignee").get("id"), myUserId)
                ));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descLike = cb.like(cb.lower(cb.coalesce(root.get("description"), "")), pattern);
                predicates.add(cb.or(titleLike, descLike));
            }

            if (sprintId != null) {
                Subquery<Long> subquery = query.subquery(Long.class);
                var swiRoot = subquery.from(SprintWorkItem.class);
                if (sprintId > 0) {
                    subquery.select(swiRoot.get("workItem").get("id"))
                            .where(
                                    cb.equal(swiRoot.get("sprint").get("id"), sprintId),
                                    cb.isNull(swiRoot.get("removedAt"))
                            );
                    predicates.add(root.get("id").in(subquery));
                } else if (sprintId == 0) {
                    subquery.select(swiRoot.get("workItem").get("id"))
                            .where(cb.isNull(swiRoot.get("removedAt")));
                    predicates.add(cb.not(root.get("id").in(subquery)));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

