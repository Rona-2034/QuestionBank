package com.extr.security.handler;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.codehaus.jackson.map.ObjectMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.WebAttributes;
import org.springframework.security.web.authentication.AbstractAuthenticationTargetUrlRequestHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import com.extr.security.UserInfo;

/**
 * <tt>AuthenticationSuccessHandler</tt> which can be configured with a default URL which users should be
 * sent to upon successful authentication.
 * <p>
 * The logic used is that of the {@link AbstractAuthenticationTargetUrlRequestHandler parent class}.
 *
 * @author Ocelot
 * @since 3.0
 */
public class ExtrAuthenticationSuccessHandler extends AbstractAuthenticationTargetUrlRequestHandler implements AuthenticationSuccessHandler {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public ExtrAuthenticationSuccessHandler() {
    }

    /**
     * Constructor which sets the <tt>defaultTargetUrl</tt> property of the base class.
     * @param defaultTargetUrl the URL to which the user should be redirected on successful authentication.
     */
    public ExtrAuthenticationSuccessHandler(String defaultTargetUrl) {
        setDefaultTargetUrl(defaultTargetUrl);
    }

    /**
     * Calls the parent class {@code handle()} method to forward or redirect to the target URL, and
     * then calls {@code clearAuthenticationAttributes()} to remove any leftover session data.
     */
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        if (isApiRequest(request)) {
            writeApiResponse(response, authentication);
            clearAuthenticationAttributes(request);
            return;
        }

        handle(request, response, authentication);
//        String language = request.getParameter("j_language");
//		request.getSession().setAttribute("language", language);
        clearAuthenticationAttributes(request);
    }

    /**
     * Removes temporary authentication-related data which may have been stored in the session
     * during the authentication process.
     */
    protected final void clearAuthenticationAttributes(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            return;
        }

        session.removeAttribute(WebAttributes.AUTHENTICATION_EXCEPTION);
    }

    private boolean isApiRequest(HttpServletRequest request) {
        String requestedWith = request.getHeader("X-Requested-With");
        if ("XMLHttpRequest".equalsIgnoreCase(requestedWith)) {
            return true;
        }
        String accept = request.getHeader("Accept");
        return accept != null && accept.contains("application/json");
    }

    private void writeApiResponse(HttpServletResponse response, Authentication authentication)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json;charset=UTF-8");

        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("result", "success");
        payload.put("targetUrl", getDefaultTargetUrl());

        Object principal = authentication == null ? null : authentication.getPrincipal();
        if (principal instanceof UserInfo) {
            UserInfo userInfo = (UserInfo) principal;
            Map<String, Object> user = new LinkedHashMap<String, Object>();
            user.put("username", userInfo.getUsername());
            user.put("userid", userInfo.getUserid());
            user.put("trueName", userInfo.getTrueName());
            user.put("rolesName", userInfo.getRolesName());
            user.put("fieldId", userInfo.getFieldId());
            user.put("fieldName", userInfo.getFieldName());
            user.put("email", userInfo.getEmail());
            payload.put("user", user);
        }

        OBJECT_MAPPER.writeValue(response.getWriter(), payload);
    }
}
