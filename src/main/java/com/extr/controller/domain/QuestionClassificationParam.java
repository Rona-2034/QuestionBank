package com.extr.controller.domain;

import java.io.Serializable;

public class QuestionClassificationParam implements Serializable {

	private static final long serialVersionUID = -5531211798106072037L;

	private int pointId;
	private int answerStageId;

	public int getPointId() {
		return pointId;
	}

	public void setPointId(int pointId) {
		this.pointId = pointId;
	}

	public int getAnswerStageId() {
		return answerStageId;
	}

	public void setAnswerStageId(int answerStageId) {
		this.answerStageId = answerStageId;
	}
}
