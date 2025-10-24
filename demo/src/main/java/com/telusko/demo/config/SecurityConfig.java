package com.telusko.demo.config;

import com.telusko.demo.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(CustomUserDetailsService customUserDetailsService) {
        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // enable CORS
                .csrf(csrf -> csrf.disable()) // disable CSRF for REST
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login", "/register", "/register/*").permitAll()
                        .requestMatchers("/**").authenticated()
                )
                .formLogin(form -> form.disable()) // disable default form login
                .httpBasic(basic -> basic.disable()) // disable basic auth
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://192.168.14.191:3000",
                "http://localhost:8080",
                "http://192.168.14.191:8080"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}








//import com.telusko.demo.service.CustomUserDetailsService;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.security.web.SecurityFilterChain;
//
//@Configuration
//@EnableWebSecurity
//public class SecurityConfig {
//
//    private final CustomUserDetailsService userDetailsService;
//
//    public SecurityConfig(CustomUserDetailsService userDetailsService) {
//        this.userDetailsService = userDetailsService;
//    }
//
//    @Bean
//    public PasswordEncoder passwordEncoder() {
//        return new BCryptPasswordEncoder();
//    }
//
//    // AuthenticationManager bean
//    @Bean
//    public AuthenticationManager authManager(HttpSecurity http) throws Exception {
//        AuthenticationManagerBuilder authBuilder =
//                http.getSharedObject(AuthenticationManagerBuilder.class);
//
//        authBuilder
//                .userDetailsService(userDetailsService)
//                .passwordEncoder(passwordEncoder());
//
//        return authBuilder.build();
//    }
//
//
//    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//        http
//                .csrf(csrf -> csrf.disable())
//                .cors(cors -> {})
//                .csrf(csrf -> csrf.disable()) // new way to disable CSRF in 6.1+
//                .authorizeHttpRequests(auth -> auth
//                        .requestMatchers("/login", "/register").permitAll()
//                        .anyRequest().authenticated()
//                )
//                .formLogin(form -> form.disable()) // disable default login form
//                .logout(logout -> logout.permitAll())
//                .sessionManagement(session -> session.maximumSessions(1)); // optional
//
//        return http.build();
//    }
//    @Bean
//    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
//        org.springframework.web.cors.CorsConfiguration configuration =
//                new org.springframework.web.cors.CorsConfiguration();
//
//        configuration.setAllowedOrigins(
//                java.util.List.of("http://localhost:3000")
////                http://192.168.14.188:3000
//        );
//        configuration.setAllowedMethods(
//                java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
//        );
//        configuration.setAllowedHeaders(java.util.List.of("*"));
//        configuration.setAllowCredentials(true);
//
//        org.springframework.web.cors.UrlBasedCorsConfigurationSource source =
//                new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", configuration);
//
//        return source;
//    }
//}
