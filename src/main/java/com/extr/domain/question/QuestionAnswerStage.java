package com.extr.domain.question;

import java.io.Serializable;
import java.util.Date;

/**
 * 试题与答题人阶段的单选关系。
 */
public class QuestionAnswerStage implements Serializable {

	private static final long serialVersionUID = -5492992336155327158L;

	private int id;
	private int questionId;
	private int stageId;
	private String stageName;
	private int creator;
	private Date createTime;

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public int getQuestionId() {
		return questionId;
	}

	public void setQuestionId(int questionId) {
		this.questionId = questionId;
	}

	public int getStageId() {
		return stageId;
	}

	public void setStageId(int stageId) {
		this.stageId = stageId;
	}

	public String getStageName() {
		return stageName;
	}

	public void setStageName(String stageName) {
		this.stageName = stageName;
	}

	public int getCreator() {
		return creator;
	}

	public void setCreator(int creator) {
		this.creator = creator;
	}

	public Date getCreateTime() {
		return createTime;
	}

	public void setCreateTime(Date createTime) {
		this.createTime = createTime;
	}
}
