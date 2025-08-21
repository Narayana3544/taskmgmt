package com.telusko.demo.config;

import com.telusko.demo.Model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class CustomUserDetails implements UserDetails {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // You can return roles/authorities if needed
        return Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_"+user.getRole().getDescription())
        );
    }

    @Override
    public String getPassword() {
        return user.getPassword();  // Replace with actual field name
    }

    @Override
    public String getUsername() {
        return user.getEmail();     // Use email as username
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public User getUser() {
        return user;
    }
}
