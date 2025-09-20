package com.telusko.demo.repo;

import com.telusko.demo.Model.BugAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.lang.ScopedValue;

@Repository
public interface BugAttachmentRepo extends JpaRepository<BugAttachment,Integer> {
    <T> ScopedValue<T> findAttachmentById(Integer attachmentId);
}
