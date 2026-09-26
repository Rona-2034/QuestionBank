package com.extr.controller.domain;

import java.io.Serializable;

/**
 * @author Ocelot
 * @date 2014年6月8日 下午10:15:55
 */
public class QuestionFilter implements Serializable {

	private static final long serialVersionUID = -8784942836284858739L;

	private int fieldId;

	private int knowledge;

	private int questionType;

	private int answerStageId;

	private String searchParam;

	public int getFieldId() {
		return fieldId;
	}

	public void setFieldId(int fieldId) {
		this.fieldId = fieldId;
	}

	public int getKnowledge() {
		return knowledge;
	}

	public void setKnowledge(int knowledge) {
		this.knowledge = knowledge;
	}

	public int getQuestionType() {
		return questionType;
	}

	public void setQuestionType(int questionType) {
		this.questionType = questionType;
	}

	public int getAnswerStageId() {
		return answerStageId;
	}

	public void setAnswerStageId(int answerStageId) {
		this.answerStageId = answerStageId;
	}

	public String getSearchParam() {
		return searchParam;
	}

	public void setSearchParam(String searchParam) {
		this.searchParam = searchParam;
	}

	public static long getSerialversionuid() {
		return serialVersionUID;
	}

}
