package com.extr.domain.question;

import java.io.Serializable;
import java.util.Date;

/**
 * 答题人阶段，用于标识题目适合的答题人能力阶段。
 */
public class AnswerStage implements Serializable {

	private static final long serialVersionUID = 8109363609131991220L;

	private int stageId;
	private String stageName;
	private Date createTime;
	private int creator;
	private String memo;
	private int state;
	private boolean removeable;

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

	public Date getCreateTime() {
		return createTime;
	}

	public void setCreateTime(Date createTime) {
		this.createTime = createTime;
	}

	public int getCreator() {
		return creator;
	}

	public void setCreator(int creator) {
		this.creator = creator;
	}

	public String getMemo() {
		return memo;
	}

	public void setMemo(String memo) {
		this.memo = memo;
	}

	public int getState() {
		return state;
	}

	public void setState(int state) {
		this.state = state;
	}

	public boolean isRemoveable() {
		return removeable;
	}

	public void setRemoveable(boolean removeable) {
		this.removeable = removeable;
	}
}
