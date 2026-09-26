package com.extr.util.xml;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;

import com.extr.domain.exam.PracticePaper;
import com.extr.domain.question.Field;
import com.extr.domain.question.Question;
import com.extr.domain.question.QuestionContent;
import com.extr.domain.question.QuestionHistory;
import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.xml.DomDriver;

public class Object2Xml {
	private static final Class<?>[] allowedTypes = new Class<?>[]{
		Question.class, QuestionContent.class, Field.class, QuestionHistory.class,
		PracticePaper.class, LinkedHashMap.class, ArrayList.class, HashMap.class
	};
	public static String toXml(Object obj){
		XStream xstream=new XStream();
		xstream.allowTypes(allowedTypes);
		xstream.allowTypesByWildcard(new String[]{"com.extr.**"});
		xstream.processAnnotations(obj.getClass());
		
		return xstream.toXML(obj);
	}
	
	public static <T> T toBean(String xmlStr,Class<T> cls){
		XStream xstream=new XStream(new DomDriver());
		xstream.allowTypes(allowedTypes);
		xstream.allowTypesByWildcard(new String[]{"com.extr.**"});
		xstream.processAnnotations(cls);
		@SuppressWarnings("unchecked")
		T obj=(T)xstream.fromXML(xmlStr);
		return obj;
	}
}