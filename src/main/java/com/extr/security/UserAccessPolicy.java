package com.extr.security;

import com.extr.domain.user.Role;
import com.extr.persistence.UserMapper;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class UserAccessPolicy {
    private final UserMapper users;
    public UserAccessPolicy(UserMapper users) { this.users = users; }

    public boolean isSuperAdministrator() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(role -> "ROLE_SUPER_ADMIN".equals(role.getAuthority()));
    }

    public void requireAllowedRoleList(int roleId) {
        if (roleId != 3 && !isSuperAdministrator()) {
            throw new AccessDeniedException("仅超级管理员可查看管理员账号");
        }
    }

    public void requireManageableUser(int userId) {
        List<Role> roles = users.getRoleListByUserId(userId, null);
        if (roles.isEmpty() || roles.stream().anyMatch(role -> "ROLE_SUPER_ADMIN".equals(role.getAuthority()))) {
            throw new AccessDeniedException("不能通过此接口修改超级管理员账号");
        }
        if (!isSuperAdministrator() && roles.stream().anyMatch(role -> !"ROLE_STUDENT".equals(role.getAuthority()))) {
            throw new AccessDeniedException("业务管理员只能管理普通成员");
        }
    }
}
