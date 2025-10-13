//package com.telusko.demo.config;//package com.telusko.demo.config;
//
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.http.HttpMethod;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.config.Customizer;
//import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.security.config.http.SessionCreationPolicy;
//
//@Configuration
//public class SecurityConfig {
//
//    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//        http
//                .csrf(csrf -> csrf.disable())
//                .cors(Customizer.withDefaults())
//                .authorizeHttpRequests(auth -> auth
//                        .requestMatchers("/login","/register/{id}").permitAll()
//                        .requestMatchers( "/login","/register").permitAll()
//                        .requestMatchers("/current-user").authenticated()
//                        .requestMatchers("/create-task").hasRole("Admin")
//                        .requestMatchers("/user/profile","/**","/sprints/**","/features/**",
//                                "/sprints","/projects/**").authenticated()
//                        .requestMatchers(HttpMethod.POST, "/sprints/**/assign-users").authenticated()
//                        .anyRequest().authenticated()
//                )
//                .formLogin(form -> form.disable()) // disable default login form
//                .httpBasic(basic -> basic.disable()) // disable basic auth
//                .sessionManagement(session -> session
//                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
//                );
//
//        return http.build();
//    }
//
//
//    @Bean
//public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
//    return config.getAuthenticationManager();
//}
//        @Bean
//        public PasswordEncoder passwordEncoder() {
//            return new BCryptPasswordEncoder();  // uses {bcrypt} internally
//        }
//
//
//}




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

package com.telusko.demo.config;

import com.telusko.demo.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors().and()
                .csrf().disable()
                .authorizeRequests()
                .antMatchers("/login", "/register", "/register/*").permitAll()
                .antMatchers("/", "/index.html", "/static/**").permitAll()
                .antMatchers("/create-task").authenticated()
                .antMatchers("/current-user").authenticated()
                .antMatchers("/user/profile", "/sprints/**", "/features/**", "/projects/**").authenticated()
                .antMatchers(HttpMethod.POST, "/sprints/**/assign-users").authenticated()
                .antMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().authenticated()
                .and()
                .formLogin().disable()
                .httpBasic().disable()
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED);

        return http.build();
    }

    // ✅ Now Spring Security uses your DB users
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http, PasswordEncoder passwordEncoder)
            throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(customUserDetailsService)
                .passwordEncoder(passwordEncoder)
                .and()
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
