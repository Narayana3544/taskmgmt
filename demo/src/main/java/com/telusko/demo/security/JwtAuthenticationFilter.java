package com.telusko.demo.security;

import com.telusko.demo.Model.User;
import com.telusko.demo.repo.userrepo;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * JWT Authentication Filter.
 * Intercepts requests, validates JWT tokens, and sets authentication context.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String CORRELATION_ID_KEY = "correlationId";
    
    private final JwtService jwtService;
    private final userrepo userRepo;
    
    public JwtAuthenticationFilter(JwtService jwtService, userrepo userRepo) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
    }
    
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        // Set correlation ID for request tracing
        String correlationId = UUID.randomUUID().toString();
        MDC.put(CORRELATION_ID_KEY, correlationId);
        response.setHeader("X-Correlation-ID", correlationId);
        
        try {
            final String authHeader = request.getHeader(AUTHORIZATION_HEADER);
            
            // Skip if no Authorization header or not Bearer token
            if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
                filterChain.doFilter(request, response);
                return;
            }
            
            final String jwt = authHeader.substring(BEARER_PREFIX.length());
            final String username;
            
            try {
                username = jwtService.extractUsername(jwt);
            } catch (Exception e) {
                logger.warn("Failed to extract username from JWT: {}", e.getMessage());
                filterChain.doFilter(request, response);
                return;
            }
            
            // If username extracted and no authentication in context
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // Verify token type is access token
                String tokenType = jwtService.getTokenType(jwt);
                if (!"access".equals(tokenType)) {
                    logger.warn("Invalid token type used for API access: {}", tokenType);
                    filterChain.doFilter(request, response);
                    return;
                }
                
                // Load user from database
                Optional<User> userOptional = userRepo.findByEmail(username);
                
                if (userOptional.isPresent() && jwtService.isTokenValid(jwt, username)) {
                    User user = userOptional.get();
                    
                    // Check if user is active
                    if (!user.isIs_active()) {
                        logger.warn("Inactive user attempted access: {}", username);
                        filterChain.doFilter(request, response);
                        return;
                    }
                    
                    // Extract permissions from token
                    List<String> permissions = jwtService.extractPermissions(jwt);
                    String role = jwtService.extractRole(jwt);
                    
                    // Build authorities from permissions and role
                    List<SimpleGrantedAuthority> authorities = permissions != null 
                            ? permissions.stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList())
                            : List.of();
                    
                    // Add role as authority
                    if (role != null) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                    }
                    
                    // Create authentication token
                    UsernamePasswordAuthenticationToken authToken = 
                            new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    authorities
                            );
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    // Add user info to MDC for logging
                    MDC.put("userId", String.valueOf(user.getId()));
                    MDC.put("userEmail", user.getEmail());
                    
                    logger.debug("Successfully authenticated user: {}", username);
                }
            }
            
            filterChain.doFilter(request, response);
            
        } finally {
            // Clean up MDC
            MDC.remove(CORRELATION_ID_KEY);
            MDC.remove("userId");
            MDC.remove("userEmail");
        }
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // Skip JWT filter for public endpoints
        return path.startsWith("/api/auth/") || 
               path.equals("/login") || 
               path.equals("/register") ||
               path.startsWith("/register/");
    }
}
