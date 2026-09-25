package com.extr.security;

import com.extr.util.StandardPasswordEncoderForSha1;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
public class LegacyAuthenticationProvider implements AuthenticationProvider {

    private final UserDetailsService userDetailsService;
    private final StandardPasswordEncoderForSha1 passwordEncoder = new StandardPasswordEncoderForSha1();

    public LegacyAuthenticationProvider(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String username = authentication.getName().trim().toLowerCase();
        String password = String.valueOf(authentication.getCredentials());
        UserDetails user = userDetailsService.loadUserByUsername(username);
        String encoded = passwordEncoder.encode(password + "{" + username + "}");
        if (!encoded.equals(user.getPassword())) {
            throw new BadCredentialsException("用户名或密码错误");
        }
        if (!user.isEnabled()) {
            throw new BadCredentialsException("账号已停用");
        }
        return UsernamePasswordAuthenticationToken.authenticated(user, null, user.getAuthorities());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
