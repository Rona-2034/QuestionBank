package com.extr.controller.domain;

import java.io.Serializable;
import java.util.List;

public class AnswerSheetItem implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = -2368220520552357878L;
	private float point;
	private int question_type_id;
	private String answer;
	private List<String> images;

	public int getQuestion_type_id() {
		return question_type_id;
	}

	public void setQuestion_type_id(int question_type_id) {
		this.question_type_id = question_type_id;
	}

	public float getPoint() {
		return point;
	}

	public void setPoint(float point) {
		this.point = point;
	}

	public String getAnswer() {
		return answer;
	}

	public void setAnswer(String answer) {
		this.answer = answer;
	}

	public List<String> getImages() {
		return images;
	}

	public void setImages(List<String> images) {
		this.images = images;
	}

}
