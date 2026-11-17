package com.extr.security;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.extr.domain.user.Role;
import com.extr.domain.user.User;
import com.extr.persistence.UserMapper;

@Component("userDetailsServiceImpl")
public class UserDetailsServiceImpl implements UserDetailsService {

	@Autowired
	public UserMapper userMapper;
	

	public UserMapper getUserMapper() {
		return userMapper;
	}

	public void setUserMapper(UserMapper userMapper) {
		this.userMapper = userMapper;
	}
	
	@Override
	public UserDetails loadUserByUsername(String username)
			throws UsernameNotFoundException {
		// TODO Auto-generated method stub
		
		
		String identifier = username.trim();
		boolean email = identifier.contains("@");
		User user = email ? null : userMapper.getUserByName(identifier.toLowerCase(java.util.Locale.ROOT));
		if (user == null) {
			List<Integer> ids = email ? userMapper.getUserIdsByEmail(identifier.toLowerCase(java.util.Locale.ROOT))
					: userMapper.getUserIdsByTrueName(identifier);
			if (ids.size() > 1) {
				throw new org.springframework.security.authentication.AuthenticationServiceException(
						email ? "邮箱关联了多个账号，请使用原账号登录或联系管理员" : "姓名重复，请使用公司邮箱登录");
			}
			if (ids.size() == 1) user = userMapper.getUserById(ids.get(0));
		}
		if (user == null && email) user = userMapper.getUserByName(identifier.toLowerCase(java.util.Locale.ROOT));
		if(user == null)
			throw new UsernameNotFoundException("user not found!");
		List<Role> roleList = userMapper.getRoleListByUserId(user.getId(),null);
		/*List<UserGroup> userGroupList = userMapper.getUserGroupListByUserId(user.getId());
		List<Job> jobList = userMapper.getJobListByUserId(user.getId(), null);*/
		user.setRoleListStack(roleList);
		String roles = "";
		String rolesName = "";
		for(int i=0;i<roleList.size();i++){
			roles += roleList.get(i).getAuthority() + ",";
			rolesName += roleList.get(i).getName() + ",";
		}
		roles = roles.substring(0, roles.length() - 1);
		rolesName = rolesName.substring(0, rolesName.length() - 1);
		if (roleList.stream().anyMatch(role -> "ROLE_SUPER_ADMIN".equals(role.getAuthority()))) {
			rolesName = "超级管理员";
		}
		List<GrantedAuthority> authorities = AuthorityUtils.commaSeparatedStringToAuthorityList(roles);
		UserInfo userInfo = new UserInfo(user.getUsername(),user.getPassword(),user.getEnabled().equals("1"),true,true,true,authorities);
		userInfo.setRoleList(roleList);
		userInfo.setUserid(user.getId());
		userInfo.setTrueName(user.getTruename());
		userInfo.setRolesName(rolesName);
		userInfo.setEnabled(user.getEnabled());
		userInfo.setFieldId(user.getFieldId());
		userInfo.setFieldName(user.getFieldName());
		userInfo.setEmail(user.getEmail());
		userInfo.setLastLoginTime(user.getLastLoginTime());
		userInfo.setLoginTime(user.getLoginTime());
		
		return userInfo;
	}
	
	
	
}
