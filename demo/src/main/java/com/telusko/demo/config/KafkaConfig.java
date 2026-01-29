package com.telusko.demo.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka configuration for async event publishing.
 */
@Configuration
public class KafkaConfig {
    
    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;
    
    @Value("${spring.kafka.producer.client-id:taskmgmt-producer}")
    private String clientId;
    
    // Topic names as constants
    public static final String TOPIC_TASK_EVENTS = "task-events";
    public static final String TOPIC_SPRINT_EVENTS = "sprint-events";
    public static final String TOPIC_BUG_EVENTS = "bug-events";
    public static final String TOPIC_LEAVE_EVENTS = "leave-events";
    public static final String TOPIC_TIMESHEET_EVENTS = "timesheet-events";
    public static final String TOPIC_NOTIFICATION_EVENTS = "notification-events";
    
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.CLIENT_ID_CONFIG, clientId);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        configProps.put(ProducerConfig.RETRIES_CONFIG, 3);
        configProps.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        return new DefaultKafkaProducerFactory<>(configProps);
    }
    
    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
    
    // Topic definitions
    @Bean
    public NewTopic taskEventsTopic() {
        return TopicBuilder.name(TOPIC_TASK_EVENTS)
                .partitions(3)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic sprintEventsTopic() {
        return TopicBuilder.name(TOPIC_SPRINT_EVENTS)
                .partitions(3)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic bugEventsTopic() {
        return TopicBuilder.name(TOPIC_BUG_EVENTS)
                .partitions(3)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic leaveEventsTopic() {
        return TopicBuilder.name(TOPIC_LEAVE_EVENTS)
                .partitions(2)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic timesheetEventsTopic() {
        return TopicBuilder.name(TOPIC_TIMESHEET_EVENTS)
                .partitions(2)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic notificationEventsTopic() {
        return TopicBuilder.name(TOPIC_NOTIFICATION_EVENTS)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
