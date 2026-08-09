package com.extr.controller;

import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.extr.controller.domain.Message;
import com.extr.domain.user.User;
import com.extr.service.UserService;
import com.extr.util.Page;
import com.extr.util.PagingUtil;
import com.extr.util.StandardPasswordEncoderForSha1;
import com.extr.util.TextLengthValidator;

@Controller
public class SystemConfigController {

	@Autowired
	private UserService userService;

	/**
	 * 系统备份页面
	 * 
	 * @param model
	 * @param request
	 * @return
	 */
	@RequestMapping(value = "/admin/sys-backup", method = RequestMethod.GET)
	private String sysBackUpPage(Model model, HttpServletRequest request) {
		return "admin/sys-backup";
	}

	/**
	 * 管理员列表页面
	 * 
	 * @param model
	 * @param request
	 * @return
	 */
	@RequestMapping(value = "/admin/sys-admin-list", method = RequestMethod.GET)
	private String sysAdminListPage(
			Model model,
			HttpServletRequest request,
			@RequestParam(value = "page", required = false, defaultValue = "1") int page) {
		Page<User> pageModel = new Page<User>();
		pageModel.setPageNo(page);
		pageModel.setPageSize(20);
		
		List<User> userList = userService.getUserListByRoleId(1, pageModel);
		
		String pageStr = PagingUtil.getPagelink(page, pageModel.getTotalPage(), "", "admin/sys-admin-list");
		model.addAttribute("userList", userList);
		model.addAttribute("pageStr", pageStr);
		return "admin/sys-admin-list";
	}
	
	/**
	 * 添加用户界面
	 * @param model
	 * @param request
	 * @return
	 */
	@RequestMapping(value = "/admin/add-admin", method = RequestMethod.GET)
	private String addUserPage(Model model, HttpServletRequest request) {
			
			
		return "admin/add-admin";
	}
	
	@RequestMapping(value = { "/admin/add-admin" }, method = RequestMethod.POST)
	public @ResponseBody Message addUser(@RequestBody User user){
		com.extr.security.UserInfo userInfo = (com.extr.security.UserInfo) SecurityContextHolder.getContext()
				.getAuthentication().getPrincipal();
		user.setCreate_date(new Date());
		user.setCreator(userInfo == null ? "0" : String.valueOf(userInfo.getUserid()));
		Message message = new Message();
		if (!validateUserText(user, message)) {
			return message;
		}
		String password = user.getPassword() + "{" + user.getUsername() + "}";
		PasswordEncoder passwordEncoder = new StandardPasswordEncoderForSha1();
		String resultPassword = passwordEncoder.encode(password);
		user.setPassword(resultPassword);
		user.setEnabled("1");
		try {
			userService.addAdmin(user);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			
			if(e.getMessage().equals("duplicate-username")){
				message.setResult(e.getMessage());
				message.setMessageInfo("用户名：" + user.getUsername() + "已经存在");
			}else
				message.setResult("错误！" + e.getClass().getName());
			e.printStackTrace();
		}
		return message;
	}

	private boolean validateUserText(User user, Message message) {
		if (!TextLengthValidator.isRequiredTextValid(user.getUsername())) {
			message.setResult("error");
			message.setMessageInfo(TextLengthValidator.message("用户名"));
			return false;
		}
		if (!TextLengthValidator.isRequiredTextValid(user.getEmail())) {
			message.setResult("error");
			message.setMessageInfo(TextLengthValidator.message("邮箱"));
			return false;
		}
		return true;
	}
}

















